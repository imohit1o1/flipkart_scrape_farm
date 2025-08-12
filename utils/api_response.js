/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @returns {Object} Response object
 */
const ApiResponse = (
    res,
    statusCode = 200,
    message = "Operation successful",
    data = {},
) => {
    const isSuccess = statusCode >= 200 && statusCode < 400;

    const response = {
        success: isSuccess,
        message,
    };

    // For success responses, add data
    // For error responses, data contains error information
    if (isSuccess) {
        response.data = data;
    } else if (data && data.error) {
        response.error = data.error;
        if (data.details) {
            response.details = data.details;
        }
    } else {
        // If data is null or undefined, provide a default error
        if (data === null || data === undefined) {
            response.error = "INTERNAL_SERVER_ERROR";
            response.details = {};
        } else {
            response.data = data;
        }
    }

    return res.status(statusCode).json(response);
};

export { ApiResponse };
