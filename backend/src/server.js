import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

const bootstrap = async () => {
  await connectDb();

  app.listen(env.PORT, () => {
    console.log(`Backend running on port ${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

