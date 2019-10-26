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