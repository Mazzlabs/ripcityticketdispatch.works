// Simple in-memory database for now - can be replaced with proper DB later
interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  subscription?: string;
  isActive?: boolean;
  lastLogin?: Date;
  preferences?: {
    categories?: string[];
    venues?: string[];
    maxPrice?: number;
    minSavings?: number;
    alertMethods?: string[];
  };
  createdAt: Date;
}

interface AlertHistory {
  id: string;
  userId: string;
  dealId: string;
  sentAt: Date;
  type: string;
}

interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: any;
}

class SimpleDB {
  private users: User[] = [];
  private alertHistoryList: AlertHistory[] = [];
  private pushSubscriptions: PushSubscription[] = [];
  private idCounter = 1;

  user = {
    findUnique: async ({ where, select }: { where: { email?: string; id?: string }, select?: any }) => {
      let user: User | null = null;
      if (where.email) {
        user = this.users.find(u => u.email === where.email) || null;
      }
      if (where.id) {
        user = this.users.find(u => u.id === where.id) || null;
      }
      
      // Handle select (projection) - for now just return the full user
      return user;
    },

    findMany: async ({ where }: { where?: { isActive?: boolean } }) => {
      return this.users.filter(user => {
        if (where?.isActive !== undefined) {
          return user.isActive === where.isActive;
        }
        return true;
      });
    },

    create: async ({ data }: { data: Omit<User, 'id' | 'createdAt'> }) => {
      const user: User = {
        ...data,
        id: (this.idCounter++).toString(),
        isActive: true,
        subscription: data.subscription || 'free',
        createdAt: new Date()
      };
      this.users.push(user);
      return user;
    },

    update: async ({ where, data }: { where: { id: string }, data: Partial<User> }) => {
      const userIndex = this.users.findIndex(u => u.id === where.id);
      if (userIndex === -1) throw new Error('User not found');
      
      this.users[userIndex] = { ...this.users[userIndex], ...data };
      return this.users[userIndex];
    }
  };

  alertHistory = {
    findFirst: async ({ where }: { where: { userId: string; dealId: string } }) => {
      return this.alertHistoryList.find(ah => 
        ah.userId === where.userId && ah.dealId === where.dealId
      ) || null;
    },

    create: async ({ data }: { data: Omit<AlertHistory, 'id'> }) => {
      const alert: AlertHistory = {
        ...data,
        id: (this.idCounter++).toString()
      };
      this.alertHistoryList.push(alert);
      return alert;
    }
  };

  pushSubscription = {
    findMany: async ({ where }: { where: { userId: string } }) => {
      return this.pushSubscriptions.filter(ps => ps.userId === where.userId);
    },

    create: async ({ data }: { data: Omit<PushSubscription, 'id'> }) => {
      const subscription: PushSubscription = {
        ...data,
        id: (this.idCounter++).toString()
      };
      this.pushSubscriptions.push(subscription);
      return subscription;
    }
  };
}

export const db = new SimpleDB();
