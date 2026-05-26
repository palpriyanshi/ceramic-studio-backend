import { createClient } from "redis";

let client = null;

const createMockRedis = () => ({
  isMock: true,
  connect: async () => {},
  on: () => {},
  get: async () => null,
  setEx: async () => "OK",
  keys: async () => [],
  del: async () => 0,
});

export async function connectRedis() {
  if (client) return client;

  if (!process.env.REDIS_URL) {
    console.log("Redis not configured (REDIS_URL is missing). Using mock Redis client.");
    client = createMockRedis();
    return client;
  }

  try {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (err) => {
      if (client && client.isMock) return;
      console.error("Redis error:", err.message);
    });

    await client.connect();
    console.log("Redis connected");
  } catch (err) {
    console.error("Failed to connect to Redis, falling back to mock client:", err.message);
    client = createMockRedis();
  }

  return client;
}

export function getRedisClient() {
  if (!client) {
    client = createMockRedis();
  }
  return client;
}

export default { connectRedis, getRedisClient };
