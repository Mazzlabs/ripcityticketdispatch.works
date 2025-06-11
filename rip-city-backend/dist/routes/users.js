"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../database/connection");
const router = express_1.default.Router();
// Validation schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    preferences: zod_1.z.object({
        categories: zod_1.z.array(zod_1.z.enum(['sports', 'music', 'theater', 'family'])).optional(),
        venues: zod_1.z.array(zod_1.z.string()).optional(),
        maxPrice: zod_1.z.number().positive().optional(),
        minSavings: zod_1.z.number().min(0).max(100).optional(),
        alertMethods: zod_1.z.array(zod_1.z.enum(['email', 'sms', 'push'])).optional()
    }).optional()
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
// User Registration
router.post('/register', async (req, res) => {
    try {
        const userData = registerSchema.parse(req.body);
        // Check if user exists
        const existingUser = await connection_1.db.user.findUnique({
            where: { email: userData.email }
        });
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                code: 'USER_EXISTS'
            });
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 12);
        // Create user
        const user = await connection_1.db.user.create({
            data: {
                email: userData.email,
                password: hashedPassword,
                firstName: userData.firstName,
                lastName: userData.lastName,
                subscription: 'free',
                preferences: userData.preferences || {},
                isActive: true,
                createdAt: new Date()
            }
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                subscription: user.subscription,
                preferences: user.preferences
            },
            token
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        // Find user
        const user = await connection_1.db.user.findUnique({
            where: { email }
        });
        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }
        // Verify password
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
        // Update last login
        await connection_1.db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                subscription: user.subscription,
                preferences: user.preferences
            },
            token
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await connection_1.db.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                subscription: true,
                preferences: true,
                createdAt: true,
                lastLogin: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            user
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Update User Preferences
router.put('/preferences', authenticateToken, async (req, res) => {
    try {
        const preferencesSchema = zod_1.z.object({
            categories: zod_1.z.array(zod_1.z.enum(['sports', 'music', 'theater', 'family'])).optional(),
            venues: zod_1.z.array(zod_1.z.string()).optional(),
            maxPrice: zod_1.z.number().positive().optional(),
            minSavings: zod_1.z.number().min(0).max(100).optional(),
            alertMethods: zod_1.z.array(zod_1.z.enum(['email', 'sms', 'push'])).optional(),
            phoneNumber: zod_1.z.string().optional()
        });
        const preferences = preferencesSchema.parse(req.body);
        const updatedUser = await connection_1.db.user.update({
            where: { id: req.user.userId },
            data: { preferences }
        });
        res.json({
            success: true,
            preferences: updatedUser.preferences
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }
        console.error('Preferences update error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});
// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}
exports.default = router;
//# sourceMappingURL=users.js.map