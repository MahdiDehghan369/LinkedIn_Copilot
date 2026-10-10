import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { logger } from '../logger/index.js';

const dbLogger = logger.child({ module: 'mongodb' });

let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    dbLogger.info('MongoDB connected', { host: mongoose.connection.host, name: mongoose.connection.name });
  });
  mongoose.connection.on('error', (error) => {
    dbLogger.error('MongoDB connection error', { error });
  });
  mongoose.connection.on('disconnected', () => {
    dbLogger.warn('MongoDB disconnected');
  });
}

export async function connectMongo() {
  attachConnectionListeners();
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
  });
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
