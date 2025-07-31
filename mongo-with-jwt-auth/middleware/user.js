// middleware/user.js (Corrected)

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

function userMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Authorization token is missing or invalid." });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // CHANGE: You can check for 'user' type if needed, but for now, any valid token is fine.
        if (decoded.type !== 'user') {
             return res.status(403).json({ message: "Forbidden: Access is restricted to users" });
        }

        // CHANGE: Attach the full decoded payload to req.user
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(403).json({ message: "Forbidden: The provided token is invalid or has expired." });
    }
}

module.exports = userMiddleware;