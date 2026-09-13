import Redis from 'ioredis';
import { config } from '../config';

export const redisClient = new Redis(config.redisUrl);
export const redisSubscriber = new Redis(config.redisUrl);
