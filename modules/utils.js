// Date utilities
export function getMonday(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function getLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getWeekNumber(date) {
  const target = new Date(date.valueOf());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  const dayDiff = Math.round((target - week1) / 86400000);
  return 1 + Math.floor((dayDiff - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// Time formatting
export function formatTime(isoString) {
  if (!isoString) return '–';
  const date = new Date(isoString);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateShort(date) {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export function formatDateRange(weekStart) {
  const weekEnd = addDays(weekStart, 4);
  const startStr = weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });
  const endStr = weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });
  const year = weekStart.getFullYear();
  return `${startStr} - ${endStr} ${year}`;
}

export function formatProgressPercent(value) {
  return `${Math.round(value)}%`;
}

export function formatHourLabel(hour) {
  return `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`;
}

// String utilities
export function stripTitlePrefix(title) {
  return title.replace(/^\s*\d+\s*-\s*/, '').trim();
}

export function formatCourseLabel(title) {
  if (!title) return '';
  const normalized = title.toString().replace(/[-_]/g, ' ').trim().toLowerCase();
  const match = normalized.match(/kurs\s*([a-z0-9]+)/i);
  if (match) {
    return `Kurs ${String(match[1]).toUpperCase()}`;
  }
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const last = tokens[tokens.length - 1] || normalized;
  return last.charAt(0).toUpperCase() + last.slice(1);
}

// Mobile detection
export function isMobile() {
  return window.innerWidth <= 768;
}

// Day names
export const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
