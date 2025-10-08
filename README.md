# SalesHQ Affiliate Consumer

A Kafka consumer service that processes Shopify analytics events from the SalesHQ Affiliate Producer. This service listens to the `custom-pixel-analytics-analytics-events` topic and logs all consumed events with detailed information.

## Features

- **Kafka Consumer**: Listens to analytics events from the producer
- **Structured Logging**: Comprehensive logging with Winston
- **Error Handling**: Robust error handling and recovery
- **Metrics**: Real-time metrics and health monitoring
- **Docker Support**: Containerized deployment
- **TypeScript**: Full TypeScript support with strict typing
- **Graceful Shutdown**: Proper cleanup on termination signals

## Architecture

```
Producer (saleshq-affiliate-producer) 
    ↓ (Kafka)
Consumer (saleshq-affiliate-consumer)
    ↓ (Future: Database)
PostgreSQL Database
```

## Prerequisites

- Node.js 18+ (use nvm to manage versions)
- Kafka cluster (or Docker Compose setup)
- TypeScript knowledge

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone and navigate to the consumer directory:**
   ```bash
   cd /Users/shubamagrawal/Documents/saleshq-affiliate-consumer
   ```

2. **Start the entire stack:**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - Zookeeper
   - Kafka
   - Kafka UI (accessible at http://localhost:8080)
   - Consumer service

3. **View logs:**
   ```bash
   docker-compose logs -f consumer
   ```

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your Kafka configuration
   ```

3. **Build the application:**
   ```bash
   npm run build
   ```

4. **Start the consumer:**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `KAFKA_BROKERS` | Kafka broker addresses | `localhost:9092` |
| `KAFKA_CLIENT_ID` | Kafka client ID | `custom-pixel-analytics-consumer` |
| `KAFKA_GROUP_ID` | Consumer group ID | `custom-pixel-analytics-consumer-group` |
| `LOG_LEVEL` | Logging level | `info` |
| `LOG_FORMAT` | Log format (json/simple) | `json` |
| `TOPIC_PREFIX` | Kafka topic prefix | `custom-pixel-analytics` |

### Kafka Topics

The consumer listens to the following topics:
- `custom-pixel-analytics-analytics-events`

## Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build the application
npm run build

# Start production build
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

### Project Structure

```
src/
├── config/           # Configuration management
├── services/         # Kafka consumer service
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (logger)
└── index.ts         # Main application entry point
```

## Monitoring

### Logs

The consumer generates structured logs in the following locations:
- Console output
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Metrics

The consumer tracks the following metrics:
- Total events consumed
- Successfully processed events
- Failed events
- Last event timestamp
- Uptime
- Connection status

### Health Monitoring

The consumer provides health status information:
- Kafka connection status
- Consumer group status
- Processing metrics

## Testing with Producer

1. **Start the producer** (in the producer directory):
   ```bash
   cd /Users/shubamagrawal/Documents/saleshq-affiliate-producer
   npm run dev
   ```

2. **Start the consumer** (in the consumer directory):
   ```bash
   cd /Users/shubamagrawal/Documents/saleshq-affiliate-consumer
   npm run dev
   ```

3. **Send test events** to the producer's `/custom-pixel` endpoint:
   ```bash
   curl -X POST http://localhost:3000/custom-pixel \
     -H "Content-Type: application/json" \
     -H "x-shopify-shop-domain: test-shop.myshopify.com" \
     -H "x-shopify-webhook-id: test-webhook-123" \
     -d '{
       "event_type": "page_viewed",
       "session_id": "session-123",
       "user_id": "user-456",
       "page_url": "https://test-shop.myshopify.com/products/test-product",
       "timestamp": "2025-01-27T10:00:00Z"
     }'
   ```

4. **Check consumer logs** to see the event being processed.

## Docker Commands

```bash
# Build the consumer image
docker build -t saleshq-affiliate-consumer .

# Run the consumer container
docker run --env-file .env saleshq-affiliate-consumer

# View container logs
docker logs saleshq-affiliate-consumer

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Troubleshooting

### Common Issues

1. **Consumer not connecting to Kafka:**
   - Check Kafka broker addresses in environment variables
   - Ensure Kafka is running and accessible
   - Verify network connectivity

2. **No messages being consumed:**
   - Check if the producer is sending messages
   - Verify topic names match between producer and consumer
   - Check consumer group configuration

3. **High memory usage:**
   - Monitor consumer lag
   - Adjust batch size and processing speed
   - Check for memory leaks in event processing

### Debug Mode

Set `LOG_LEVEL=debug` in your environment variables for detailed logging.

## Future Enhancements

- [ ] PostgreSQL database integration
- [ ] Event deduplication
- [ ] Batch processing
- [ ] Dead letter queue handling
- [ ] Prometheus metrics export
- [ ] REST API for health checks
- [ ] Event filtering and routing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
