import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

/**
 * Date utility functions using dayjs
 */

export const parseDate = (
  date: string | Date | dayjs.Dayjs,
  format?: string
): dayjs.Dayjs => {
  if (format) {
    return dayjs(date, format);
  }
  return dayjs(date);
};

export const isValidDate = (date: string | Date | dayjs.Dayjs): boolean => {
  return dayjs(date).isValid();
};

export const isBefore = (
  date1: string | Date | dayjs.Dayjs,
  date2: string | Date | dayjs.Dayjs
): boolean => {
  return dayjs(date1).isBefore(dayjs(date2));
};

export const isAfter = (
  date1: string | Date | dayjs.Dayjs,
  date2: string | Date | dayjs.Dayjs
): boolean => {
  return dayjs(date1).isAfter(dayjs(date2));
};

export const isSame = (
  date1: string | Date | dayjs.Dayjs,
  date2: string | Date | dayjs.Dayjs,
  unit?: dayjs.OpUnitType
): boolean => {
  return dayjs(date1).isSame(dayjs(date2), unit);
};

export const addDays = (
  date: string | Date | dayjs.Dayjs,
  days: number
): dayjs.Dayjs => {
  return dayjs(date).add(days, 'day');
};

export const subtractDays = (
  date: string | Date | dayjs.Dayjs,
  days: number
): dayjs.Dayjs => {
  return dayjs(date).subtract(days, 'day');
};

export const getStartOfDay = (date: string | Date | dayjs.Dayjs): dayjs.Dayjs => {
  return dayjs(date).startOf('day');
};

export const getEndOfDay = (date: string | Date | dayjs.Dayjs): dayjs.Dayjs => {
  return dayjs(date).endOf('day');
};

export const getToday = (): dayjs.Dayjs => {
  return dayjs();
};

export const getYesterday = (): dayjs.Dayjs => {
  return dayjs().subtract(1, 'day');
};

export const getTomorrow = (): dayjs.Dayjs => {
  return dayjs().add(1, 'day');
};

export const diffInDays = (
  date1: string | Date | dayjs.Dayjs,
  date2: string | Date | dayjs.Dayjs
): number => {
  return dayjs(date1).diff(dayjs(date2), 'day');
};

export const diffInHours = (
  date1: string | Date | dayjs.Dayjs,
  date2: string | Date | dayjs.Dayjs
): number => {
  return dayjs(date1).diff(dayjs(date2), 'hour');
};

export const toISOString = (date: string | Date | dayjs.Dayjs): string => {
  return dayjs(date).toISOString();
};

export const toUnixTimestamp = (date: string | Date | dayjs.Dayjs): number => {
  return dayjs(date).unix();
};

export const fromUnixTimestamp = (timestamp: number): dayjs.Dayjs => {
  return dayjs.unix(timestamp);
};
