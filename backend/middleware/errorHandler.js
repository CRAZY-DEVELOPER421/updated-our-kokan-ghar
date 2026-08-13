const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return ApiResponse.error(res, err.message, 400);
  }

  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return ApiResponse.error(res, 'Unauthorized access.', 401);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return ApiResponse.error(res, 'Duplicate entry. This record already exists.', 409);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return ApiResponse.error(res, 'Referenced record not found.', 400);
  }

  if (err.type === 'entity.parse.failed') {
    return ApiResponse.error(res, 'Invalid JSON in request body.', 400);
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.error(res, 'File too large. Maximum size is 5MB.', 400);
    }
    return ApiResponse.error(res, err.message, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error.'
    : err.message || 'Internal server error.';

  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;
