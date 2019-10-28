const errorResponse = require('../utils/errorResponse');

const errorHandler = (err, rea, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  console.log(err);
  
  // Mongoose bad object ID
  if(err.name === 'CastError'){
    const message = `Resource not found with id of ${err.value}`;
    error = new errorResponse(message, 404);
  }
  
  // Mongoose duplicate key
  if(err.code === 11000){
    const message = 'Duplicated field value entered';
    error = new errorResponse(message, 400);
  }
  
  // Mongoose validation errors
  if(err.name === 'ValidationError'){
    const message = Object.values(err.errors).map(val => val.message);
    error = new errorResponse(message, 400);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server error'
  })
};

module.exports = errorHandler;