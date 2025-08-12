/**
 * Queue-related utility helpers
 */
const QueueUtils = {
    /**
     * Sanitizes an identifier (email/mobile) for file naming and job IDs
     * - For emails, replaces '@' with '_' and trims after the first dot
     * - For other identifiers, returns as-is
     * @param {string} identifier
     * @returns {string}
     */
    sanitizeIdentifier: (identifier) => {
        if (!identifier) {
            throw new Error('Missing required identifier for sanitization');
        }

        let sanitized = String(identifier).trim();
        if (sanitized.includes('@')) {
            sanitized = sanitized.replace('@', '_').split('.')[0];
        }
        return sanitized;
    },

    /**
     * Generates a job ID for a given identifier
     * @param {string} identifier - User identifier (email or mobile)
     * @returns {string}
     */
    generateJobId: (identifier) => {
        const base = QueueUtils.sanitizeIdentifier(identifier || 'unknown');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const random = Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        return `${base}_${random}`;
    },
};


export { QueueUtils };
