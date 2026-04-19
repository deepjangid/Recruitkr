import mongoose from 'mongoose';

import { Application } from '../models/Application.js';
import { env } from './env.js';

export const connectDb = async () => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10000,
  });

  // Keep application indexes aligned without forcing unrelated legacy collections
  // to rebuild unique indexes during startup.
  await Application.syncIndexes();
};

