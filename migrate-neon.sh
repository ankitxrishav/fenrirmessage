#!/bin/bash

# Set the DATABASE_URL to NEON_DATABASE_URL for drizzle migration
export DATABASE_URL=$NEON_DATABASE_URL

# Run the migration
npx drizzle-kit push

echo "Migration to Neon database complete!"