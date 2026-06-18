import { getLocalDateKey } from './utils.js';

export function groupEventsByDay(events) {
  return events.reduce((grouped, event) => {
    const date = new Date(event.start);
    const key = getLocalDateKey(date);
    grouped[key] = grouped[key] || [];
    grouped[key].push(event);
    return grouped;
  }, {});
}

export function mergeConsecutiveEvents(dayEvents) {
  if (dayEvents.length <= 1) return dayEvents;

  const merged = [];
  let currentGroup = [dayEvents[0]];
  let currentPauseMinutes = parsePauseMinutes(dayEvents[0]);

  const finalizeGroup = () => {
    if (currentGroup.length > 1) {
      merged.push({
        ...currentGroup[0],
        end: currentGroup[currentGroup.length - 1].end,
        _merged: true,
        _pauseMinutes: currentPauseMinutes,
      });
    } else {
      merged.push({
        ...currentGroup[0],
        _pauseMinutes: 0,
      });
    }
  };

  for (let i = 1; i < dayEvents.length; i += 1) {
    const prev = currentGroup[currentGroup.length - 1];
    const curr = dayEvents[i];
    const gapMs = new Date(curr.start).getTime() - new Date(prev.end).getTime();
    const pauseFromDesc = parsePauseMinutes(curr);

    if (prev.title === curr.title && gapMs >= 0) {
      currentGroup.push(curr);
      currentPauseMinutes += Math.round(gapMs / (1000 * 60)) + pauseFromDesc;
    } else {
      finalizeGroup();
      currentGroup = [curr];
      currentPauseMinutes = pauseFromDesc;
    }
  }

  finalizeGroup();
  return merged;
}

export function parsePauseMinutes(event) {
  if (!event || !event.rawDescription) return 0;
  const raw = event.rawDescription || '';
  const matched = raw.match(/Pause:\s*(?:inkl\.|inkl)?\s*(\d{1,3})\s*min/i) || raw.match(/(\d{1,3})\s*min\s*Pause/i);
  if (matched && matched[1]) return parseInt(matched[1], 10) || 0;
  return 0;
}
