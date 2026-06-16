"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MoneyUtils {
    static format(amount, scale = this.SCALE) {
        return amount.toFixed(scale);
    }
    static toCent(yuan) {
        return Math.round(yuan * 100);
    }
    static toYuan(cent, scale = this.SCALE) {
        return Number((cent / 100).toFixed(scale));
    }
    static add(a, b, scale = this.SCALE) {
        const result = this.toCent(a) + this.toCent(b);
        return this.toYuan(result, scale);
    }
    static subtract(a, b, scale = this.SCALE) {
        const result = this.toCent(a) - this.toCent(b);
        return this.toYuan(result, scale);
    }
    static multiply(a, b, scale = this.SCALE) {
        const result = this.toCent(a) * b;
        return this.toYuan(Math.round(result), scale);
    }
    static divide(a, b, scale = this.SCALE) {
        if (b === 0)
            throw new Error('Division by zero');
        const result = this.toCent(a) / this.toCent(b);
        return Number(result.toFixed(scale));
    }
    static isEqual(a, b) {
        return this.toCent(a) === this.toCent(b);
    }
    static isGreater(a, b) {
        return this.toCent(a) > this.toCent(b);
    }
    static isLess(a, b) {
        return this.toCent(a) < this.toCent(b);
    }
}
MoneyUtils.SCALE = 2;
exports.default = MoneyUtils;
//# sourceMappingURL=money.js.map