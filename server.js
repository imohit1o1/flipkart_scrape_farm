import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { logger } from "./utils/index.js";
import { connectDB } from "./db/connect_db.js";
import { ENTITY_PREFIXES, LOG_ACTIONS } from "./constants.js";

const PORT = Number(process.env.PORT) || 8000;

// Extracted reusable process handlers setup
const setupProcessHandlers = (server) => {
  const gracefulShutdown = (signal) => {
    logger.info(`${ENTITY_PREFIXES.SERVER} ${LOG_ACTIONS.SHUTDOWN} ${signal} received, shutting down gracefully...`);
    server.close(() => {
      logger.info(`${ENTITY_PREFIXES.SERVER} ${LOG_ACTIONS.CLOSED} HTTP server closed`);
      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    logger.error(`${ENTITY_PREFIXES.SERVER} ${LOG_ACTIONS.ERROR} Unhandled Rejection:`, reason);
  });

  process.on("uncaughtException", (error) => {
    logger.error(`${ENTITY_PREFIXES.SERVER} ${LOG_ACTIONS.ERROR} Uncaught Exception:`, error);
    process.exit(1);
  });
};

const startServer = async () => {
  try {
    // Ensure DB connects after env is loaded
    await connectDB();

    // Import the app AFTER env is loaded to ensure proper initialization order
    const { app } = await import("./app.js");
    
    const server = app.listen(PORT, () => {
        logger.info(`${ENTITY_PREFIXES.SERVER} ${LOG_ACTIONS.STARTED} Server is running on port ${PORT}`);
    });

    // Register process handlers via reusable function
    setupProcessHandlers(server);
  } catch (error) {
    logger.error(`${ENTITY_PREFIXES.SERVER} ${LOG_ACTIONS.FAILED} Failed to start server:`, error);
    process.exit(1);
  }
};

startServer();
