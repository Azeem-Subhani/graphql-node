const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const  User  = require('../models/User');

const generateToken = (user) => {
  return jwt.sign({ userId: user._id }, "TODOGQL", { expiresIn: '1h' });
};

const authenticateUser = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid email or password');
    console.log("user", user)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password');
    return generateToken(user);
  } catch(error) {
    console.log("While Authenticating user", error);
  }
};

const authMiddleware = async (token) => {
  try {
    const decoded = jwt.verify(token, "TODOGQL");
    const user = await User.findById(decoded.userId);
    return user;
  } catch(error) {
    console.log("While Auth Middleware", error);
    throw error;
  }
}

module.exports = {
  generateToken, authenticateUser, authMiddleware
}