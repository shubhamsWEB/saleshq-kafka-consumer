import { KafkaConsumerService } from '../services/kafka-consumer';

// Mock kafkajs
jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    consumer: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
    }),
    admin: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      describeGroups: jest.fn().mockResolvedValue({}),
    }),
  })),
}));

describe('KafkaConsumerService', () => {
  let consumerService: KafkaConsumerService;

  beforeEach(() => {
    consumerService = new KafkaConsumerService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(consumerService).toBeInstanceOf(KafkaConsumerService);
    });
  });

  describe('connect', () => {
    it('should connect to Kafka successfully', async () => {
      await expect(consumerService.connect()).resolves.not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Kafka successfully', async () => {
      await expect(consumerService.disconnect()).resolves.not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return consumer metrics', () => {
      const metrics = consumerService.getMetrics();
      
      expect(metrics).toHaveProperty('totalEvents');
      expect(metrics).toHaveProperty('processedEvents');
      expect(metrics).toHaveProperty('failedEvents');
      expect(metrics).toHaveProperty('startTime');
      expect(metrics).toHaveProperty('isConnected');
      expect(metrics).toHaveProperty('isConsuming');
      
      expect(typeof metrics.totalEvents).toBe('number');
      expect(typeof metrics.processedEvents).toBe('number');
      expect(typeof metrics.failedEvents).toBe('number');
      expect(typeof metrics.isConnected).toBe('boolean');
      expect(typeof metrics.isConsuming).toBe('boolean');
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status', () => {
      const status = consumerService.getHealthStatus();
      expect(['connected', 'disconnected', 'unknown']).toContain(status);
    });
  });

  describe('getConsumerGroupInfo', () => {
    it('should return consumer group information', async () => {
      await expect(consumerService.getConsumerGroupInfo()).resolves.toBeDefined();
    });
  });
});
