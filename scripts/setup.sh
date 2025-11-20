#!/bin/bash

echo "========================================"
echo "Discord Auto Quest - Setup Script"
echo "========================================"
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please download and install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "Node.js found!"
node --version
echo ""

# Check npm
echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed!"
    exit 1
fi

echo "npm found!"
npm --version
echo ""

# Install dependencies
echo "Installing dependencies..."
echo "This may take a few minutes..."
echo ""
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install dependencies!"
    echo "Try running: npm cache clean --force"
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo ""
echo "To start the application in development mode:"
echo "  npm run dev"
echo ""
echo "To build:"
echo "  npm run build:mac   (macOS)"
echo "  npm run build:linux (Linux)"
echo ""

