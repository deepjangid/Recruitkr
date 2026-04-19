import { StatusCodes } from 'http-status-codes';

export const notFoundHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    console.error(error);
  }

  const response = {
    success: false,
    message: error.message || 'Internal server error',
  };

  if (error.details) {
    response.details = error.details;
  }

  res.status(statusCode).json(response);
};

