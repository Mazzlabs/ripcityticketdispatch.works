/**
 * RIP CITY TICKET DISPATCH - Server
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                userId: string;
                email: string;
                name?: string;
                tier?: string;
                iat?: number;
                exp?: number;
            };
        }
    }
}
declare const app: import("express-serve-static-core").Express;
export default app;
