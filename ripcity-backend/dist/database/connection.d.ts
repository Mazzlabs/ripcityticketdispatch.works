/**
 * RIP CITY TICKET DISPATCH - Database Connection
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */
import mongoose from 'mongoose';
export declare const User: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    subscription: string;
    isActive: boolean;
    lastLogin?: NativeDate | null | undefined;
    preferences?: {
        categories: string[];
        venues: string[];
        alertMethods: string[];
        maxPrice?: number | null | undefined;
        minSavings?: number | null | undefined;
    } | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    subscription: string;
    isActive: boolean;
    lastLogin?: NativeDate | null | undefined;
    preferences?: {
        categories: string[];
        venues: string[];
        alertMethods: string[];
        maxPrice?: number | null | undefined;
        minSavings?: number | null | undefined;
    } | null | undefined;
}, {}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    subscription: string;
    isActive: boolean;
    lastLogin?: NativeDate | null | undefined;
    preferences?: {
        categories: string[];
        venues: string[];
        alertMethods: string[];
        maxPrice?: number | null | undefined;
        minSavings?: number | null | undefined;
    } | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    subscription: string;
    isActive: boolean;
    lastLogin?: NativeDate | null | undefined;
    preferences?: {
        categories: string[];
        venues: string[];
        alertMethods: string[];
        maxPrice?: number | null | undefined;
        minSavings?: number | null | undefined;
    } | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    subscription: string;
    isActive: boolean;
    lastLogin?: NativeDate | null | undefined;
    preferences?: {
        categories: string[];
        venues: string[];
        alertMethods: string[];
        maxPrice?: number | null | undefined;
        minSavings?: number | null | undefined;
    } | null | undefined;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    subscription: string;
    isActive: boolean;
    lastLogin?: NativeDate | null | undefined;
    preferences?: {
        categories: string[];
        venues: string[];
        alertMethods: string[];
        maxPrice?: number | null | undefined;
        minSavings?: number | null | undefined;
    } | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AlertHistory: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: string;
    userId: mongoose.Types.ObjectId;
    dealId: string;
    sentAt: NativeDate;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: string;
    userId: mongoose.Types.ObjectId;
    dealId: string;
    sentAt: NativeDate;
}, {}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: string;
    userId: mongoose.Types.ObjectId;
    dealId: string;
    sentAt: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: string;
    userId: mongoose.Types.ObjectId;
    dealId: string;
    sentAt: NativeDate;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: string;
    userId: mongoose.Types.ObjectId;
    dealId: string;
    sentAt: NativeDate;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    type: string;
    userId: mongoose.Types.ObjectId;
    dealId: string;
    sentAt: NativeDate;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const PushSubscription: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    keys: any;
    userId: mongoose.Types.ObjectId;
    endpoint: string;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    keys: any;
    userId: mongoose.Types.ObjectId;
    endpoint: string;
}, {}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    keys: any;
    userId: mongoose.Types.ObjectId;
    endpoint: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    keys: any;
    userId: mongoose.Types.ObjectId;
    endpoint: string;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    keys: any;
    userId: mongoose.Types.ObjectId;
    endpoint: string;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    keys: any;
    userId: mongoose.Types.ObjectId;
    endpoint: string;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const SMSConsent: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    phoneNumber: string;
    consentTimestamp: NativeDate;
    doubleOptInConfirmed: boolean;
    source: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    subscriptionTier?: string | null | undefined;
    doubleOptInCode?: string | null | undefined;
    doubleOptInSentAt?: NativeDate | null | undefined;
    doubleOptInConfirmedAt?: NativeDate | null | undefined;
    optOutTimestamp?: NativeDate | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    phoneNumber: string;
    consentTimestamp: NativeDate;
    doubleOptInConfirmed: boolean;
    source: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    subscriptionTier?: string | null | undefined;
    doubleOptInCode?: string | null | undefined;
    doubleOptInSentAt?: NativeDate | null | undefined;
    doubleOptInConfirmedAt?: NativeDate | null | undefined;
    optOutTimestamp?: NativeDate | null | undefined;
}, {}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    phoneNumber: string;
    consentTimestamp: NativeDate;
    doubleOptInConfirmed: boolean;
    source: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    subscriptionTier?: string | null | undefined;
    doubleOptInCode?: string | null | undefined;
    doubleOptInSentAt?: NativeDate | null | undefined;
    doubleOptInConfirmedAt?: NativeDate | null | undefined;
    optOutTimestamp?: NativeDate | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    phoneNumber: string;
    consentTimestamp: NativeDate;
    doubleOptInConfirmed: boolean;
    source: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    subscriptionTier?: string | null | undefined;
    doubleOptInCode?: string | null | undefined;
    doubleOptInSentAt?: NativeDate | null | undefined;
    doubleOptInConfirmedAt?: NativeDate | null | undefined;
    optOutTimestamp?: NativeDate | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    phoneNumber: string;
    consentTimestamp: NativeDate;
    doubleOptInConfirmed: boolean;
    source: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    subscriptionTier?: string | null | undefined;
    doubleOptInCode?: string | null | undefined;
    doubleOptInSentAt?: NativeDate | null | undefined;
    doubleOptInConfirmedAt?: NativeDate | null | undefined;
    optOutTimestamp?: NativeDate | null | undefined;
}>, {}> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    userId: mongoose.Types.ObjectId;
    phoneNumber: string;
    consentTimestamp: NativeDate;
    doubleOptInConfirmed: boolean;
    source: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    subscriptionTier?: string | null | undefined;
    doubleOptInCode?: string | null | undefined;
    doubleOptInSentAt?: NativeDate | null | undefined;
    doubleOptInConfirmedAt?: NativeDate | null | undefined;
    optOutTimestamp?: NativeDate | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
