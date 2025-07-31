// middleware/admin.js (Corrected)

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

function adminMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Authorization token is missing or invalid" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // CHANGE: Check specifically for the 'admin' type in the token
        if (decoded.type !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Access is restricted to admins" });
        }

        // CHANGE: Attach the decoded payload to req.user for consistency
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
    }
}

module.exports = adminMiddleware;