/**
 * Storj configuration
 */
export const STORJ_CONFIG = {
    get STORJ_ACCESS_KEY() {
        return process.env.STORJ_ACCESS_KEY;
    },
    get STORJ_SECRET_KEY() {
        return process.env.STORJ_SECRET_KEY;
    },
    get STORJ_API_ENDPOINT() {
        return process.env.STORJ_API_ENDPOINT;
    },
    get STORJ_BUCKET() {
        return process.env.STORJ_BUCKET;
    },
    get STORJ_REGION() {
        return process.env.STORJ_REGION || 'us-east-1';
    },
    // Share key for public URL generation
    get STORJ_SHARE_DOWNLOAD_KEY() {
        return process.env.STORJ_SHARE_DOWNLOAD_KEY;
    },
};