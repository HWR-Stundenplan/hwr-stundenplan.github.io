import { isMobile, dayNames, formatTime, formatDateShort, getLocalDateKey, getMonday, addDays, getWeekNumber, formatDateRange, stripTitlePrefix } from './utils.js';
import { formatTeacherName } from './lecturer.js';
import { groupEventsByDay, mergeConsecutiveEvents } from './events.js';
import { showProgressLabel, shouldAnimateProgress } from './config.js';

export function renderSkeletonLoader() {
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

export function renderSchedule(data, selectedSource, referenceDate, searchQuery = '', isInitialLoad = false, showAllEvents = false) {
  let events = showAllEvents ? data.events : (selectedSource ? data.events.filter((event) => event.sourceId === selectedSource) : []);

  const lecturerDb = buildLecturerDatabase(data.events);

  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    events = events.filter(event => {
      const title = (event.title || '').toLowerCase();
      const location = (event.location || '').toLowerCase();
      const teacherText = event.teacher || extractTeacherFromDescription(event.rawDescription || '');
      const teacher = formatTeacherName(teacherText, lecturerDb).toLowerCase();
      const description = (event.rawDescription || '').toLowerCase();
      
      return title.includes(query) || 
             location.includes(query) || 
             teacher.includes(query) || 
             description.includes(query);
    });
  }
  
  const grouped = groupEventsByDay(events);
  const weekStart = getMonday(referenceDate);
  
  updateDateLabels(weekStart);
  
  const saturdayKey = getLocalDateKey(addDays(weekStart, 5));
  const hasSaturdayEvents = grouped[saturdayKey] && grouped[saturdayKey].length > 0;
  const weekDays = Array.from({ length: hasSaturdayEvents ? 6 : 5 }, (_, index) => addDays(weekStart, index));

  if (isMobile()) {
    renderMobileSchedule(grouped, weekDays, isInitialLoad, lecturerDb);
  } else {
    renderDesktopSchedule(grouped, weekDays, isInitialLoad, lecturerDb);
  }
}

function updateDateLabels(weekStart) {
  const dateRangeLabel = document.getElementById('dateRangeLabel');
  const dateRangeLabelMobile = document.getElementById('dateRangeLabelMobile');
  const weekBadge = document.getElementById('weekBadge');
  const weekBadgeMobile = document.getElementById('weekBadgeMobile');
  const dateRangeLabelBottom = document.getElementById('dateRangeLabelBottom');
  const dateRangeLabelMobileBottom = document.getElementById('dateRangeLabelMobileBottom');
  const weekBadgeBottom = document.getElementById('weekBadgeBottom');
  const weekBadgeMobileBottom = document.getElementById('weekBadgeMobileBottom');
  
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
  if (dateRangeLabelBottom) {
    dateRangeLabelBottom.textContent = formatDateRange(weekStart);
  }
  if (dateRangeLabelMobileBottom) {
    dateRangeLabelMobileBottom.textContent = formatDateRange(weekStart);
  }
  if (weekBadgeBottom) {
    weekBadgeBottom.textContent = `KW ${String(getWeekNumber(weekStart)).padStart(2, '0')}`;
  }
  if (weekBadgeMobileBottom) {
    weekBadgeMobileBottom.textContent = `KW ${String(getWeekNumber(weekStart)).padStart(2, '0')}`;
  }
}

