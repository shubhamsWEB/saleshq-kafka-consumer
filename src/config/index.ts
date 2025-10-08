import { config } from 'dotenv';
import Joi from 'joi';
import { AppConfig } from '../types';

// Load environment variables
config();

const configSchema = Joi.object({
  // Server Configuration
  PORT: Joi.number().port().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  
  // Kafka Configuration
  KAFKA_BROKERS: Joi.string().required(),
  KAFKA_CLIENT_ID: Joi.string().default('custom-pixel-analytics-consumer'),
  KAFKA_GROUP_ID: Joi.string().default('custom-pixel-analytics-consumer-group'),
  
  // Logging Configuration
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('json'),
  
  // Kafka Topics Configuration
  TOPIC_PREFIX: Joi.string().default('custom-pixel-analytics'),
  TOPIC_PARTITIONS: Joi.number().default(3),
  TOPIC_REPLICATION_FACTOR: Joi.number().default(1),
});

const { error, value: envVars } = configSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true,
});

if (error) {
  throw new Error(`Configuration validation error: ${error.message}`);
}

export const appConfig: AppConfig = {
  server: {
    port: envVars.PORT,
    nodeEnv: envVars.NODE_ENV,
    logLevel: envVars.LOG_LEVEL,
    logFormat: envVars.LOG_FORMAT,
  },
  kafka: {
    brokers: envVars.KAFKA_BROKERS.split(',').map((broker: string) => broker.trim()),
    clientId: envVars.KAFKA_CLIENT_ID,
    groupId: envVars.KAFKA_GROUP_ID,
    topicPrefix: envVars.TOPIC_PREFIX,
    partitions: envVars.TOPIC_PARTITIONS,
    replicationFactor: envVars.TOPIC_REPLICATION_FACTOR,
  },
};

export default appConfig;
