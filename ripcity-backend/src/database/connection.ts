import { Redis } from 'redis';

// Simple in-memory database service for now
// TODO: Replace with proper database (PostgreSQL + Prisma) in production
class DatabaseService {
  private redis: Redis;
  private users: Map<string, any> = new Map();
  private userPreferences: Map<string, any> = new Map();

  constructor() {
    // Initialize Redis connection for session storage
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
  }

  // User management
  async createUser(userData: {
    email: string;
    hashedPassword: string;
    firstName: string;
    lastName: string;
    preferences?: any;
  }) {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id: userId,
      email: userData.email,
      password: userData.hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(userId, user);
    this.users.set(`email_${userData.email}`, userId); // Email lookup
    
    if (userData.preferences) {
      this.userPreferences.set(userId, userData.preferences);
    }
    
    return { ...user, password: undefined }; // Don't return password
  }

  async findUserByEmail(email: string) {
    const userId = this.users.get(`email_${email}`);
    if (!userId) return null;
    
    return this.users.get(userId);
  }

  async findUserById(id: string) {
    return this.users.get(id);
  }

  async updateUserPreferences(userId: string, preferences: any) {
    this.userPreferences.set(userId, preferences);
    return preferences;
  }

  async getUserPreferences(userId: string) {
    return this.userPreferences.get(userId) || {};
  }

  // Session management via Redis
  async createSession(userId: string, sessionData: any) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.redis.setex(`session:${sessionId}`, 86400, JSON.stringify({ userId, ...sessionData })); // 24h expiry
    return sessionId;
  }

  async getSession(sessionId: string) {
    const sessionData = await this.redis.get(`session:${sessionId}`);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async deleteSession(sessionId: string) {
    await this.redis.del(`session:${sessionId}`);
  }
}

export const db = {
  user: {
    create: async (data: { data: any }) => {
      return await dbService.createUser(data.data);
    },
    findUnique: async (query: { where: { email?: string; id?: string } }) => {
      if (query.where.email) {
        return await dbService.findUserByEmail(query.where.email);
      }
      if (query.where.id) {
        return await dbService.findUserById(query.where.id);
      }
      return null;
    }
  }
};

const dbService = new DatabaseService();
export { dbService };
