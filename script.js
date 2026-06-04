const FILTER_COLLAPSED_KEY = 'st-plan-filter-collapsed';
const FILTER_SEEN_KEY = 'st-plan-filter-seen';
const PROGRESS_DISPLAY_KEY = 'st-plan-show-progress';
let filterCollapsed = false;

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

function loadProgressVisibility() {
  const stored = localStorage.getItem(PROGRESS_DISPLAY_KEY);
  return stored === 'true';
}

function saveProgressVisibility(enabled) {
  localStorage.setItem(PROGRESS_DISPLAY_KEY, String(enabled));
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

  let labelText = '';
  if (showLabel && eventsForDay.length) {
    const dayStart = eventsForDay.reduce((min, ev) => {
      const start = new Date(ev.start).getTime();
      return Math.min(min, start);
    }, Infinity);
    const dayEnd = eventsForDay.reduce((max, ev) => {
      const end = new Date(ev.end).getTime();
      return Math.max(max, end);
    }, -Infinity);

    if (dayStart < dayEnd) {
      const startHour = new Date(dayStart).getHours() + new Date(dayStart).getMinutes() / 60;
      const endHour = new Date(dayEnd).getHours() + new Date(dayEnd).getMinutes() / 60;
      const progressPercent = Math.min(100, Math.max(0, ((currentHour - startHour) / (endHour - startHour)) * 100));
      labelText = `${formatProgressPercent(progressPercent)}`;
    }
  }

  return `<div class="current-time-indicator${labelText ? '' : ' no-label'}" data-label="${labelText}" style="top:${positionTop}px"></div>`;
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

function renderSchedule(data, selectedSource, referenceDate, showProgress = false) {
  const events = selectedSource ? data.events.filter((event) => event.sourceId === selectedSource) : [];
  const grouped = groupEventsByDay(events);
  const weekStart = getMonday(referenceDate);
  const dateRangeLabel = document.getElementById('dateRangeLabel');
  const weekBadge = document.getElementById('weekBadge');
  if (dateRangeLabel) {
    dateRangeLabel.textContent = formatDateRange(weekStart);
  }
  if (weekBadge) {
    weekBadge.textContent = `KW ${String(getWeekNumber(weekStart)).padStart(2, '0')}`;
  }
  const saturdayKey = getLocalDateKey(addDays(weekStart, 5));
  const hasSaturdayEvents = grouped[saturdayKey] && grouped[saturdayKey].length > 0;
  const weekDays = Array.from({ length: hasSaturdayEvents ? 6 : 5 }, (_, index) => addDays(weekStart, index));

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

  daysGrid.className = hasSaturdayEvents ? 'days-grid with-saturday' : 'days-grid';
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

    const dayProgressHtml = buildCurrentDayProgressHtml(day, eventsForDay, minHour, totalHours, dayHeightPx, showProgress);

    return `
      <section class="day-column-grid${isToday ? ' current-day' : ''}">
        <div class="day-header-grid">
          <span class="day-name-grid">${dayDateLabel}</span>
        </div>
        <div class="day-content" style="min-height:${dayHeightPx}px;">
          ${dayProgressHtml}
          ${eventsHtml}
        </div>
      </section>
    `;
  }).join('');
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

async function init() {
  try {
    const response = await fetch('schedule.json');
    const data = await response.json();

    const semesterSelect = document.getElementById('semesterSelect');
    const facultySelect = document.getElementById('facultySelect');
    const courseSelect = document.getElementById('courseSelect');
    const prevButton = document.getElementById('prevWeek');
    const nextButton = document.getElementById('nextWeek');
    const resetButton = document.getElementById('resetCache');
    const toggleButton = document.getElementById('toggleFilterButton');
    const showProgressToggle = document.getElementById('showProgressToggle');

    const cacheKey = 'st-plan-selection-v1';
    const schedules = data.schedules || [];
    const maxSemester = data.maxSemester || 1;
    let currentWeekStart = getMonday(new Date());
    let activeSource = null;
    let showProgress = loadProgressVisibility();

    const semesterOptions = Array.from({ length: maxSemester }, (_, index) => `semester${index + 1}`);
    semesterSelect.innerHTML = semesterOptions.map((semester, index) => `<option value="${semester}">Semester ${index + 1}</option>`).join('');

    function populateFaculties() {
      const sem = semesterSelect.value;
      const faculties = Array.from(new Set(schedules.filter((schedule) => schedule.semester === sem).map((schedule) => schedule.faculty).filter(Boolean))).sort();
      facultySelect.innerHTML = faculties.length ? faculties.map((faculty) => `<option value="${faculty}">${faculty}</option>`).join('') : '<option value="">Keine Fachrichtung verfügbar</option>';
    }

    function populateCourses() {
      const sem = semesterSelect.value;
      const fac = facultySelect.value;
      const courses = schedules.filter((schedule) => schedule.semester === sem && schedule.faculty === fac);
      courseSelect.innerHTML = courses.length ? courses.map((course) => `<option value="${course.id}">${formatCourseLabel(course.title)}</option>`).join('') : '<option value="">Kein Kurs verfügbar</option>';
      activeSource = courses.length ? courseSelect.value || courses[0].id : null;
    }

    function saveSelection() {
      const selection = {
        semester: semesterSelect.value,
        faculty: facultySelect.value,
        courseId: courseSelect.value,
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

    semesterSelect.addEventListener('change', () => {
      populateFaculties();
      populateCourses();
      saveSelection();
      renderSchedule(data, activeSource, currentWeekStart);
    });

    facultySelect.addEventListener('change', () => {
      populateCourses();
      saveSelection();
      renderSchedule(data, activeSource, currentWeekStart, showProgress);
    });

    courseSelect.addEventListener('change', () => {
      activeSource = courseSelect.value;
      saveSelection();
      renderSchedule(data, activeSource, currentWeekStart, showProgress);
    });

    prevButton.addEventListener('click', () => {
      currentWeekStart = addDays(currentWeekStart, -7);
      renderSchedule(data, activeSource, currentWeekStart, showProgress);
    });

    nextButton.addEventListener('click', () => {
      currentWeekStart = addDays(currentWeekStart, 7);
      renderSchedule(data, activeSource, currentWeekStart, showProgress);
    });

    resetButton.addEventListener('click', () => {
      try {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(PROGRESS_DISPLAY_KEY);
        deleteCookie(cacheKey);
      } catch (error) {
        console.warn(error);
      }
      location.reload();
    });

    if (showProgressToggle) {
      showProgressToggle.checked = showProgress;
      showProgressToggle.addEventListener('change', () => {
        showProgress = showProgressToggle.checked;
        saveProgressVisibility(showProgress);
        renderSchedule(data, activeSource, currentWeekStart, showProgress);
      });
    }

    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        updateFilterState(!filterCollapsed);
      });
    }

    const cached = loadCachedSelection();
    if (cached && semesterOptions.includes(cached.semester)) semesterSelect.value = cached.semester;
    populateFaculties();
    if (cached && cached.faculty) facultySelect.value = cached.faculty;
    populateCourses();
    if (cached && cached.courseId) courseSelect.value = cached.courseId;
    activeSource = courseSelect.value || activeSource;

    filterCollapsed = getInitialFilterCollapsed();
    updateFilterState(filterCollapsed);
    renderSchedule(data, activeSource, currentWeekStart, showProgress);
  } catch (error) {
    const status = document.getElementById('status');
    if (status) status.textContent = 'Fehler beim Laden von schedule.json.';
    console.error(error);
  }
}

window.addEventListener('DOMContentLoaded', init);
