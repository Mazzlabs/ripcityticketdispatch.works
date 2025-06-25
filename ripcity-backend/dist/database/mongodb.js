"use strict";
/**
 * RIP CITY TICKET DISPATCH - MongoDB Helper
 * Copyright (c) 2024 Joseph Mazzini <joseph@mazzlabs.works>
 * All Rights Reserved. Proprietary Software.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSConsent = exports.PushSubscription = exports.AlertHistory = exports.User = exports.default = void 0;
var connection_1 = require("./connection");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(connection_1).default; } });
var connection_2 = require("./connection");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return connection_2.User; } });
Object.defineProperty(exports, "AlertHistory", { enumerable: true, get: function () { return connection_2.AlertHistory; } });
Object.defineProperty(exports, "PushSubscription", { enumerable: true, get: function () { return connection_2.PushSubscription; } });
Object.defineProperty(exports, "SMSConsent", { enumerable: true, get: function () { return connection_2.SMSConsent; } });
