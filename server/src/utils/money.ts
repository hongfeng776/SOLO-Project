class MoneyUtils {
  private static readonly SCALE = 2;
  private static readonly MULTIPLIER = 100;

  public static toCent(yuan: number): number {
    return Math.round(yuan * MoneyUtils.MULTIPLIER);
  }

  public static toYuan(cent: number, scale: number = MoneyUtils.SCALE): number {
    return Number((cent / MoneyUtils.MULTIPLIER).toFixed(scale));
  }

  public static format(amount: number, scale: number = MoneyUtils.SCALE): string {
    const fixed = amount.toFixed(scale);
    const [intPart, decPart] = fixed.split('.');
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${formatted}.${decPart}` : formatted;
  }

  public static add(a: number, b: number, scale: number = MoneyUtils.SCALE): number {
    const result = MoneyUtils.toCent(a) + MoneyUtils.toCent(b);
    return MoneyUtils.toYuan(result, scale);
  }

  public static subtract(a: number, b: number, scale: number = MoneyUtils.SCALE): number {
    const result = MoneyUtils.toCent(a) - MoneyUtils.toCent(b);
    return MoneyUtils.toYuan(result, scale);
  }

  public static multiply(amount: number, rate: number, scale: number = MoneyUtils.SCALE): number {
    const amountCent = MoneyUtils.toCent(amount);
    const result = Math.round(amountCent * rate);
    return MoneyUtils.toYuan(result, scale);
  }

  public static divide(a: number, b: number, scale: number = MoneyUtils.SCALE): number {
    if (b === 0) throw new Error('Division by zero');
    const aCent = MoneyUtils.toCent(a);
    const bCent = MoneyUtils.toCent(b);
    if (bCent === 0) throw new Error('Division by zero');
    const result = aCent / bCent;
    return Number(result.toFixed(scale));
  }

  public static isEqual(a: number, b: number): boolean {
    return MoneyUtils.toCent(a) === MoneyUtils.toCent(b);
  }

  public static isGreater(a: number, b: number): boolean {
    return MoneyUtils.toCent(a) > MoneyUtils.toCent(b);
  }

  public static isLess(a: number, b: number): boolean {
    return MoneyUtils.toCent(a) < MoneyUtils.toCent(b);
  }

  public static isGreaterOrEqual(a: number, b: number): boolean {
    return MoneyUtils.toCent(a) >= MoneyUtils.toCent(b);
  }

  public static isNonNegative(amount: number): boolean {
    return MoneyUtils.toCent(amount) >= 0;
  }
}

export default MoneyUtils;
