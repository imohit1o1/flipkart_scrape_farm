import { validationResult } from 'express-validator';
import { ApiError } from '../utils/index.js';

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formatted = errors.array().map(err => ({
    field: err.param,
    message: err.msg,
    value: err.value,
    location: err.location,
  }));

  const error = new ApiError('VALIDATION_ERROR', 'Request validation failed', null, { errors: formatted });
  return res.status(400).json({
    name: error.name,
    type: error.type,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp,
  });
};

export { validationMiddleware };
