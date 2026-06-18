import { formatDateShort } from './utils.js';

export function generateICS(events, weekStart, data) {
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HWR Berlin Stundenplan//stundenplan.hwr-berlin.de//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:HWR Berlin Stundenplan',
    'X-WR-TIMEZONE:Europe/Berlin',
    'X-WR-CALDESC:Stundenplan für HWR Berlin'
  ];

  events.forEach(event => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const description = event.rawDescription || event.title || '';
    const location = event.location || '';
    const teacher = event.teacher || '';

    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`DTSTART:${formatDate(startDate)}`);
    icsLines.push(`DTEND:${formatDate(endDate)}`);
    icsLines.push(`SUMMARY:${event.title || 'Veranstaltung'}`);
    icsLines.push(`DESCRIPTION:${description.replace(/\n/g, '\\n')}`);
    if (location) {
      icsLines.push(`LOCATION:${location}`);
    }
    if (teacher) {
      icsLines.push(`ORGANIZER:${teacher}`);
    }
    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');

  return icsLines.join('\r\n');
}

export function downloadICS(icsContent, filename) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
