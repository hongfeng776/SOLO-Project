declare class MoneyUtils {
    private static readonly SCALE;
    private static readonly MULTIPLIER;
    static toCent(yuan: number): number;
    static toYuan(cent: number, scale?: number): number;
    static format(amount: number, scale?: number): string;
    static add(a: number, b: number, scale?: number): number;
    static subtract(a: number, b: number, scale?: number): number;
    static multiply(amount: number, rate: number, scale?: number): number;
    static divide(a: number, b: number, scale?: number): number;
    static isEqual(a: number, b: number): boolean;
    static isGreater(a: number, b: number): boolean;
    static isLess(a: number, b: number): boolean;
    static isGreaterOrEqual(a: number, b: number): boolean;
    static isNonNegative(amount: number): boolean;
}
export default MoneyUtils;
//# sourceMappingURL=money.d.ts.map