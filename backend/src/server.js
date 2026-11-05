import app from './app.js';
import { connectDB } from '#config/db.js';
import { port } from '#config/env.js';
import * as logger from '#utils/logger.js';
async function startServer() {
  await connectDB();

  app.listen(port, () => {
    logger.info(`Server ${port}-portda ishga tushdi`);
  });
}
startServer();
