import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

class DateUtils {
  private static readonly DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm:ss';
  private static readonly TIMEZONE = 'Asia/Shanghai';

  public static now(format: string = this.DEFAULT_FORMAT): string {
    return dayjs().tz(this.TIMEZONE).format(format);
  }

  public static nowDate(): string {
    return dayjs().tz(this.TIMEZONE).format('YYYY-MM-DD');
  }

  public static nowTimestamp(): number {
    return dayjs().valueOf();
  }

  public static format(date: Date | string | number, format: string = this.DEFAULT_FORMAT): string {
    return dayjs(date).tz(this.TIMEZONE).format(format);
  }

  public static parse(dateStr: string, format?: string): Date {
    return dayjs(dateStr, format).toDate();
  }

  public static addDays(date: Date | string | number, days: number, format?: string): string {
    const result = dayjs(date).add(days, 'day');
    return format ? result.format(format) : result.format(this.DEFAULT_FORMAT);
  }

  public static diffDays(date1: Date | string | number, date2: Date | string | number): number {
    return dayjs(date1).diff(dayjs(date2), 'day');
  }

  public static isBefore(date1: Date | string | number, date2: Date | string | number): boolean {
    return dayjs(date1).isBefore(dayjs(date2));
  }

  public static isAfter(date1: Date | string | number, date2: Date | string | number): boolean {
    return dayjs(date1).isAfter(dayjs(date2));
  }

  public static startOfDay(date: Date | string | number): Date {
    return dayjs(date).startOf('day').toDate();
  }

  public static endOfDay(date: Date | string | number): Date {
    return dayjs(date).endOf('day').toDate();
  }
}

export default DateUtils;
