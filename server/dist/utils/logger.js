"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    static getTimestamp() {
        const now = new Date();
        return now.toISOString().replace('T', ' ').substring(0, 19);
    }
    static info(message, ...args) {
        console.log(`[INFO] ${this.getTimestamp()} - ${message}`, ...args);
    }
    static warn(message, ...args) {
        console.warn(`[WARN] ${this.getTimestamp()} - ${message}`, ...args);
    }
    static error(message, ...args) {
        console.error(`[ERROR] ${this.getTimestamp()} - ${message}`, ...args);
    }
    static debug(message, ...args) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${this.getTimestamp()} - ${message}`, ...args);
        }
    }
}
exports.default = Logger;
//# sourceMappingURL=logger.js.map