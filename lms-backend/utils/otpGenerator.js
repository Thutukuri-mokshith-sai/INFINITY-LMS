// utils/otpGenerator.js
const crypto = require('crypto');

const generateOTP = () => {
  // Generates a 6-digit random number as a string
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = generateOTP;