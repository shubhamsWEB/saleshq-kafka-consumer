export interface CustomPixelEvent {
  id: string;
  topic: string;
  shop: string;
  payload: Record<string, any>;
  timestamp: string;
  apiVersion: string;
  webhookId: string;
}

export interface KafkaMessage {
  key: string;
  value: CustomPixelEvent;
  headers?: Record<string, string>;
  timestamp?: number;
}

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
  topicPrefix: string;
  partitions: number;
  replicationFactor: number;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  logFormat: string;
}

export interface AppConfig {
  server: ServerConfig;
  kafka: KafkaConfig;
}

export interface ConsumerMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  lastEventTime?: string;
  startTime: string;
}

export interface EventProcessor {
  topic: string;
  process(event: CustomPixelEvent): Promise<void>;
}
