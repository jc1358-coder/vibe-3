const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDateTimeInputValue(date: Date, hour = 9, minute = 0): string {
  const base = new Date(date);
  base.setHours(hour, minute, 0, 0);
  const hours = String(base.getHours()).padStart(2, "0");
  const minutes = String(base.getMinutes()).padStart(2, "0");
  return `${toDateInputValue(base)}T${hours}:${minutes}`;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

export function endOfWeek(date: Date): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  return result;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function getCalendarCells(date: Date): Date[] {
  const first = startOfMonth(date);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function formatKoreanDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${dayNames[date.getDay()]})`;
}

export function formatMonthTitle(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function formatTimeRange(startAt: string, endAt: string): string {
  return `${startAt.slice(11, 16)} - ${endAt.slice(11, 16)}`;
}

export function getDatePart(value: string): string {
  return value.slice(0, 10);
}
export function isDateWithinSchedule(date: Date, startAt: string, endAt: string): boolean {
  const dateKey = toDateInputValue(date);
  return getDatePart(startAt) <= dateKey && dateKey <= getDatePart(endAt);
}