import { stripeService as realStripeService } from '../services/stripeService';
import { mockStripeService } from '../services/mvpBypass';
export default function (stripeService: typeof realStripeService | typeof mockStripeService): import("express-serve-static-core").Router;
