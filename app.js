import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { logger } from "./utils/index.js";
import { ENTITY_PREFIXES, LOG_ACTIONS } from "./constants.js";
import { routes } from "./routes/index.js";

// Import routes

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

logger.info(`${ENTITY_PREFIXES.APP} ${LOG_ACTIONS.SETUP} Express app initialized`);

// Routes
app.get("/", (req, res) => {
  logger.info(`${ENTITY_PREFIXES.API} ${LOG_ACTIONS.INFO} GET /`);
  res.json({
    success: true,
    message: "Welcome to the Flipkart Scraper!",
    description:
      "This is the backend API for Flipkart seller automation.",
    version: process.env.npm_package_version,
  });
});

app.get("/health", (req, res) => {
  logger.info(`${ENTITY_PREFIXES.API} ${LOG_ACTIONS.INFO} GET /health`);
  res.status(200).json({
    success: true,
    message: "Flipkart Scrape Farm API is healthy and running.",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime_seconds: process.uptime(),
    memory_usage_bytes: process.memoryUsage(),
  });
});

// API routes
app.use("/", routes);

export { app };
