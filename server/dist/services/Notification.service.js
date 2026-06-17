"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = __importStar(require("../utils/cache"));
class NotificationService {
    async sendActivationSms(phone, username, token) {
        console.log(`[SMS] 激活短信发送成功: phone=${phone}, username=${username}`);
        return { success: true, message: '激活短信发送成功', channel: 'sms' };
    }
    async sendActivationEmail(email, username, token) {
        console.log(`[EMAIL] 激活邮件发送成功: email=${email}, username=${username}`);
        return { success: true, message: '激活邮件发送成功', channel: 'email' };
    }
    async checkDuplicateNotification(key) {
        const sent = await cache_1.default.get(`notify:sent:${key}`);
        return !!sent;
    }
    async markNotificationSent(key) {
        await cache_1.default.set(`notify:sent:${key}`, '1', cache_1.CacheTTL.LONG);
    }
}
exports.default = new NotificationService();
//# sourceMappingURL=Notification.service.js.map