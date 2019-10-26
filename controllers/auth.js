const User = require('../models/User');
const errorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register user
// @route   POST /api/v1/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { role, name, password, email } = req.body;
  
  const user = await User.create({
    name,
    password,
    role,
    email
  });
  
  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { password, email } = req.body;
  
  // Validate
  if(!password || !email){
    return next(new errorResponse('Please provide an email & password', 400))
  }
  
  // Check for user
  const user = await User.findOne({email}).select('+password');
  
  if(!user){
    return next(new errorResponse('Invalid credentials', 401))
  }
  
  const isMatch = await user.matchPassword(password);
  
  if(!isMatch){
    return next(new errorResponse('Invalid credentials', 401))
  }
  
  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };
  
  if(process.env.NODE_ENV === 'production'){
    options.secure = true
  }
  
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    })
};

// @desc    Get current logged user
// @route   GET /api/v1/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: req.user
  })
});