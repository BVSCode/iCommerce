const generateOTP = otpLength => {
  // Declare a digits variable
  // which stores all digits
  const digits = '0123456789';
  let OTP = '';
  //   for (let i = 0; i < otpLength; i++) {
  for (let i = 0; i < otpLength; i += 1) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

module.exports = generateOTP;
