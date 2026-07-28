import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../../app/app';
import { closePool } from '../../../app/database/connection';

let server: Server | null = null;
let baseUrl = '';

export function getBaseUrl(): string {
  return baseUrl;
}

export async function startTestServer(): Promise<string> {
  if (baseUrl) return baseUrl;
  const app = createApp();
  server = createServer(app);
  await new Promise<void>((resolve) => {
    server!.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
  return baseUrl;
}

export async function stopTestServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((err) => (err ? reject(err) : resolve()));
    });
    server = null;
    baseUrl = '';
  }
  await closePool();
}
