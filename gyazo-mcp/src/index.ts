#!/usr/bin/env node

import { GyazoMCPServer } from './server.js';

async function main() {
  const accessToken = process.env.GYAZO_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('Error: GYAZO_ACCESS_TOKEN environment variable is required');
    console.error('Please set your Gyazo access token in the environment or .env file');
    process.exit(1);
  }

  try {
    const server = new GyazoMCPServer(accessToken);
    await server.run();
  } catch (error) {
    console.error('Failed to start Gyazo MCP server:', error);
    process.exit(1);
  }
}

main();
