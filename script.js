const FILTER_COLLAPSED_KEY = 'st-plan-filter-collapsed';
const FILTER_SEEN_KEY = 'st-plan-filter-seen';
const SCHEDULE_CACHE_KEY = 'st-plan-schedule-cache';
const SCHEDULE_CACHE_TIMESTAMP_KEY = 'st-plan-schedule-cache-timestamp';
const PROGRESS_LABEL_KEY = 'st-plan-progress-label';
const CACHE_EXPIRY_HOURS = 24;
let filterCollapsed = false;
let hasInitialScrollOccurred = false;
let showProgressLabel = localStorage.getItem(PROGRESS_LABEL_KEY) === 'true';

function getInitialFilterCollapsed() {
  const seenBefore = localStorage.getItem(FILTER_SEEN_KEY) !== null;
  const storedCollapsed = localStorage.getItem(FILTER_COLLAPSED_KEY);

  if (storedCollapsed !== null) {
    return storedCollapsed === 'true';
  }

  if (!seenBefore) {
    localStorage.setItem(FILTER_SEEN_KEY, 'true');
    return false;
  }

  return true;
}

function cacheScheduleData(data) {
  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(SCHEDULE_CACHE_KEY, payload);
    localStorage.setItem(SCHEDULE_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to cache schedule data:', error);
  }
}

function getCachedScheduleData() {
  try {
    const cached = localStorage.getItem(SCHEDULE_CACHE_KEY);
    const timestamp = localStorage.getItem(SCHEDULE_CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = (Date.now() - parseInt(timestamp, 10)) / (1000 * 60 * 60);
    if (cacheAge > CACHE_EXPIRY_HOURS) {
      localStorage.removeItem(SCHEDULE_CACHE_KEY);
      localStorage.removeItem(SCHEDULE_CACHE_TIMESTAMP_KEY);
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.warn('Failed to retrieve cached schedule data:', error);
    return null;
  }
}

function updateFilterState(collapsed) {
  const layout = document.getElementById('pageLayout');
  const configPanel = document.getElementById('configPanel');
  const toggleButton = document.getElementById('toggleFilterButton');

  if (!layout || !configPanel || !toggleButton) return;

  filterCollapsed = collapsed;
  localStorage.setItem(FILTER_COLLAPSED_KEY, String(collapsed));

  const icon = toggleButton.querySelector('.toggle-icon');
  if (collapsed) {
    layout.classList.add('layout-collapsed');
    configPanel.classList.add('collapsed');
    if (icon) icon.textContent = 'expand_more';
    toggleButton.setAttribute('aria-expanded', 'false');
  } else {
    layout.classList.remove('layout-collapsed');
    configPanel.classList.remove('collapsed');
    if (icon) icon.textContent = 'expand_more';
    toggleButton.setAttribute('aria-expanded', 'true');
  }
}

const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function getMonday(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatTime(isoString) {
  if (!isoString) return '–';
  const date = new Date(isoString);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date) {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function formatDateRange(weekStart) {
  const weekEnd = addDays(weekStart, 4);
  const startStr = weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });
  const endStr = weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });
  const year = weekStart.getFullYear();
  return `${startStr} - ${endStr} ${year}`;
}

function formatProgressPercent(value) {
  return `${Math.round(value)}%`;
}

function formatHourLabel(hour) {
  return `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`;
}

function buildCurrentDayProgressHtml(day, eventsForDay, minHour, totalHours, dayHeightPx, showLabel = false) {
  const now = new Date();
  if (getLocalDateKey(day) !== getLocalDateKey(now)) return '';

  const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const clampedHour = Math.min(Math.max(currentHour, minHour), minHour + totalHours);
  const positionTop = ((clampedHour - minHour) / totalHours) * dayHeightPx;
  const progressPercent = ((clampedHour - minHour) / totalHours) * 100;

  if (showLabel) {
    return `<div class="current-time-indicator with-label" style="top:${positionTop}px" data-progress="${formatProgressPercent(progressPercent)}"></div>`;
  }
  return `<div class="current-time-indicator" style="top:${positionTop}px"></div>`;
}

