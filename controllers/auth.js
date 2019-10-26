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
  
  const token = user.getSignedJwtToken();
  
  res.status(200).json({
    success: true,
    token
  })
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
  
  const token = user.getSignedJwtToken();
  
  res.status(200).json({
    success: true,
    token
  })
});