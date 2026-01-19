import Redis from 'ioredis';

const getRedisUrl = () => {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL environment variable is not set');
  }
  return url;
};

// Parse Redis URL into connection options for BullMQ
export const getRedisConnectionOptions = () => {
  const url = new URL(getRedisUrl());

  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  };
};

// Create a Redis connection for general use
export const createRedisConnection = () => {
  const url = getRedisUrl();

  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

// Singleton connection for general use
let redisClient: Redis | null = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createRedisConnection();
  }
  return redisClient;
};