function buildCurrentTimeIndicator(day, eventsForDay) {
  const now = new Date();
  if (getLocalDateKey(day) !== getLocalDateKey(now)) return '';

  if (!eventsForDay || eventsForDay.length === 0) return '';

  // Calculate day start and end times
  const dayStart = eventsForDay.reduce((min, ev) => {
    const start = new Date(ev.start).getTime();
    return Math.min(min, start);
  }, Infinity);
  const dayEnd = eventsForDay.reduce((max, ev) => {
    const end = new Date(ev.end).getTime();
    return Math.max(max, end);
  }, -Infinity);

  if (dayStart >= dayEnd) return '';

  const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const startHour = new Date(dayStart).getHours() + new Date(dayStart).getMinutes() / 60;
  const endHour = new Date(dayEnd).getHours() + new Date(dayEnd).getMinutes() / 60;

  // Only show if current time is within the day's event range
  if (currentHour < startHour || currentHour > endHour) return '';

  const currentTimeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `<div class="current-time-indicator" data-label="${currentTimeStr}"></div>`;
}

function stripTitlePrefix(title) {
  return title.replace(/^\s*\d+\s*-\s*/, '').trim();
}

function formatTeacherName(teacher) {
  if (!teacher) return '';
  return teacher.split(',').map(t => t.trim()).filter(Boolean).join(', ');
}

function extractTeacherFromDescription(rawDescription) {
  if (!rawDescription) return '';
  const match = rawDescription.match(/(?:Dozent|Dozentin)\s*:\s*([^\r\n]+)/i);
  if (!match || !match[1]) return '';
  const teacher = match[1].trim();
  return teacher === '-' ? '' : teacher;
}

