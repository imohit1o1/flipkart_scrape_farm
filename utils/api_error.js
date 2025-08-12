class ApiError extends Error {
    constructor(type, message, jobId = null, details = {}) {
        super(message);
        this.name = 'ApiError';
        this.type = type;
        this.jobId = jobId;
        this.details = details;
        this.timestamp = new Date().toISOString();
    };
};

export { ApiError }; 