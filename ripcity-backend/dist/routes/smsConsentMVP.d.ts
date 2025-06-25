/**
 * SMS Consent Routes - MVP Mode with Twilio Bypass
 * Uses real MongoDB for consent storage, mocks SMS sending until Twilio approval
 */
declare const router: import("express-serve-static-core").Router;
export default router;
