class MoneyUtils {
  private static readonly SCALE = 2;

  public static format(amount: number, scale: number = this.SCALE): string {
    return amount.toFixed(scale);
  }

  public static toCent(yuan: number): number {
    return Math.round(yuan * 100);
  }

  public static toYuan(cent: number, scale: number = this.SCALE): number {
    return Number((cent / 100).toFixed(scale));
  }

  public static add(a: number, b: number, scale: number = this.SCALE): number {
    const result = this.toCent(a) + this.toCent(b);
    return this.toYuan(result, scale);
  }

  public static subtract(a: number, b: number, scale: number = this.SCALE): number {
    const result = this.toCent(a) - this.toCent(b);
    return this.toYuan(result, scale);
  }

  public static multiply(a: number, b: number, scale: number = this.SCALE): number {
    const result = this.toCent(a) * b;
    return this.toYuan(Math.round(result), scale);
  }

  public static divide(a: number, b: number, scale: number = this.SCALE): number {
    if (b === 0) throw new Error('Division by zero');
    const result = this.toCent(a) / this.toCent(b);
    return Number(result.toFixed(scale));
  }

  public static isEqual(a: number, b: number): boolean {
    return this.toCent(a) === this.toCent(b);
  }

  public static isGreater(a: number, b: number): boolean {
    return this.toCent(a) > this.toCent(b);
  }

  public static isLess(a: number, b: number): boolean {
    return this.toCent(a) < this.toCent(b);
  }
}

export default MoneyUtils;
