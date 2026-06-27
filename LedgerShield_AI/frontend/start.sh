#!/bin/bash

# LedgerShield_AI Frontend - Quick Start Script

echo "================================"
echo "LedgerShield_AI - Frontend Setup"
echo "================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed."
fi

echo ""
echo "================================"
echo "Starting Development Server"
echo "================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo ""
echo "Make sure your backend API is running!"
echo ""

npm run dev
