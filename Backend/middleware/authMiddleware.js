const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

/**
 * Auth Middleware
 * Verifies the Bearer JWT from the Authorization header.
 * Attaches `req.user` (full user document) on success.
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await UserModel.findById(decoded._id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found. Token invalid.' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired. Please log in again.' });
        }
        return res.status(401).json({ message: 'Invalid token.', error: err.message });
    }
};

module.exports = authMiddleware;