declare class MongoDB {
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): MongoDB;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnectedStatus(): boolean;
    getConnection(): mongoose.Connection;
    getUsers(): Promise<(mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        subscription: string;
        isActive: boolean;
        lastLogin?: NativeDate | null | undefined;
        preferences?: {
            categories: string[];
            venues: string[];
            alertMethods: string[];
            maxPrice?: number | null | undefined;
            minSavings?: number | null | undefined;
        } | null | undefined;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        subscription: string;
        isActive: boolean;
        lastLogin?: NativeDate | null | undefined;
        preferences?: {
            categories: string[];
            venues: string[];
            alertMethods: string[];
            maxPrice?: number | null | undefined;
            minSavings?: number | null | undefined;
        } | null | undefined;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    getUserByEmail(email: string): Promise<(mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        subscription: string;
        isActive: boolean;
        lastLogin?: NativeDate | null | undefined;
        preferences?: {
            categories: string[];
            venues: string[];
            alertMethods: string[];
            maxPrice?: number | null | undefined;
            minSavings?: number | null | undefined;
        } | null | undefined;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        subscription: string;
        isActive: boolean;
        lastLogin?: NativeDate | null | undefined;
        preferences?: {
            categories: string[];
            venues: string[];
            alertMethods: string[];
            maxPrice?: number | null | undefined;
            minSavings?: number | null | undefined;
        } | null | undefined;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    createUser(userData: any): Promise<mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        subscription: string;
        isActive: boolean;
        lastLogin?: NativeDate | null | undefined;
        preferences?: {
            categories: string[];
            venues: string[];
            alertMethods: string[];
            maxPrice?: number | null | undefined;
            minSavings?: number | null | undefined;
        } | null | undefined;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        subscription: string;
        isActive: boolean;
        lastLogin?: NativeDate | null | undefined;
        preferences?: {
            categories: string[];
            venues: string[];
            alertMethods: string[];
            maxPrice?: number | null | undefined;
            minSavings?: number | null | undefined;
        } | null | undefined;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    updateUser(id: string, updates: any): Promise<(mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        subscription: string;
        isActive: boolean;
        lastLogin?: NativeDate | null | undefined;
        preferences?: {
            categories: string[];
            venues: string[];
            alertMethods: string[];
            maxPrice?: number | null | undefined;
            minSavings?: number | null | undefined;
        } | null | undefined;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        subscription: string;
        isActive: boolean;
        lastLogin?: NativeDate | null | undefined;
        preferences?: {
            categories: string[];
            venues: string[];
            alertMethods: string[];
            maxPrice?: number | null | undefined;
            minSavings?: number | null | undefined;
        } | null | undefined;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    deleteUser(id: string): Promise<boolean>;
    addAlertHistory(userId: string, dealId: string, type: string): Promise<mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        type: string;
        userId: mongoose.Types.ObjectId;
        dealId: string;
        sentAt: NativeDate;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        type: string;
        userId: mongoose.Types.ObjectId;
        dealId: string;
        sentAt: NativeDate;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    getAlertHistory(userId: string): Promise<(mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        type: string;
        userId: mongoose.Types.ObjectId;
        dealId: string;
        sentAt: NativeDate;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        type: string;
        userId: mongoose.Types.ObjectId;
        dealId: string;
        sentAt: NativeDate;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    savePushSubscription(userId: string, subscription: any): Promise<mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        keys: any;
        userId: mongoose.Types.ObjectId;
        endpoint: string;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        keys: any;
        userId: mongoose.Types.ObjectId;
        endpoint: string;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    getPushSubscriptions(userId: string): Promise<(mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        keys: any;
        userId: mongoose.Types.ObjectId;
        endpoint: string;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        keys: any;
        userId: mongoose.Types.ObjectId;
        endpoint: string;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    createSMSConsent(data: {
        userId: string;
        phoneNumber: string;
        ipAddress?: string;
        userAgent?: string;
        subscriptionTier: string;
        source?: string;
    }): Promise<mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        userId: mongoose.Types.ObjectId;
        phoneNumber: string;
        consentTimestamp: NativeDate;
        doubleOptInConfirmed: boolean;
        source: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
        subscriptionTier?: string | null | undefined;
        doubleOptInCode?: string | null | undefined;
        doubleOptInSentAt?: NativeDate | null | undefined;
        doubleOptInConfirmedAt?: NativeDate | null | undefined;
        optOutTimestamp?: NativeDate | null | undefined;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        userId: mongoose.Types.ObjectId;
        phoneNumber: string;
        consentTimestamp: NativeDate;
        doubleOptInConfirmed: boolean;
        source: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
        subscriptionTier?: string | null | undefined;
        doubleOptInCode?: string | null | undefined;
        doubleOptInSentAt?: NativeDate | null | undefined;
        doubleOptInConfirmedAt?: NativeDate | null | undefined;
        optOutTimestamp?: NativeDate | null | undefined;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }>;
    confirmSMSConsent(userId: string, phoneNumber: string, confirmationCode: string): Promise<boolean>;
    optOutSMS(phoneNumber: string): Promise<boolean>;
    getSMSConsent(userId: string): Promise<(mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        userId: mongoose.Types.ObjectId;
        phoneNumber: string;
        consentTimestamp: NativeDate;
        doubleOptInConfirmed: boolean;
        source: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
        subscriptionTier?: string | null | undefined;
        doubleOptInCode?: string | null | undefined;
        doubleOptInSentAt?: NativeDate | null | undefined;
        doubleOptInConfirmedAt?: NativeDate | null | undefined;
        optOutTimestamp?: NativeDate | null | undefined;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        userId: mongoose.Types.ObjectId;
        phoneNumber: string;
        consentTimestamp: NativeDate;
        doubleOptInConfirmed: boolean;
        source: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
        subscriptionTier?: string | null | undefined;
        doubleOptInCode?: string | null | undefined;
        doubleOptInSentAt?: NativeDate | null | undefined;
        doubleOptInConfirmedAt?: NativeDate | null | undefined;
        optOutTimestamp?: NativeDate | null | undefined;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    getSMSConsentByPhone(phoneNumber: string): Promise<(mongoose.Document<unknown, {}, {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        userId: mongoose.Types.ObjectId;
        phoneNumber: string;
        consentTimestamp: NativeDate;
        doubleOptInConfirmed: boolean;
        source: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
        subscriptionTier?: string | null | undefined;
        doubleOptInCode?: string | null | undefined;
        doubleOptInSentAt?: NativeDate | null | undefined;
        doubleOptInConfirmedAt?: NativeDate | null | undefined;
        optOutTimestamp?: NativeDate | null | undefined;
    }, {}> & {
        createdAt: NativeDate;
        updatedAt: NativeDate;
    } & {
        userId: mongoose.Types.ObjectId;
        phoneNumber: string;
        consentTimestamp: NativeDate;
        doubleOptInConfirmed: boolean;
        source: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
        subscriptionTier?: string | null | undefined;
        doubleOptInCode?: string | null | undefined;
        doubleOptInSentAt?: NativeDate | null | undefined;
        doubleOptInConfirmedAt?: NativeDate | null | undefined;
        optOutTimestamp?: NativeDate | null | undefined;
    } & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }) | null>;
    healthCheck(): Promise<boolean>;
}
declare const _default: MongoDB;
export default _default;
