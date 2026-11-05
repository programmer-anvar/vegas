import mongoose from 'mongoose';
import { mongoUri, env } from '#config/env.js';
import * as logger from '#utils/logger.js';

export async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri);
    logger.info(`MongoDB Atlas ulanish o'rnatildi (${env} muhiti)`);
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB ulanish uzildi');
    });
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB xatosi: ${err.message}`);
    });
  } catch (error) {
    logger.error(`MongoDB ulanmadi: ${error.message}`);
    process.exit(1);
  }
}
