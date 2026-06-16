declare class DateUtils {
    private static readonly DEFAULT_FORMAT;
    private static readonly TIMEZONE;
    static now(format?: string): string;
    static nowDate(): string;
    static nowTimestamp(): number;
    static format(date: Date | string | number, format?: string): string;
    static parse(dateStr: string, format?: string): Date;
    static addDays(date: Date | string | number, days: number, format?: string): string;
    static diffDays(date1: Date | string | number, date2: Date | string | number): number;
    static isBefore(date1: Date | string | number, date2: Date | string | number): boolean;
    static isAfter(date1: Date | string | number, date2: Date | string | number): boolean;
    static startOfDay(date: Date | string | number): Date;
    static endOfDay(date: Date | string | number): Date;
}
export default DateUtils;
//# sourceMappingURL=date.d.ts.map