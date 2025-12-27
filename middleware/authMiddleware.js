//authMiddleware.js
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // Token var mı?
  if (!authHeader) {
    return res.status(401).json({ message: "Token yok!" });
  }

  const token = authHeader.split(" ")[1]; // "Bearer TOKEN" → TOKEN

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // user bilgisini taşı
    next(); // devam et

  } catch (error) {
    return res.status(403).json({ message: "Geçersiz token!" });
  }
}

module.exports = verifyToken;
