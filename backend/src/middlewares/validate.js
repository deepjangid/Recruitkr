import { ZodError } from 'zod';

import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, target = 'body') => (req, _res, next) => {
  try {
    req[target] = schema.parse(req[target]);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(400, 'Validation failed', error.issues));
    }
    return next(error);
  }
};

