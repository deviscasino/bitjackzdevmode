#!/bin/bash

# BitJackz Casino - Universal Start Script

echo "Starting BitJackz Casino..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Please edit .env file with your database credentials and other configuration."
    else
        echo "Error: .env.example file not found. Please create a .env file with your configuration."
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Push database schema
echo "Setting up database..."
npm run db:push

# Build the application
echo "Building application..."
npm run build

# Start the application
echo "Starting application on port ${PORT:-5000}..."
npm start