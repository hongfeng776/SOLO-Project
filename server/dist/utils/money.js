"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MoneyUtils {
    static toCent(yuan) {
        return Math.round(yuan * MoneyUtils.MULTIPLIER);
    }
    static toYuan(cent, scale = MoneyUtils.SCALE) {
        return Number((cent / MoneyUtils.MULTIPLIER).toFixed(scale));
    }
    static format(amount, scale = MoneyUtils.SCALE) {
        const fixed = amount.toFixed(scale);
        const [intPart, decPart] = fixed.split('.');
        const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return decPart ? `${formatted}.${decPart}` : formatted;
    }
    static add(a, b, scale = MoneyUtils.SCALE) {
        const result = MoneyUtils.toCent(a) + MoneyUtils.toCent(b);
        return MoneyUtils.toYuan(result, scale);
    }
    static subtract(a, b, scale = MoneyUtils.SCALE) {
        const result = MoneyUtils.toCent(a) - MoneyUtils.toCent(b);
        return MoneyUtils.toYuan(result, scale);
    }
    static multiply(amount, rate, scale = MoneyUtils.SCALE) {
        const amountCent = MoneyUtils.toCent(amount);
        const result = Math.round(amountCent * rate);
        return MoneyUtils.toYuan(result, scale);
    }
    static divide(a, b, scale = MoneyUtils.SCALE) {
        if (b === 0)
            throw new Error('Division by zero');
        const aCent = MoneyUtils.toCent(a);
        const bCent = MoneyUtils.toCent(b);
        if (bCent === 0)
            throw new Error('Division by zero');
        const result = aCent / bCent;
        return Number(result.toFixed(scale));
    }
    static isEqual(a, b) {
        return MoneyUtils.toCent(a) === MoneyUtils.toCent(b);
    }
    static isGreater(a, b) {
        return MoneyUtils.toCent(a) > MoneyUtils.toCent(b);
    }
    static isLess(a, b) {
        return MoneyUtils.toCent(a) < MoneyUtils.toCent(b);
    }
    static isGreaterOrEqual(a, b) {
        return MoneyUtils.toCent(a) >= MoneyUtils.toCent(b);
    }
    static isNonNegative(amount) {
        return MoneyUtils.toCent(amount) >= 0;
    }
}
MoneyUtils.SCALE = 2;
MoneyUtils.MULTIPLIER = 100;
exports.default = MoneyUtils;
//# sourceMappingURL=money.js.map