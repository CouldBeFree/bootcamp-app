const User = require('../models/User');
const errorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

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

// @desc    Get current logged user
// @route   GET /api/v1/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: user
  })
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };
  
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: user
  })
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  
  // Check current password
  if(!(await user.matchPassword(req.body.currentPassword))){
    return next(new errorResponse('Password is incorrect', 401))
  }
  
  user.password = req.body.newPassword;
  await user.save();
  
  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  
  if(!user){
    return next(new errorResponse('There is no user with this email', 404))
  }
  
  // Get reset token
  const resetToken = await user.getResetPasswordToken();
  
  await user.save({ validateBeforeSave: false });
  
  // Create user url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
  
  const message = `Please make put request to ${resetUrl}`;
  
  try{
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });
    
    res.status(200).json({success: true, data: 'Email sent'})
  }catch (e) {
    console.error(e);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save({ validateBeforeSave: false });
    return next(new errorResponse('Email could not be sent', 500))
  }
  
  res.status(200).json({
    success: true,
    data: user
  })
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

// @desc    Reset password
// @route   PUT /api/v1/reset-password/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if(!user){
    return next(new errorResponse('Invalid token', 400));
  }
  
  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordToken = undefined;
  await user.save();
  
  sendTokenResponse(user, 200, res);
});