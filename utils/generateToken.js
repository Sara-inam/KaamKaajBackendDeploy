const jwt = require("jsonwebtoken");

// JWT token generate karta hai jisme userId aur role dono encode hote hain
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;