function formatCourseLabel(title) {
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

function getLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekNumber(date) {
  const target = new Date(date.valueOf());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  const dayDiff = Math.round((target - week1) / 86400000);
  return 1 + Math.floor((dayDiff - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function groupEventsByDay(events) {
  return events.reduce((grouped, event) => {
    const date = new Date(event.start);
    const key = getLocalDateKey(date);
    grouped[key] = grouped[key] || [];
    grouped[key].push(event);
    return grouped;
  }, {});
}

function mergeConsecutiveEvents(dayEvents) {
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

function parsePauseMinutes(event) {
  if (!event || !event.rawDescription) return 0;
  const raw = event.rawDescription || '';
  const matched = raw.match(/Pause:\s*(?:inkl\.|inkl)?\s*(\d{1,3})\s*min/i) || raw.match(/(\d{1,3})\s*min\s*Pause/i);
  if (matched && matched[1]) return parseInt(matched[1], 10) || 0;
  return 0;
}

function isMobile() {
  return window.innerWidth <= 768;
}

function renderSkeletonLoader() {
  if (isMobile()) {
    const scheduleContainer = document.getElementById('scheduleContainerMobile');
    if (!scheduleContainer) return;

    scheduleContainer.innerHTML = Array.from({ length: 5 }, (_, dayIndex) => {
      return `
        <section class="day-section skeleton-loader" style="padding: 1rem; border-radius: 0.75rem; min-height: 200px;">
          <div class="skeleton-day-header skeleton-loader" style="height: 2rem; width: 40%; margin-bottom: 1rem;"></div>
          <div class="skeleton-event skeleton-loader" style="height: 100px; margin-bottom: 0.75rem;"></div>
          <div class="skeleton-event skeleton-loader" style="height: 80px; margin-bottom: 0.75rem;"></div>
        </section>
      `;
    }).join('');
  } else {
    const timeColumn = document.getElementById('timeColumn');
    const daysGrid = document.getElementById('daysGrid');
    if (!timeColumn || !daysGrid) return;

    timeColumn.innerHTML = Array.from({ length: 12 }, (_, index) => {
      return `<div class="time-slot skeleton-loader" style="min-height: 90px;"></div>`;
    }).join('');

    daysGrid.innerHTML = Array.from({ length: 5 }, (_, dayIndex) => {
      return `
        <section class="day-column-grid">
          <div class="day-header-grid">
            <div class="skeleton-day-header skeleton-loader"></div>
          </div>
          <div class="day-content" style="min-height: 1080px;">
            <div class="skeleton-event skeleton-loader" style="top: 50px; height: 120px;">
              <div class="skeleton-time skeleton-loader"></div>
              <div class="skeleton-title skeleton-loader"></div>
              <div class="skeleton-meta skeleton-loader"></div>
            </div>
            <div class="skeleton-event skeleton-loader" style="top: 200px; height: 90px;">
              <div class="skeleton-time skeleton-loader"></div>
              <div class="skeleton-title skeleton-loader"></div>
              <div class="skeleton-meta skeleton-loader"></div>
            </div>
            <div class="skeleton-event skeleton-loader" style="top: 320px; height: 150px;">
              <div class="skeleton-time skeleton-loader"></div>
              <div class="skeleton-title skeleton-loader"></div>
              <div class="skeleton-meta skeleton-loader"></div>
            </div>
          </div>
        </section>
      `;
    }).join('');
  }
}

function renderSchedule(data, selectedSource, referenceDate, searchQuery = '', isInitialLoad = false) {
  let events = selectedSource ? data.events.filter((event) => event.sourceId === selectedSource) : [];
  
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    events = events.filter(event => {
      const title = (event.title || '').toLowerCase();
      const location = (event.location || '').toLowerCase();
      const teacherText = event.teacher || extractTeacherFromDescription(event.rawDescription || '');
      const teacher = formatTeacherName(teacherText).toLowerCase();
      const description = (event.rawDescription || '').toLowerCase();
      
      return title.includes(query) || 
             location.includes(query) || 
             teacher.includes(query) || 
             description.includes(query);
    });
  }
  
  const grouped = groupEventsByDay(events);
  const weekStart = getMonday(referenceDate);
  
  // Update date labels for both desktop and mobile
  const dateRangeLabel = document.getElementById('dateRangeLabel');
  const dateRangeLabelMobile = document.getElementById('dateRangeLabelMobile');
  const weekBadge = document.getElementById('weekBadge');
  const weekBadgeMobile = document.getElementById('weekBadgeMobile');
  
  if (dateRangeLabel) {
    dateRangeLabel.textContent = formatDateRange(weekStart);
  }
  if (dateRangeLabelMobile) {
    dateRangeLabelMobile.textContent = formatDateRange(weekStart);
  }
  if (weekBadge) {
    weekBadge.textContent = `KW ${String(getWeekNumber(weekStart)).padStart(2, '0')}`;
  }
  if (weekBadgeMobile) {
    weekBadgeMobile.textContent = `KW ${String(getWeekNumber(weekStart)).padStart(2, '0')}`;
  }
  
  const saturdayKey = getLocalDateKey(addDays(weekStart, 5));
  const hasSaturdayEvents = grouped[saturdayKey] && grouped[saturdayKey].length > 0;
  const weekDays = Array.from({ length: hasSaturdayEvents ? 6 : 5 }, (_, index) => addDays(weekStart, index));

  if (isMobile()) {
    renderMobileSchedule(grouped, weekDays, isInitialLoad);
  } else {
    renderDesktopSchedule(grouped, weekDays, isInitialLoad);
  }
}

function renderDesktopSchedule(grouped, weekDays, isInitialLoad) {
  let minHour = 6;
  let maxHour = 18;
  const displayedEvents = [];

  weekDays.forEach((day) => {
    const key = getLocalDateKey(day);
    (grouped[key] || []).forEach((event) => displayedEvents.push(event));
  });

  displayedEvents.forEach((event) => {
    if (event.start) {
      const s = new Date(event.start);
      const e = new Date(event.end);
      minHour = Math.min(minHour, Math.floor(s.getHours() + s.getMinutes() / 60));
      maxHour = Math.max(maxHour, Math.ceil(e.getHours() + e.getMinutes() / 60));
    }
  });

  minHour = Math.max(0, Math.min(12, minHour));
  maxHour = Math.max(minHour + 4, Math.min(24, maxHour));
  const totalHours = Math.max(4, maxHour - minHour);
  const slotHeightPx = 100;
  const dayHeightPx = totalHours * slotHeightPx;
  const wrapper = document.querySelector('.schedule-grid-wrapper');

  if (wrapper) {
    wrapper.style.setProperty('--slot-height', `${slotHeightPx}px`);
    wrapper.style.setProperty('--day-height', `${dayHeightPx}px`);
  }

  const timeColumn = document.getElementById('timeColumn');
  const daysGrid = document.getElementById('daysGrid');
  if (!timeColumn || !daysGrid) return;

  daysGrid.className = weekDays.length === 6 ? 'days-grid with-saturday' : 'days-grid';
  timeColumn.innerHTML = Array.from({ length: totalHours + 1 }, (_, index) => {
    const hour = minHour + index;
    return `<div class="time-slot">${String(hour).padStart(2, '0')}:00</div>`;
  }).join('');

  const todayKey = getLocalDateKey(new Date());
  daysGrid.innerHTML = weekDays.map((day) => {
    const key = getLocalDateKey(day);
    const eventsForDay = (grouped[key] || []).slice().sort((a, b) => new Date(a.start) - new Date(b.start));
    const merged = mergeConsecutiveEvents(eventsForDay);
    const eventsHtml = merged.map((ev) => {
      const s = new Date(ev.start);
      const e = new Date(ev.end);
      const top = ((s.getHours() + s.getMinutes() / 60) - minHour) / totalHours * dayHeightPx;
      const height = Math.max(40, ((e.getTime() - s.getTime()) / (1000 * 60 * 60)) * dayHeightPx / totalHours);
      const location = ev.location ? `<div class="event-item-meta"><span class="material-symbols-outlined" style="font-size: 0.9rem;">location_on</span> ${ev.location}</div>` : '';
      const teacherText = ev.teacher || extractTeacherFromDescription(ev.rawDescription || '');
      const teacher = teacherText ? `<div class="event-item-meta"><span class="material-symbols-outlined" style="font-size: 0.9rem;">person</span> ${formatTeacherName(teacherText)}</div>` : '';
      const notes = `${ev.rawDescription || ''} ${ev.title || ''}`.toLowerCase();
      const isExam = /klausur(?!\s*vorbereitung)/.test(notes);
      const isOnline = !isExam && (/online/.test(notes) || ev.online);
      const typeClass = isExam ? ' exam' : isOnline ? ' online' : '';
      let typeLabel = 'Vorlesung';
      let pillColorClass = 'pill-blue';
      if (isExam) {
        typeLabel = 'Klausur';
        pillColorClass = 'pill-red';
      } else if (isOnline) {
        typeLabel = 'Online-Vorlesung';
        pillColorClass = 'pill-green';
      }
      const pillTag = `<div class="pill ${pillColorClass}">${typeLabel}</div>`;
      return `<div class="event-item${typeClass}" style="top:${top}px;height:${height}px;">${pillTag}<div class="event-item-time">${formatTime(ev.start)} – ${formatTime(ev.end)}</div><div class="event-item-title">${stripTitlePrefix(ev.title)}</div>${location}${teacher}</div>`;
    }).join('');

    const dayDateLabel = `${dayNames[day.getDay()]} ${formatDateShort(day)}`;
    const isToday = getLocalDateKey(day) === todayKey;

    const dayProgressHtml = buildCurrentDayProgressHtml(day, eventsForDay, minHour, totalHours, dayHeightPx, showProgressLabel);
    const dayContentStyle = `style="min-height:${dayHeightPx}px;"`;

    return `
      <section class="day-column-grid${isToday ? ' current-day' : ''}">
        <div class="day-header-grid">
          <span class="day-name-grid">${dayDateLabel}</span>
        </div>
        <div class="day-content" ${dayContentStyle}>
          ${dayProgressHtml}
          ${eventsHtml}
        </div>
      </section>
    `;
  }).join('');
}

function renderMobileSchedule(grouped, weekDays, isInitialLoad) {
  const scheduleContainer = document.getElementById('scheduleContainerMobile');
  if (!scheduleContainer) return;

  const todayKey = getLocalDateKey(new Date());
  const dayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  scheduleContainer.innerHTML = weekDays.map((day, index) => {
    const key = getLocalDateKey(day);
    const eventsForDay = (grouped[key] || []).slice().sort((a, b) => new Date(a.start) - new Date(b.start));
    const merged = mergeConsecutiveEvents(eventsForDay);
    
    const eventsHtml = merged.map((ev) => {
      const s = new Date(ev.start);
      const e = new Date(ev.end);
      const location = ev.location ? `<div class="flex items-center gap-2 text-gray-500"><span class="material-symbols-outlined text-[18px]">meeting_room</span><span class="text-sm">${ev.location}</span></div>` : '';
      const teacherText = ev.teacher || extractTeacherFromDescription(ev.rawDescription || '');
      const teacher = teacherText ? `<div class="flex items-center gap-2 text-gray-500 col-span-2"><span class="material-symbols-outlined text-[18px]">person</span><span class="text-sm">${formatTeacherName(teacherText)}</span></div>` : '';
      const notes = `${ev.rawDescription || ''} ${ev.title || ''}`.toLowerCase();
      const isExam = /klausur(?!\s*vorbereitung)/.test(notes);
      const isOnline = !isExam && (/online/.test(notes) || ev.online);
      let typeLabel = 'V';
      let typeColorClass = 'bg-blue-50 text-[#002551]';
      if (isExam) {
        typeLabel = 'K';
        typeColorClass = 'bg-red-50 text-red-700';
      } else if (isOnline) {
        typeLabel = 'O';
        typeColorClass = 'bg-green-50 text-green-700';
      }
      
      const borderColor = isExam ? 'border-red-600' : isOnline ? 'border-green-600' : 'border-[#003a79]';
      
      return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex transition-all active:scale-[0.98] event-card">
          <div class="w-1 ${borderColor}"></div>
          <div class="p-4 flex-1">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-lg font-semibold text-gray-900">${stripTitlePrefix(ev.title)}</h3>
              <span class="${typeColorClass} px-2 py-0.5 rounded text-xs font-mono">${typeLabel}</span>
            </div>
            <div class="grid grid-cols-2 gap-y-2">
              <div class="flex items-center gap-2 text-gray-500">
                <span class="material-symbols-outlined text-[18px]">schedule</span>
                <span class="text-sm">${formatTime(ev.start)} - ${formatTime(ev.end)}</span>
              </div>
              ${location}
              ${teacher}
            </div>
          </div>
        </div>
      `;
    }).join('');

    const dayDateLabel = formatDateShort(day);
    const isToday = getLocalDateKey(day) === todayKey;
    const dayName = dayNames[day.getDay()];
    const borderClass = isToday ? 'border-red-600' : 'border-blue-600';
    
    const timeIndicatorHtml = buildCurrentTimeIndicator(day, eventsForDay);

    return `
      <section id="${dayIds[index]}" class="space-y-4">
        <div class="flex items-center justify-between border-l-4 ${borderClass} pl-3">
          <h2 class="text-lg font-semibold text-[#002551]">${dayName}</h2>
          <span class="text-xs font-mono text-gray-500">${dayDateLabel.toUpperCase()}</span>
        </div>
        ${timeIndicatorHtml}
        <div class="space-y-3">
          ${eventsHtml}
        </div>
      </section>
    `;
  }).join('');
  
  // Scroll to current day only on initial load
  if (isInitialLoad && !hasInitialScrollOccurred) {
    hasInitialScrollOccurred = true;
    setTimeout(scrollToCurrentDay, 100);
  }
}

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};path=/;expires=${date.toUTCString()}`;
}

function getCookie(name) {
  const match = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return match ? match[2] : null;
}

function deleteCookie(name) {
  setCookie(name, '', -1);
}

function generateICS(events, weekStart) {
  const weekEnd = addDays(weekStart, 4);
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HWR Berlin Stundenplan//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:HWR Berlin Stundenplan',
    'X-WR-TIMEZONE:Europe/Berlin',
    'X-WR-CALDESC:Exportierter Stundenplan von HWR Berlin'
  ];

  events.forEach(event => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const now = new Date();
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = stripTitlePrefix(event.title || '').replace(/,/g, '\\,');
    const location = (event.location || '').replace(/,/g, '\\,');
    const teacherText = event.teacher || extractTeacherFromDescription(event.rawDescription || '');
    const teacher = formatTeacherName(teacherText).replace(/,/g, '\\,');
    const description = `Dozent: ${teacher}\\nRaum: ${location}`.replace(/,/g, '\\,');

    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`DTSTART:${formatDate(startDate)}`);
    icsLines.push(`DTEND:${formatDate(endDate)}`);
    icsLines.push(`DTSTAMP:${formatDate(now)}`);
    icsLines.push(`SUMMARY:${title}`);
    icsLines.push(`LOCATION:${location}`);
    icsLines.push(`DESCRIPTION:${description}`);
    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');
  return icsLines.join('\r\n');
}

function downloadICS(icsContent, filename) {
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

function scrollToCurrentDay() {
  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Map to weekday ID (monday, tuesday, wednesday, thursday, friday)
  let targetDayId;
  if (currentDayIndex === 0 || currentDayIndex === 6) {
    // Weekend: default to Monday
    targetDayId = 'monday';
  } else {
    // Weekday: map to ID
    const dayIds = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    targetDayId = dayIds[currentDayIndex];
  }
  
  const targetSection = document.getElementById(targetDayId);
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function init() {
  renderSkeletonLoader();
  
  try {
    let data;
    let isOffline = false;
    
    try {
      const response = await fetch('schedule.json');
      data = await response.json();
      cacheScheduleData(data);
    } catch (fetchError) {
      console.warn('Failed to fetch schedule.json, trying cache:', fetchError);
      data = getCachedScheduleData();
      if (data) {
        isOffline = true;
        console.log('Using cached schedule data (offline mode)');
      } else {
        throw new Error('No cached data available and fetch failed');
      }
    }

    // Desktop controls
    const semesterSelect = document.getElementById('semesterSelect');
    const facultySelect = document.getElementById('facultySelect');
    const courseSelect = document.getElementById('courseSelect');
    const prevButton = document.getElementById('prevWeek');
    const nextButton = document.getElementById('nextWeek');
    const resetButton = document.getElementById('resetCache');
    const exportButton = document.getElementById('exportCalendar');
    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearch');
    const toggleButton = document.getElementById('toggleFilterButton');
    const toggleProgressButton = document.getElementById('toggleProgressLabel');

    // Mobile controls
    const semesterSelectMobile = document.getElementById('semesterSelectMobile');
    const facultySelectMobile = document.getElementById('facultySelectMobile');
    const courseSelectMobile = document.getElementById('courseSelectMobile');
    const prevButtonMobile = document.getElementById('prevWeekMobile');
    const nextButtonMobile = document.getElementById('nextWeekMobile');
    const resetButtonMobile = document.getElementById('resetCacheMobile');
    const currentWeekButton = document.getElementById('currentWeek');
    const searchInputMobile = document.getElementById('searchInputMobile');
    const clearSearchButtonMobile = document.getElementById('clearSearchMobile');
    const toggleButtonMobile = document.getElementById('toggleFilterButtonMobile');
    const toggleProgressButtonMobile = document.getElementById('toggleProgressLabelMobile');

    const cacheKey = 'st-plan-selection-v1';
    const schedules = data.schedules || [];
    const maxSemester = data.maxSemester || 1;
    let currentWeekStart = getMonday(new Date());
    let activeSource = null;
    let searchQuery = '';

    const semesterOptions = Array.from({ length: maxSemester }, (_, index) => `semester${index + 1}`);
    
    // Populate desktop selects
    if (semesterSelect) {
      semesterSelect.innerHTML = semesterOptions.map((semester, index) => `<option value="${semester}">Semester ${index + 1}</option>`).join('');
    }
    
    // Populate mobile selects
    if (semesterSelectMobile) {
      semesterSelectMobile.innerHTML = semesterOptions.map((semester, index) => `<option value="${semester}">Semester ${index + 1}</option>`).join('');
    }

    function populateFaculties(semesterSelect, facultySelect) {
      if (!semesterSelect || !facultySelect) return;
      const sem = semesterSelect.value;
      const faculties = Array.from(new Set(schedules.filter((schedule) => schedule.semester === sem).map((schedule) => schedule.faculty).filter(Boolean))).sort();
      facultySelect.innerHTML = faculties.length ? faculties.map((faculty) => `<option value="${faculty}">${faculty}</option>`).join('') : '<option value="">Keine Fachrichtung verfügbar</option>';
    }

    function populateCourses(courseSelect, semesterSelect, facultySelect) {
      if (!courseSelect) return;
      const sem = semesterSelect ? semesterSelect.value : '';
      const fac = facultySelect ? facultySelect.value : '';
      const courses = schedules.filter((schedule) => schedule.semester === sem && schedule.faculty === fac);
      courseSelect.innerHTML = courses.length ? courses.map((course) => `<option value="${course.id}">${formatCourseLabel(course.title)}</option>`).join('') : '<option value="">Kein Kurs verfügbar</option>';
    }

    function syncSelects(sourceSelect, targetSelect) {
      if (sourceSelect && targetSelect) {
        targetSelect.value = sourceSelect.value;
      }
    }

    function saveSelection() {
      const select = isMobile() ? semesterSelectMobile : semesterSelect;
      const facultySel = isMobile() ? facultySelectMobile : facultySelect;
      const courseSel = isMobile() ? courseSelectMobile : courseSelect;
      
      if (!select || !facultySel || !courseSel) return;
      
      const selection = {
        semester: select.value,
        faculty: facultySel.value,
        courseId: courseSel.value,
      };
      const payload = JSON.stringify(selection);
      try {
        localStorage.setItem(cacheKey, payload);
      } catch (error) {
        setCookie(cacheKey, encodeURIComponent(payload), 365);
      }
    }

    function loadCachedSelection() {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (error) {
        console.warn(error);
      }
      try {
        const cookieValue = getCookie(cacheKey);
        if (cookieValue) return JSON.parse(decodeURIComponent(cookieValue));
      } catch (error) {
        console.warn(error);
      }
      return null;
    }

    // Desktop event listeners
    if (semesterSelect) {
      semesterSelect.addEventListener('change', () => {
        populateFaculties(semesterSelect, facultySelect);
        populateCourses(courseSelect, semesterSelect, facultySelect);
        syncSelects(semesterSelect, semesterSelectMobile);
        syncSelects(facultySelect, facultySelectMobile);
        syncSelects(courseSelect, courseSelectMobile);
        saveSelection();
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (facultySelect) {
      facultySelect.addEventListener('change', () => {
        populateCourses(courseSelect, semesterSelect, facultySelect);
        syncSelects(facultySelect, facultySelectMobile);
        syncSelects(courseSelect, courseSelectMobile);
        saveSelection();
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (courseSelect) {
      courseSelect.addEventListener('change', () => {
        activeSource = courseSelect.value;
        syncSelects(courseSelect, courseSelectMobile);
        saveSelection();
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        try {
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(SCHEDULE_CACHE_KEY);
          localStorage.removeItem(SCHEDULE_CACHE_TIMESTAMP_KEY);
          deleteCookie(cacheKey);
        } catch (error) {
          console.warn(error);
        }
        location.reload();
      });
    }

    if (exportButton) {
      exportButton.addEventListener('click', () => {
        const events = activeSource ? data.events.filter((event) => event.sourceId === activeSource) : [];
        if (events.length === 0) {
          alert('Keine Veranstaltungen zum Exportieren gefunden.');
          return;
        }
        const icsContent = generateICS(events, currentWeekStart);
        const filename = `hwr-stundenplan-${formatDateShort(currentWeekStart)}.ics`;
        downloadICS(icsContent, filename);
      });
    }

    if (currentWeekButton) {
      currentWeekButton.addEventListener('click', () => {
        currentWeekStart = getMonday(new Date());
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearSearchButton) clearSearchButton.style.display = searchQuery ? 'flex' : 'none';
        if (searchInputMobile) searchInputMobile.value = searchQuery;
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (clearSearchButton) {
      clearSearchButton.addEventListener('click', () => {
        searchQuery = '';
        searchInput.value = '';
        clearSearchButton.style.display = 'none';
        if (searchInputMobile) searchInputMobile.value = '';
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        updateFilterState(!filterCollapsed);
      });
    }

    if (toggleProgressButton) {
      toggleProgressButton.addEventListener('click', () => {
        showProgressLabel = !showProgressLabel;
        localStorage.setItem(PROGRESS_LABEL_KEY, String(showProgressLabel));
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (toggleProgressButtonMobile) {
      toggleProgressButtonMobile.addEventListener('click', () => {
        showProgressLabel = !showProgressLabel;
        localStorage.setItem(PROGRESS_LABEL_KEY, String(showProgressLabel));
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    // Mobile event listeners
    if (semesterSelectMobile) {
      semesterSelectMobile.addEventListener('change', () => {
        populateFaculties(semesterSelectMobile, facultySelectMobile);
        populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile);
        syncSelects(semesterSelectMobile, semesterSelect);
        syncSelects(facultySelectMobile, facultySelect);
        syncSelects(courseSelectMobile, courseSelect);
        saveSelection();
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (facultySelectMobile) {
      facultySelectMobile.addEventListener('change', () => {
        populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile);
        syncSelects(facultySelectMobile, facultySelect);
        syncSelects(courseSelectMobile, courseSelect);
        saveSelection();
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (courseSelectMobile) {
      courseSelectMobile.addEventListener('change', () => {
        activeSource = courseSelectMobile.value;
        syncSelects(courseSelectMobile, courseSelect);
        saveSelection();
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (prevButtonMobile) {
      prevButtonMobile.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (nextButtonMobile) {
      nextButtonMobile.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (resetButtonMobile) {
      resetButtonMobile.addEventListener('click', () => {
        try {
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(SCHEDULE_CACHE_KEY);
          localStorage.removeItem(SCHEDULE_CACHE_TIMESTAMP_KEY);
          deleteCookie(cacheKey);
        } catch (error) {
          console.warn(error);
        }
        location.reload();
      });
    }

    if (searchInputMobile) {
      searchInputMobile.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearSearchButtonMobile) clearSearchButtonMobile.style.display = searchQuery ? 'flex' : 'none';
        if (searchInput) searchInput.value = searchQuery;
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (clearSearchButtonMobile) {
      clearSearchButtonMobile.addEventListener('click', () => {
        searchQuery = '';
        searchInputMobile.value = '';
        clearSearchButtonMobile.style.display = 'none';
        if (searchInput) searchInput.value = '';
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (toggleButtonMobile) {
      toggleButtonMobile.addEventListener('click', () => {
        const mobileConfigPanel = document.getElementById('mobileConfigPanel');
        if (mobileConfigPanel) {
          mobileConfigPanel.classList.toggle('collapsed');
        }
      });
    }

    const cached = loadCachedSelection();
    if (cached && semesterOptions.includes(cached.semester)) {
      if (semesterSelect) semesterSelect.value = cached.semester;
      if (semesterSelectMobile) semesterSelectMobile.value = cached.semester;
    }
    
    if (semesterSelect) populateFaculties(semesterSelect, facultySelect);
    if (semesterSelectMobile) populateFaculties(semesterSelectMobile, facultySelectMobile);
    
    if (cached && cached.faculty) {
      if (facultySelect) facultySelect.value = cached.faculty;
      if (facultySelectMobile) facultySelectMobile.value = cached.faculty;
    }
    
    if (courseSelect) populateCourses(courseSelect, semesterSelect, facultySelect);
    if (courseSelectMobile) populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile);
    
    if (cached && cached.courseId) {
      if (courseSelect) courseSelect.value = cached.courseId;
      if (courseSelectMobile) courseSelectMobile.value = cached.courseId;
    }
    
    activeSource = (courseSelect && courseSelect.value) || (courseSelectMobile && courseSelectMobile.value) || activeSource;

    filterCollapsed = getInitialFilterCollapsed();
    updateFilterState(filterCollapsed);
    renderSchedule(data, activeSource, currentWeekStart, searchQuery, true);
    
    // Handle window resize to update layout
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      }, 250);
    });
    
    if (isOffline) {
      const offlineIndicator = document.createElement('div');
      offlineIndicator.className = 'offline-indicator';
      offlineIndicator.innerHTML = '<span class="material-symbols-outlined">cloud_off</span> Offline-Modus: Gecachte Daten';
      offlineIndicator.style.cssText = 'position:fixed;bottom:1rem;right:1rem;background:#fef2f2;border:1px solid #fca5a5;color:#dc2626;padding:0.75rem 1rem;border-radius:1rem;font-size:0.85rem;font-weight:600;display:flex;align-items:center;gap:0.5rem;z-index:1000;box-shadow:0 4px 12px rgba(220,38,38,0.15);';
      document.body.appendChild(offlineIndicator);
    }
  } catch (error) {
    const status = document.getElementById('status');
    if (status) status.textContent = 'Fehler beim Laden von schedule.json.';
    console.error(error);
  }
}

window.addEventListener('DOMContentLoaded', init);
