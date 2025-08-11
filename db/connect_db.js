import mongoose from "mongoose";
import { logger } from "../utils/index.js";
import { ENTITY_PREFIXES, LOG_ACTIONS } from "../constants.js";
import { DB_CONFIG } from "../config/index.js";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(DB_CONFIG.url);
        logger.info(`${ENTITY_PREFIXES.DB} ${LOG_ACTIONS.CONNECTED} MongoDB Connected: ${connection.connection.host}`);
        return connection;
    } catch (error) {
        logger.error(`${ENTITY_PREFIXES.DB} ${LOG_ACTIONS.ERROR} Error connecting to MongoDB: ${error.message}`);
        throw error;
    }
};

export { connectDB };