function renderDesktopSchedule(grouped, weekDays, isInitialLoad, lecturerDb) {
  let minHour = 7;
  let maxHour = 21;
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
      const notes = `${ev.rawDescription || ''} ${ev.title || ''}`.toLowerCase();
      const isExam = /klausur(?!\s*vorbereitung)/.test(notes);
      const isOnline = !isExam && (/online/.test(notes) || ev.online);
      const isAsync = !isExam && !isOnline && (/asynchron/.test(notes) || /asynchrone lehre/.test(notes));
      const teacherText = ev.teacher || extractTeacherFromDescription(ev.rawDescription || '');
      const isWegzeit = teacherText && teacherText.toLowerCase() === 'wegzeit';
      const location = ev.location && !isWegzeit ? `<div class="event-item-meta"><span class="material-symbols-outlined" style="font-size: 0.9rem;">location_on</span> ${ev.location}${isAsync ? ' <span style="color: #7c3aed;">(asynchron)</span>' : ''}</div>` : '';
      const teacher = teacherText && !isWegzeit ? `<div class="event-item-meta"><span class="material-symbols-outlined" style="font-size: 0.9rem;">person</span> ${formatTeacherName(teacherText, lecturerDb)}</div>` : '';
      const typeClass = isWegzeit ? ' wegzeit' : isExam ? ' exam' : isOnline ? ' online' : isAsync ? ' async' : '';
      let typeLabel = 'Vorlesung';
      let pillColorClass = 'pill-blue';
      if (isWegzeit) {
        typeLabel = 'Wegzeit';
        pillColorClass = 'pill-green';
      } else if (isExam) {
        typeLabel = 'Klausur';
        pillColorClass = 'pill-red';
      } else if (isOnline) {
        typeLabel = 'Online-Vorlesung';
        pillColorClass = 'pill-green';
      } else if (isAsync) {
        typeLabel = 'Asynchrone Lehre';
        pillColorClass = 'pill-purple';
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

  if (isInitialLoad && !hasInitialScrollOccurred) {
    hasInitialScrollOccurred = true;
    setTimeout(() => {
      window.scrollTo({
        top: 400,
        behavior: 'smooth'
      });
    }, 100);
  }
}

function renderMobileSchedule(grouped, weekDays, isInitialLoad, lecturerDb) {
  const scheduleContainer = document.getElementById('scheduleContainerMobile');
  if (!scheduleContainer) return;

  const todayKey = getLocalDateKey(new Date());
  const dayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;
  const eventsForToday = (grouped[todayKey] || []).slice().sort((a, b) => new Date(a.start) - new Date(b.start));
  const hasEventsToday = eventsForToday.length > 0;

  let weekendProgressHtml = '';
  if (isWeekend && showProgressLabel && !hasEventsToday) {
    const animateClass = shouldAnimateProgress ? 'animate-progress' : '';
    const initialWidth = shouldAnimateProgress ? '0%' : '100%';
    const initialPercent = shouldAnimateProgress ? '0%' : '100%';
    weekendProgressHtml = `
      <div class="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200 mb-6 weekend-progress-container">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Tagesfortschritt</span>
          <span class="text-2xl font-bold text-[#002551] weekend-progress-percent">${initialPercent}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-[#002551] h-2 rounded-full transition-all duration-300 weekend-progress-bar ${animateClass}" style="width: ${initialWidth}"></div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Wochenende - 100% abgeschlossen</p>
      </div>
    `;
  }

  scheduleContainer.innerHTML = weekendProgressHtml + weekDays.map((day, index) => {
    const key = getLocalDateKey(day);
    const eventsForDay = (grouped[key] || []).slice().sort((a, b) => new Date(a.start) - new Date(b.start));
    const merged = mergeConsecutiveEvents(eventsForDay);

    const eventsHtml = merged.map((ev) => {
      const s = new Date(ev.start);
      const e = new Date(ev.end);
      const notes = `${ev.rawDescription || ''} ${ev.title || ''}`.toLowerCase();
      const isExam = /klausur(?!\s*vorbereitung)/.test(notes);
      const isOnline = !isExam && (/online/.test(notes) || ev.online);
      const isAsync = !isExam && !isOnline && (/asynchron/.test(notes) || /asynchrone lehre/.test(notes));
      const teacherText = ev.teacher || extractTeacherFromDescription(ev.rawDescription || '');
      const isWegzeit = teacherText && teacherText.toLowerCase() === 'wegzeit';
      const location = ev.location && !isWegzeit ? `<div class="flex items-center gap-2 text-gray-500"><span class="material-symbols-outlined text-[18px]">meeting_room</span><span class="text-sm">${ev.location}${isAsync ? ' <span style="color: #7c3aed;">(asynchron)</span>' : ''}</span></div>` : '';
      const teacher = teacherText && !isWegzeit ? `<div class="flex items-center gap-2 text-gray-500 col-span-2"><span class="material-symbols-outlined text-[18px]">person</span><span class="text-sm">${formatTeacherName(teacherText, lecturerDb)}</span></div>` : '';
      let typeLabel = 'V';
      let typeColorClass = 'bg-blue-50 text-[#002551]';
      if (isWegzeit) {
        typeLabel = 'W';
        typeColorClass = 'bg-green-50 text-green-700';
      } else if (isExam) {
        typeLabel = 'K';
        typeColorClass = 'bg-red-50 text-red-700';
      } else if (isOnline) {
        typeLabel = 'O';
        typeColorClass = 'bg-green-50 text-green-700';
      } else if (isAsync) {
        typeLabel = 'A';
        typeColorClass = 'bg-purple-50 text-purple-700';
      }

      const borderColor = isWegzeit ? 'border-green-400' : isExam ? 'border-red-600' : isOnline ? 'border-green-600' : isAsync ? 'border-purple-600' : 'border-[#003a79]';
      const typeClass = isWegzeit ? ' wegzeit' : isExam ? ' exam' : isOnline ? ' online' : isAsync ? ' async' : '';

      return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex transition-all active:scale-[0.98] event-card${typeClass}">
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

    let progressDisplayHtml = '';
    if (isToday && showProgressLabel) {
      let progressPercentValue = 0;
      let progressText = 'Heute keine Veranstaltungen';

      if (eventsForDay.length > 0) {
        const dayStart = eventsForDay.reduce((min, ev) => {
          const start = new Date(ev.start).getTime();
          return Math.min(min, start);
        }, Infinity);
        const dayEnd = eventsForDay.reduce((max, ev) => {
          const end = new Date(ev.end).getTime();
          return Math.max(max, end);
        }, -Infinity);

        if (dayStart < dayEnd) {
          const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
          const startHour = new Date(dayStart).getHours() + new Date(dayStart).getMinutes() / 60;
          const endHour = new Date(dayEnd).getHours() + new Date(dayEnd).getMinutes() / 60;

          if (currentHour < startHour) {
            progressPercentValue = 0;
          } else if (currentHour > endHour) {
            progressPercentValue = 100;
          } else {
            progressPercentValue = ((currentHour - startHour) / (endHour - startHour)) * 100;
          }

          const currentTimeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          const startTimeStr = new Date(dayStart).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          const endTimeStr = new Date(dayEnd).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          progressText = `Jetzt: ${currentTimeStr} | Tag: ${startTimeStr} - ${endTimeStr}`;
        }
      } else if (isWeekend && !hasEventsToday) {
        progressPercentValue = 100;
        progressText = 'Wochenende - 100% abgeschlossen';
      }

      const initialPercent = shouldAnimateProgress ? '0%' : `${Math.round(progressPercentValue)}%`;
      const initialWidth = shouldAnimateProgress ? '0%' : `${progressPercentValue}%`;
      const animateClass = shouldAnimateProgress ? 'day-progress-animate' : '';
      
      progressDisplayHtml = `
        <div class="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200" style="margin-top: 1rem;">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Tagesfortschritt</span>
            <span class="text-2xl font-bold text-[#002551] day-progress-percent-${index}">${initialPercent}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-[#002551] h-2 rounded-full transition-all duration-300 day-progress-bar-${index} ${animateClass}" style="width: ${initialWidth}"></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">${progressText}</p>
        </div>
      `;
    }

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
        ${progressDisplayHtml}
      </section>
    `;
  }).join('');

  if (isInitialLoad && !hasInitialScrollOccurred) {
    hasInitialScrollOccurred = true;
    setTimeout(scrollToCurrentDay, 100);
  }

  if (isWeekend && showProgressLabel && shouldAnimateProgress && !hasEventsToday) {
    setTimeout(() => {
      const progressBar = document.querySelector('.weekend-progress-bar');
      const progressPercent = document.querySelector('.weekend-progress-percent');
      if (progressBar) {
        progressBar.style.transition = 'width 1500ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        progressBar.style.width = '100%';
      }
      if (progressPercent) {
        let currentProgress = 0;
        const animationInterval = setInterval(() => {
          currentProgress += 2;
          if (currentProgress > 100) currentProgress = 100;
          updatePercentColor(progressPercent, currentProgress);
          if (currentProgress >= 100) {
            clearInterval(animationInterval);
            progressPercent.textContent = '100%';
          }
        }, 30);
        setTimeout(() => {
          progressPercent.textContent = '100%';
        }, 1500);
      }
    }, 100);
  }
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

  if (currentHour < startHour || currentHour > endHour) return '';

  const currentTimeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `<div class="current-time-indicator" data-label="${currentTimeStr}"></div>`;
}

function formatProgressPercent(value) {
  return `${Math.round(value)}%`;
}

function updatePercentColor(element, percent) {
  if (!element) return;
  
  if (percent >= 100) {
    element.classList.add('percent-green');
    element.style.color = '#16a34a';
  } else {
    element.classList.remove('percent-green');
    element.style.color = getProgressColor(percent);
  }
}

function getProgressColor(percent) {
  const startColor = { r: 22, g: 163, b: 74 };
  const endColor = { r: 22, g: 163, b: 74 };
  
  const ratio = percent / 100;
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function scrollToCurrentDay() {
  const now = new Date();
  const dayIndex = now.getDay();
  const dayIds = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetId = dayIds[dayIndex];
  const targetElement = document.getElementById(targetId);
  
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function extractTeacherFromDescription(rawDescription) {
  if (!rawDescription) return '';
  const match = rawDescription.match(/(?:Dozent|Dozentin)\s*:\s*([^\r\n]+)/i);
  if (!match || !match[1]) return '';
  const teacher = match[1].trim();
  return teacher === '-' ? '' : teacher;
}

function buildLecturerDatabase(events) {
  const lecturerMap = new Map();
  const referenceMap = getLecturerReferenceMap();
  
  events.forEach(event => {
    const teacherText = event.teacher || extractTeacherFromDescription(event.rawDescription || '');
    if (!teacherText) return;
    
    const teachers = teacherText.split(',').map(t => t.trim()).filter(Boolean);
    
    teachers.forEach(teacher => {
      const parsed = parseLecturerName(teacher);
      if (!parsed) return;
      
      const lastName = parsed.lastName.toLowerCase();
      
      let referenceLecturers = referenceMap.get(lastName);
      let lecturerData = parsed;
      
      if (!referenceLecturers || referenceLecturers.length === 0) {
        for (const [refLastName, refs] of referenceMap) {
          if (refLastName.includes(lastName) || lastName.includes(refLastName)) {
            referenceLecturers = refs;
            break;
          }
        }
      }
      
      if (referenceLecturers && referenceLecturers.length > 0) {
        if (referenceLecturers.length === 1) {
          lecturerData = { ...referenceLecturers[0], original: parsed.original };
        } else if (parsed.firstName) {
          const match = referenceLecturers.find(ref => {
            const refFirstName = ref.firstName.toLowerCase();
            const parsedFirstName = parsed.firstName.toLowerCase();
            return refFirstName === parsedFirstName || 
                   refFirstName.includes(parsedFirstName) || 
                   parsedFirstName.includes(refFirstName);
          });
          
          if (match) {
            lecturerData = { ...match, original: parsed.original };
          }
        }
      }
      
      if (!lecturerMap.has(lastName)) {
        lecturerMap.set(lastName, []);
      }
      
      lecturerMap.get(lastName).push(lecturerData);
    });
  });
  
  return lecturerMap;
}

// Import lecturer functions
import { getLecturerReferenceMap, parseLecturerName } from './lecturer.js';

let hasInitialScrollOccurred = false;
