#!/bin/bash

# Run a command in all sub-projects
# Usage: ./run-all.sh <command>
# Example: ./run-all.sh "yarn install"

set -e

COMMAND="$@"

if [ -z "$COMMAND" ]; then
    echo "Usage: ./run-all.sh <command>"
    echo "Example: ./run-all.sh yarn install"
    exit 1
fi

echo "================================================"
echo "Running: $COMMAND"
echo "================================================"

# Run in backend
echo ""
echo "🔷 Running in bakery-cms-api..."
echo "================================================"
cd bakery-cms-api
eval "$COMMAND"
cd ..

# Run in frontend
echo ""
echo "🔷 Running in bakery-cms-web..."
echo "================================================"
cd bakery-cms-web
eval "$COMMAND"
cd ..

echo ""
echo "✅ Done running in all projects!"
