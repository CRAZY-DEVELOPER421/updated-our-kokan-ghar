class ApiResponse {
  static success(res, data = {}, message = 'Success', statusCode = 200, pagination = null) {
    const response = {
      success: true,
      message,
      data
    };
    if (pagination) {
      response.pagination = pagination;
    }
    return res.status(statusCode).json(response);
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null, extra = null) {
    const response = {
      success: false,
      message
    };
    if (errors) {
      response.errors = errors;
    }
    // Optional structured metadata (e.g. suspension details: code, suspendUntil,
    // permanent) so the frontend can react precisely instead of parsing text.
    if (extra && typeof extra === 'object') {
      Object.assign(response, extra);
    }
    return res.status(statusCode).json(response);
  }

  static created(res, data = {}, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static paginated(res, data, pagination, message = 'Success') {
    return ApiResponse.success(res, data, message, 200, pagination);
  }
}

module.exports = ApiResponse;
