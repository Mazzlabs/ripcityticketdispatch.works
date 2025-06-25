"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.requireSubscription = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';
    jsonwebtoken_1.default.verify(token, jwtSecret, (err, user) => {
        if (err) {
            logger_1.logger.warn('Invalid token', { error: err.message });
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }
        // Ensure both id and userId are set for compatibility
        req.user = {
            ...user,
            id: user.userId || user.id,
            userId: user.userId || user.id
        };
        next();
    });
};
exports.authenticateToken = authenticateToken;
const requireSubscription = (minimumTier) => {
    return (req, res, next) => {
        const userTier = req.user?.tier || 'free';
        const tierHierarchy = ['free', 'pro', 'premium', 'enterprise'];
        const userTierIndex = tierHierarchy.indexOf(userTier);
        const requiredTierIndex = tierHierarchy.indexOf(minimumTier);
        if (userTierIndex < requiredTierIndex) {
            return res.status(402).json({
                success: false,
                error: `This feature requires ${minimumTier} subscription or higher`,
                currentTier: userTier,
                requiredTier: minimumTier
            });
        }
        next();
    };
};
exports.requireSubscription = requireSubscription;
// Alias for backward compatibility
exports.authMiddleware = exports.authenticateToken;
