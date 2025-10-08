#!/bin/bash

# SalesHQ Affiliate Consumer Startup Script

echo "🚀 Starting SalesHQ Affiliate Consumer..."
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "✅ Created .env file. Please update with your Kafka configuration."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Start the consumer
echo "🎯 Starting consumer service..."
npm start
