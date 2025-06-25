"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
    password: zod_1.z.string().min(1)
});
// User registration
router.post('/register', async (req, res) => {
    try {
        const userData = registerSchema.parse(req.body);
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, 12);
        // Create user (mock implementation - replace with actual database)
        const user = {
            id: Date.now().toString(),
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: hashedPassword,
            preferences: userData.preferences || {},
            createdAt: new Date().toISOString()
        };
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, id: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                preferences: user.preferences
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        // Mock user lookup (replace with actual database query)
        const user = {
            id: '1',
            email: email,
            password: await bcryptjs_1.default.hash('password123', 12), // Mock hashed password
            firstName: 'John',
            lastName: 'Doe'
        };
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, id: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Get user profile
router.get('/profile', async (req, res) => {
    try {
        // Mock authentication middleware would set req.user
        const userId = req.headers.authorization?.split(' ')[1]; // Mock token extraction
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        // Mock user data (replace with actual database query)
        const user = {
            id: userId,
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            preferences: {
                categories: ['sports'],
                maxPrice: 200,
                alertMethods: ['email']
            }
        };
        res.json({
            success: true,
            user
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Update user preferences
router.put('/preferences', async (req, res) => {
    try {
        const userId = req.headers.authorization?.split(' ')[1]; // Mock token extraction
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const preferences = req.body;
        // Mock update (replace with actual database update)
        console.log(`Updating preferences for user ${userId}:`, preferences);
        res.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences
        });
    }
    catch (error) {
        console.error('Preferences update error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
