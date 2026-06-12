import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const DATE_FORMAT = 'YYYY-MM-DD';
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const TIME_FORMAT = 'HH:mm:ss';

class DateUtil {
  format(date: Date | string | number, pattern = DATETIME_FORMAT): string {
    return dayjs(date).format(pattern);
  }

  formatDate(date: Date | string | number): string {
    return this.format(date, DATE_FORMAT);
  }

  formatTime(date: Date | string | number): string {
    return this.format(date, TIME_FORMAT);
  }

  relative(date: Date | string | number): string {
    return dayjs(date).fromNow();
  }

  isToday(date: Date | string | number): boolean {
    return dayjs(date).isSame(dayjs(), 'day');
  }

  addDays(date: Date | string | number, days: number): Date {
    return dayjs(date).add(days, 'day').toDate();
  }

  diffDays(date1: Date | string | number, date2: Date | string | number): number {
    return Math.abs(dayjs(date1).diff(dayjs(date2), 'day'));
  }

  getAge(birthdate: Date | string | number): number {
    return dayjs().diff(dayjs(birthdate), 'year');
  }

  getStartOfDay(date: Date | string | number): Date {
    return dayjs(date).startOf('day').toDate();
  }

  getEndOfDay(date: Date | string | number): Date {
    return dayjs(date).endOf('day').toDate();
  }

  getStartOfMonth(date: Date | string | number): Date {
    return dayjs(date).startOf('month').toDate();
  }

  getEndOfMonth(date: Date | string | number): Date {
    return dayjs(date).endOf('month').toDate();
  }

  parse(date: Date | string | number): Date {
    return dayjs(date).toDate();
  }

  now(): Date {
    return new Date();
  }
}

export const dateUtil = new DateUtil();
export default dateUtil;
