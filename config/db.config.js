/**
 * DB Configuration
 */
const DB_CONFIG = {
    get url() {
        return process.env.MONGODB_URI;
    },
};

export { DB_CONFIG };