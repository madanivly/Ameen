#!/bin/bash

# Setup Vercel Environment Variables for Ameen Project
# This script adds the required Google Sheets credentials to your Vercel project

echo "🔧 Setting up Vercel environment variables for Ameen project..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

# Verify we're logged in to Vercel
echo "📋 Checking Vercel authentication..."
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

echo "✅ Vercel CLI authenticated"
echo ""

# Get the Google Sheets credentials from .env
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with the following content:"
    echo "   GOOGLE_SHEET_ID=19l12-Y2iGmmgENxRxhCHMUQvAJLxqiGu3qVQcMuoAVk"
    echo "   GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-api-connector@sonorous-crane-480719-b3.iam.gserviceaccount.com"
    echo "   GOOGLE_PRIVATE_KEY=\"...\""
    exit 1
fi

# Extract values from .env
GOOGLE_SHEET_ID=$(grep "^GOOGLE_SHEET_ID=" .env | cut -d'=' -f2)
GOOGLE_SERVICE_ACCOUNT_EMAIL=$(grep "^GOOGLE_SERVICE_ACCOUNT_EMAIL=" .env | cut -d'=' -f2)
GOOGLE_PRIVATE_KEY=$(grep "^GOOGLE_PRIVATE_KEY=" .env | cut -d'=' -f2 | sed 's/"//g')

if [ -z "$GOOGLE_SHEET_ID" ] || [ -z "$GOOGLE_SERVICE_ACCOUNT_EMAIL" ] || [ -z "$GOOGLE_PRIVATE_KEY" ]; then
    echo "❌ Missing environment variables in .env file"
    exit 1
fi

echo "📝 Environment variables found:"
echo "   - GOOGLE_SHEET_ID: ${GOOGLE_SHEET_ID:0:20}..."
echo "   - GOOGLE_SERVICE_ACCOUNT_EMAIL: ${GOOGLE_SERVICE_ACCOUNT_EMAIL:0:30}..."
echo ""

echo "🚀 Adding environment variables to Vercel..."
echo ""

# Add each environment variable to Vercel
vercel env add GOOGLE_SHEET_ID <<< "$GOOGLE_SHEET_ID" --production
if [ $? -ne 0 ]; then
    echo "⚠️  Failed to add GOOGLE_SHEET_ID (it may already exist)"
fi

vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL <<< "$GOOGLE_SERVICE_ACCOUNT_EMAIL" --production
if [ $? -ne 0 ]; then
    echo "⚠️  Failed to add GOOGLE_SERVICE_ACCOUNT_EMAIL (it may already exist)"
fi

vercel env add GOOGLE_PRIVATE_KEY <<< "$GOOGLE_PRIVATE_KEY" --production
if [ $? -ne 0 ]; then
    echo "⚠️  Failed to add GOOGLE_PRIVATE_KEY (it may already exist)"
fi

echo ""
echo "✅ Environment variables have been added to Vercel!"
echo ""
echo "📦 Next steps:"
echo "   1. Go to https://vercel.com/dashboard"
echo "   2. Select the 'Ameen' project"
echo "   3. Go to Deployments"
echo "   4. Click 'Redeploy' on the latest deployment"
echo ""
echo "🎉 After redeployment, real-time data synchronization will be active!"