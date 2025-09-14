const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const { email, token } = req.query; // 👈 take from query instead of headers

  if (!email || !token) {
    return res.status(401).json({ message: 'Missing email or token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    // 🔒 Verify email matches the token owner
    if (user.email !== email) {
      return res.status(401).json({ message: 'Email does not match token' });
    }

    req.user = user; // attach user to request for downstream routes
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
