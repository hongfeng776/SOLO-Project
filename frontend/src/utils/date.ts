export type DateInput = string | number | Date;

const PAD = (n: number) => String(n).padStart(2, '0');

class DateUtil {
  parse(input: DateInput): Date {
    if (input instanceof Date) return input;
    if (typeof input === 'number') return new Date(input);
    if (typeof input === 'string') {
      let str = input.replace(/-/g, '/');
      if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) str += ' 00:00:00';
      return new Date(str);
    }
    return new Date();
  }

  format(input: DateInput, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
    const d = this.parse(input);
    if (isNaN(d.getTime())) return '';
    return pattern
      .replace(/YYYY/g, String(d.getFullYear()))
      .replace(/MM/g, PAD(d.getMonth() + 1))
      .replace(/DD/g, PAD(d.getDate()))
      .replace(/HH/g, PAD(d.getHours()))
      .replace(/mm/g, PAD(d.getMinutes()))
      .replace(/ss/g, PAD(d.getSeconds()))
      .replace(/SSS/g, String(d.getMilliseconds()).padStart(3, '0'));
  }

  relative(input: DateInput): string {
    const d = this.parse(input);
    const now = Date.now();
    const diff = now - d.getTime();
    const abs = Math.abs(diff);
    const isPast = diff > 0;

    const sec = Math.floor(abs / 1000);
    if (sec < 60) return isPast ? '刚刚' : '即将';
    const min = Math.floor(sec / 60);
    if (min < 60) return isPast ? `${min} 分钟前` : `${min} 分钟后`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return isPast ? `${hour} 小时前` : `${hour} 小时后`;
    const day = Math.floor(hour / 24);
    if (day < 7) return isPast ? `${day} 天前` : `${day} 天后`;
    const week = Math.floor(day / 7);
    if (week < 5) return isPast ? `${week} 周前` : `${week} 周后`;
    const month = Math.floor(day / 30);
    if (month < 12) return isPast ? `${month} 个月前` : `${month} 个月后`;
    const year = Math.floor(day / 365);
    return isPast ? `${year} 年前` : `${year} 年后`;
  }

  isSameDay(a: DateInput, b: DateInput): boolean {
    const da = this.parse(a);
    const db = this.parse(b);
    return da.getFullYear() === db.getFullYear()
      && da.getMonth() === db.getMonth()
      && da.getDate() === db.getDate();
  }

  isToday(input: DateInput): boolean {
    return this.isSameDay(input, Date.now());
  }

  startOfDay(input: DateInput): Date {
    const d = this.parse(input);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  endOfDay(input: DateInput): Date {
    const d = this.parse(input);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  addDays(input: DateInput, days: number): Date {
    const d = this.parse(input);
    d.setDate(d.getDate() + days);
    return d;
  }

  diffDays(a: DateInput, b: DateInput): number {
    const da = this.startOfDay(a).getTime();
    const db = this.startOfDay(b).getTime();
    return Math.round((db - da) / 86400000);
  }

  getAge(birthday: DateInput): number {
    const b = this.parse(birthday);
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return Math.max(0, age);
  }

  getWeekDay(input: DateInput, locale = 'zh-CN'): string {
    const d = this.parse(input);
    const weekdays = locale === 'zh-CN'
      ? ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[d.getDay()];
  }
}

export const dateUtil = new DateUtil();
export default dateUtil;
