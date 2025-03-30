const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error object
  let error = {
    success: false,
    error: err.message || 'Server Error',
    statusCode: err.statusCode || 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message);
    error.statusCode = 400;
  }

  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message
  });
};

module.exports = errorHandler;

