import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { appConfig } from '../config';
import { logger } from '../utils/logger';
import { CustomPixelEvent, ConsumerMetrics } from '../types';

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private isConsuming = false;
  private metrics: ConsumerMetrics = {
    totalEvents: 0,
    processedEvents: 0,
    failedEvents: 0,
    startTime: new Date().toISOString(),
  };

  // Topics to consume from
  private readonly topics = [
    `${appConfig.kafka.topicPrefix}-analytics-events`,
  ];

  constructor() {
    this.kafka = new Kafka({
      clientId: appConfig.kafka.clientId,
      brokers: appConfig.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: appConfig.kafka.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576, // 1MB
      allowAutoTopicCreation: false,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      logger.info('Connected to Kafka cluster', {
        brokers: appConfig.kafka.brokers,
        clientId: appConfig.kafka.clientId,
        groupId: appConfig.kafka.groupId,
      });
    } catch (error) {
      logger.error('Failed to connect to Kafka', { 
        error: error instanceof Error ? error.message : error 
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConsuming) {
        await this.consumer.stop();
        this.isConsuming = false;
      }
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from Kafka cluster');
    } catch (error) {
      logger.error('Error disconnecting from Kafka', { 
        error: error instanceof Error ? error.message : error 
      });
    }
  }

  async startConsuming(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka consumer is not connected');
    }

    if (this.isConsuming) {
      logger.warn('Consumer is already consuming messages');
      return;
    }

    try {
      // Subscribe to topics
      await this.consumer.subscribe({ 
        topics: this.topics,
        fromBeginning: false 
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.isConsuming = true;
      logger.info('Started consuming messages', {
        topics: this.topics,
        groupId: appConfig.kafka.groupId,
      });
    } catch (error) {
      logger.error('Failed to start consuming messages', {
        error: error instanceof Error ? error.message : error,
        topics: this.topics,
      });
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    
    try {
      this.metrics.totalEvents++;
      
      // Parse the message
      const messageValue = message.value?.toString();
      if (!messageValue) {
        logger.warn('Received empty message', {
          topic,
          partition,
          offset: message.offset,
        });
        return;
      }

      const event: CustomPixelEvent = JSON.parse(messageValue);
      
      // Log the consumed event with detailed information
      logger.info('Consumed analytics event', {
        topic,
        partition,
        offset: message.offset,
        eventId: event.id,
        eventType: event.topic,
        shop: event.shop,
        webhookId: event.webhookId,
        timestamp: event.timestamp,
        apiVersion: event.apiVersion,
        payload: event.payload,
        messageHeaders: message.headers,
        messageKey: message.key?.toString(),
        messageTimestamp: message.timestamp,
      });

      // Process the event (for now, just log it)
      await this.processEvent(event);

      this.metrics.processedEvents++;
      this.metrics.lastEventTime = new Date().toISOString();

    } catch (error) {
      this.metrics.failedEvents++;
      logger.error('Failed to process message', {
        topic,
        partition,
        offset: message.offset,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  private async processEvent(event: CustomPixelEvent): Promise<void> {
    try {
      // Log event processing details
      logger.info('Processing analytics event', {
        eventId: event.id,
        eventType: event.topic,
        shop: event.shop,
        webhookId: event.webhookId,
        payloadKeys: Object.keys(event.payload),
        payloadSize: JSON.stringify(event.payload).length,
      });

      // TODO: Add database storage logic here
      // For now, we'll just log the event processing
      logger.info('Event processed successfully', {
        eventId: event.id,
        eventType: event.topic,
        shop: event.shop,
      });

    } catch (error) {
      logger.error('Failed to process event', {
        eventId: event.id,
        eventType: event.topic,
        shop: event.shop,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  getMetrics(): ConsumerMetrics & { isConnected: boolean; isConsuming: boolean } {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      isConsuming: this.isConsuming,
    };
  }

  getHealthStatus(): 'connected' | 'disconnected' | 'unknown' {
    return this.isConnected ? 'connected' : 'disconnected';
  }

  // Method to get consumer group information
  async getConsumerGroupInfo(): Promise<any> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      
      const groupInfo = await admin.describeGroups([appConfig.kafka.groupId]);
      await admin.disconnect();
      
      return groupInfo;
    } catch (error) {
      logger.error('Failed to get consumer group info', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}

export default KafkaConsumerService;
