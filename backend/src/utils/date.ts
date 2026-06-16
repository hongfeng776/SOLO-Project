import dayjs from 'dayjs';

export function formatDateTime(date: Date | string | number, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format);
}

export function formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function getCurrentDateTime(): Date {
  return dayjs().toDate();
}

export function getCurrentDateTimeString(format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs().format(format);
}

export function parseDateTime(dateString: string): Date {
  return dayjs(dateString).toDate();
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return dayjs(date1).isSame(date2, 'day');
}

export function addDays(date: Date | string, days: number): Date {
  return dayjs(date).add(days, 'day').toDate();
}

export function diffInDays(date1: Date | string, date2: Date | string): number {
  return dayjs(date1).diff(dayjs(date2), 'day');
}

export function getStartOfDay(date: Date | string): Date {
  return dayjs(date).startOf('day').toDate();
}

export function getEndOfDay(date: Date | string): Date {
  return dayjs(date).endOf('day').toDate();
}

export function getStartOfMonth(date: Date | string): Date {
  return dayjs(date).startOf('month').toDate();
}

export function getEndOfMonth(date: Date | string): Date {
  return dayjs(date).endOf('month').toDate();
}

export function generateSerialNo(prefix: string = '', length: number = 20): string {
  const now = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.floor(Math.random() * Math.pow(10, length - now.length - prefix.length))
    .toString()
    .padStart(length - now.length - prefix.length, '0');
  return `${prefix}${now}${random}`;
}