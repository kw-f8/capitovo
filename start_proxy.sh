#!/bin/bash

# Start capitovo API Proxy Server

echo "🚀 Starting capitovo API Proxy..."
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3."
    exit 1
fi

# Start proxy server
cd "$(dirname "$0")"
python3 api_proxy.py
