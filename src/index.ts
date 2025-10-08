import { KafkaConsumerService } from './services/kafka-consumer';
import { logger } from './utils/logger';
import { appConfig } from './config';

class ConsumerApplication {
  private kafkaConsumer: KafkaConsumerService;
  private isShuttingDown = false;

  constructor() {
    this.kafkaConsumer = new KafkaConsumerService();
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting SalesHQ Affiliate Consumer', {
        version: '1.0.0',
        nodeEnv: appConfig.server.nodeEnv,
        kafkaBrokers: appConfig.kafka.brokers,
        kafkaGroupId: appConfig.kafka.groupId,
      });

      // Connect to Kafka
      await this.kafkaConsumer.connect();

      // Start consuming messages
      await this.kafkaConsumer.startConsuming();

      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();

      // Log metrics periodically
      this.startMetricsLogging();

      logger.info('Consumer application started successfully');

    } catch (error) {
      logger.error('Failed to start consumer application', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress, ignoring signal', { signal });
        return;
      }

      this.isShuttingDown = true;
      logger.info('Received shutdown signal', { signal });

      try {
        // Disconnect from Kafka
        await this.kafkaConsumer.disconnect();
        logger.info('Consumer application shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', {
          error: error instanceof Error ? error.message : error,
        });
        process.exit(1);
      }
    };

    // Handle different termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        promise: promise.toString(),
      });
      shutdown('unhandledRejection');
    });
  }

  private startMetricsLogging(): void {
    // Log metrics every 30 seconds
    setInterval(() => {
      const metrics = this.kafkaConsumer.getMetrics();
      logger.info('Consumer metrics', {
        totalEvents: metrics.totalEvents,
        processedEvents: metrics.processedEvents,
        failedEvents: metrics.failedEvents,
        lastEventTime: metrics.lastEventTime,
        uptime: Date.now() - new Date(metrics.startTime).getTime(),
        isConnected: metrics.isConnected,
        isConsuming: metrics.isConsuming,
      });
    }, 30000);
  }
}

// Start the application
const app = new ConsumerApplication();
app.start().catch((error) => {
  logger.error('Failed to start application', {
    error: error instanceof Error ? error.message : error,
  });
  process.exit(1);
});
