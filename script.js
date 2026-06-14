const FILTER_COLLAPSED_KEY = 'st-plan-filter-collapsed';
const FILTER_SEEN_KEY = 'st-plan-filter-seen';
const SCHEDULE_CACHE_KEY = 'st-plan-schedule-cache';
const SCHEDULE_CACHE_TIMESTAMP_KEY = 'st-plan-schedule-cache-timestamp';
const PROGRESS_LABEL_KEY = 'st-plan-progress-label';
const FAVORITES_KEY = 'st-plan-favorites';
const PENDING_DELETE_KEY = 'st-plan-pending-delete';
const DAILY_VISIT_KEY = 'st-plan-daily-visit';
const SHOW_ALL_EVENTS_KEY = 'st-plan-show-all-events';
const DARK_MODE_KEY = 'st-plan-dark-mode';
const CACHE_EXPIRY_HOURS = 24;

// Study program abbreviation mapping
const STUDY_PROGRAMS = {
  'wi': 'Wirtschaftsinformatik',
  'dl': 'Dienstleistungsmanagement',
  'fm': 'Facility Management',
  'IBA': 'International Business Administration',
  'ppm': 'Projekt- und Prozessmanagement',
  'IP': 'Intellectual Property'
};
let filterCollapsed = false;
let hasInitialScrollOccurred = false;
let showProgressLabel = false;
let shouldAnimateProgress = false;
let showAllEvents = false;
let isDarkMode = false;

function hasVisitedToday() {
  const todayKey = getLocalDateKey(new Date());
  const lastVisit = localStorage.getItem(DAILY_VISIT_KEY);
  return lastVisit === todayKey;
}

function markDailyVisit() {
  const todayKey = getLocalDateKey(new Date());
  localStorage.setItem(DAILY_VISIT_KEY, todayKey);
}

function animateProgress(element, targetPercent, duration = 1500) {
  if (!element) return;
  
  element.style.width = '0%';
  element.style.transition = 'none';
  
  setTimeout(() => {
    element.style.transition = `width ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    element.style.width = targetPercent;
  }, 50);
}

function getProgressColor(percent) {
  // Interpolate from green (#16a34a) to green (#16a34a)
  const startColor = { r: 22, g: 163, b: 74 };
  const endColor = { r: 22, g: 163, b: 74 };
  
  const ratio = percent / 100;
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
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

function initializeDarkMode() {
  const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
  
  if (savedDarkMode !== null) {
    isDarkMode = savedDarkMode === 'true';
  } else {
    // If no saved preference, use system preference
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  applyDarkMode();
}

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
  applyDarkMode();
}

function applyDarkMode() {
  const html = document.documentElement;
  const desktopToggle = document.getElementById('darkModeToggleDesktop');
  const mobileToggle = document.getElementById('darkModeToggleMobile');
  
  if (isDarkMode) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  
  // Update button icons
  const icon = isDarkMode ? 'light_mode' : 'dark_mode';
  
  if (desktopToggle) {
    desktopToggle.querySelector('.material-symbols-outlined').textContent = icon;
  }
  
  if (mobileToggle) {
    mobileToggle.querySelector('.material-symbols-outlined').textContent = icon;
  }
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

// Reference lecturer list from HWR personnel database
const LECTURER_REFERENCE_LIST = [
  "Affeldt, Simone",
  "Afflerbach, Prof. Dr. Thomas",
  "Ahner, Christine",
  "Barten, Prof. Dr. Michael",
  "Becker, Prof. Dr. Kai Helge",
  "Beckert, Andrea",
  "Bergmann, Prof. Dr. Rainer",
  "Blase, Bernd",
  "Bleis, Prof. Dr. Christian",
  "Bloch, Anja",
  "Bories, Jonas",
  "Brakopp, Inga",
  "Bremer, Christian",
  "Brenninger, Klaus",
  "Burchert, Janna",
  "Burghardt, Dr. Frank",
  "Bustamante, Prof. Dr. Silke",
  "Cichos, Prof. Dr.-Ing. Sven",
  "Damm, Anke",
  "Deimer, Prof. Dr. Klaus",
  "de Queiroz Gama, Dr. Marco",
  "Detzel, Prof. Dr.-Ing. Annette",
  "Dieterle, Prof. Dr. Prof. h. c. (IKH Zasag University/Mongolia) Willi K. M.",
  "Dimitrov, Dr. Evgeni",
  "Druffel, Christina",
  "Eichele, Dr. Wolfgang",
  "Eisenhauer, Lena",
  "Elwardt, Dipl.-Ing. Johannes",
  "Erhardt, Peter",
  "Erkens, Prof. Dr. Elmar",
  "Eutebach, Volker",
  "Fabian, Marcel",
  "Fabian, Patrick",
  "Faden, Dr. Christoph",
  "Faustmann, Prof. Dr.-Ing. Gert",
  "Fechter, Prof. Dr. Charlotte",
  "Ferreira Furtado, Prof. Dr. Luis Fernando",
  "Findikci, Dr. habil. Aydin",
  "Fischer, Marc-Steven",
  "Fischer, Prof. Dr. Sebastian",
  "Fleck, Thomas",
  "Forberg, Dr. Torsten",
  "Forchert, Dipl.-Ing. Carl-Ernst",
  "Fürtjes, Dr. Heinz-Theo",
  "Goestl, Dr.-Ing. Herbert",
  "Grohmann, Prof. Dr. Björn",
  "Gruber-Beerfeltz, Iris",
  "Hackelberg, Prof. Dr. Florian",
  "Hagen-Franz, Antje",
  "Hannicke, Christian",
  "Hariskos, Dr. Wasilios",
  "Harloff, Annika",
  "Hartenstein, Sandro",
  "Herwig, Julian",
  "Hertwig, Dr. Jana",
  "Hasse, Dr. phil. Dieter",
  "Hedergott, Dr. Doreen",
  "Heerma, Tanja",
  "Hesse, Dr.-Ing. Raik",
  "Hesse, Prof. Dr. Martina",
  "Hilverkus, Achim",
  "Hoffmann, Kerstin",
  "Hoffmann, René",
  "Hofstetter, Prof. Helmut",
  "Huber, Christian",
  "Jalyschko, Marianna",
  "Jurgec, Diana",
  "Kadow, Christian",
  "Kalenberg, Prof. Dr. Frank",
  "Kalkbrenner, Prof. Dr. Gerrit",
  "Kaltschew, Dr. Kristian",
  "Kaplan, Demet",
  "Kasten, Prof. Dr. Tanja",
  "Keller, Dr.-Ing. Jürgen",
  "Khalid, Jasmin",
  "Knipp, Sigrun",
  "Knobloch, Prof. Dr. Ulrike",
  "Köhne, Prof. Dr. Thomas",
  "Kononenko, Nikolai",
  "Kothe, Robert",
  "Krawczack, Peter",
  "Kreß, Michaela",
  "Kreutzer, Diana",
  "Krüger, Stefan",
  "Kuckenburg, Dipl. Ing. Tomas",
  "Kurzawa, Prof. Dr.-Ing. Thorsten",
  "Latorre, Joana",
  "Launert, Janet-Jessica",
  "Leinemann, Prof. Dr. Ralf",
  "Lemke, Dr. Claudia",
  "Lemke, Prof. Dr. Claudia",
  "Levchenko, Nataliia",
  "Liesegang, Thomas",
  "Linnemann, Dr.-Ing. Maik",
  "Linz, Prof. Dr. Dorle",
  "List, Dr.-Ing. Michael",
  "Lück, Katrin",
  "Lüdeke, Henri",
  "Lundszien, Prof. Dr. Dietmar",
  "Magalashvili, Vladimir",
  "Meixner, RA Oliver",
  "Mertens, Prof. Dr. Antje",
  "Mirzaee, Behnam",
  "Monett Díaz, Alejandro",
  "Monett Díaz, Prof. Dr. Dagmar",
  "Mugele, Prof. Dr. –Ing. Jan",
  "Mulzer, Dipl.-Ing. Tasso",
  "Münchow, Katrin",
  "Nabialek, Prof. Dr. Jarosław",
  "Nastansky, Prof. Dr. Andreas",
  "Nauwald, Silvia",
  "Nowak, Olivia",
  "Ohilko, Daniil",
  "Paarz, Prof. Dr. Michael",
  "Pankau, Klaus",
  "Pätzoldt, Jeanette",
  "Pelzeter, Prof. Dr. Andrea",
  "Piasetzki, Adrian",
  "Pietschmann, Prof. Dr.-Ing. Peter",
  "Plotkin, Prof. Dr.-Ing. Prof. h.c. Juriy",
  "Pole, Peggy",
  "Radde, Prof. Dr. Jens",
  "Räder, Michael",
  "Radu, Oana",
  "Raethel, Prof. Dr. Jeannette",
  "Resch, Prof. Dr. Olaf",
  "Rigas, Prof. Dr. Niki",
  "Ringhand, Prof. Dr. Klaus",
  "Ritsch, Simon",
  "Rochnowski, Prof. Dr. Sandra",
  "Rohr, Andreas",
  "Rommel, Winfried",
  "Rosentreter, Prof. Dr. Gabriele",
  "Rothenburg, Lars",
  "Roxin, Prof. Dr. Jan",
  "Schebera, Dipl.oec. Mathias",
  "Scherwitzki, Sarah",
  "Schlesinger, Prof. Dr.-Ing. Sebastian",
  "Schlösser, Prof. Dr. Rico",
  "Schmeitzner, Prof. Dr.-Ing. Helmut",
  "Schmidt, Philipp",
  "Schmietendorf, Prof. Dr. Andreas",
  "Schnepf, Simone",
  "Schnieders, Dr. Ralf",
  "Schober, Kerstin",
  "Scholz, Daniel",
  "Scholz, Jessica",
  "Schomäcker, Prof. Dr.-Ing. Michael",
  "Schulz, Julia",
  "Schulz, Udo R.",
  "Schulz-Bücher, Ines",
  "Schwertfeger, Prof. Dr. Marko",
  "Schwichtenberg, Jörg",
  "Siewert, Heiko",
  "Siegert, Michael",
  "Simmons, Marvin",
  "Sooth, Christian Paul",
  "Sotriffer, Ingomar",
  "Specht, Dr. Mark",
  "Stammler-Gesiehn, Uwe",
  "Stampa, Karsten",
  "Staniek, Martin",
  "Stein, Alexandra",
  "Steinmann, Prof. Dr.-Ing. Alexander",
  "Sternberg, Serkan",
  "Stiegler, Prof. Dr. Sascha",
  "Tautz, Manuela",
  "Theuer, Patrick",
  "Thomas, Klaus",
  "Tiefensee, Prof. Dr. Anita",
  "Tippelhofer, Prof. Dr. Martina",
  "Tirpitz, Prof. Dr. Alexander",
  "Vogt, Florian",
  "Volkenandt, Dr. Götz",
  "von Gizycki, Prof. Dr. Vittoria",
  "von Saucken, Prof. Dr. Anna",
  "Voshage, Prof. Dr. Ramona",
  "Wache, Tatjana",
  "Wagner, Dr. Kerstin",
  "Wagner, Laura",
  "Walsdorf-Maul, Dipl.-Ing. Manuela",
  "Walz, Ute",
  "Wannemacher, Tobias",
  "Wenzel, Martina",
  "Wildebrand, Prof. Dr. Hendrik",
  "Wildner, Dr. Martin",
  "Wilhelm, Prof. Dr. Stefan",
  "Winter, Prof. Dr. Nicola",
  "Wittmann, Claudia",
  "Wittmüß, Antje",
  "Wolff, Lars",
  "Woogt, Prof. Dr. Sven",
  "Wotschke, Prof. Dr. Peter",
  "Yankova, Dipl. Med.-Inf. Aglika",
  "Yenoktaiev, Rostyslav",
  "Yollu-Tok, Prof. Dr. Aysel",
  "Zeytouni, Fereshteh",
  "Ziener, Peggy",
  "Zimmermann, Prof. Dr. Arthur",
  "Zimmermann, Roxana"
];

// Build a reference map from the lecturer list for quick lookup
function buildLecturerReferenceMap() {
  const referenceMap = new Map();
  
  LECTURER_REFERENCE_LIST.forEach(fullName => {
    const parsed = parseLecturerName(fullName);
    if (!parsed) return;
    
    const lastName = parsed.lastName.toLowerCase();
    
    if (!referenceMap.has(lastName)) {
      referenceMap.set(lastName, []);
    }
    
    referenceMap.get(lastName).push(parsed);
  });
  
  return referenceMap;
}

// Global reference map (built once at initialization)
let lecturerReferenceMap = null;

function getLecturerReferenceMap() {
  if (!lecturerReferenceMap) {
    lecturerReferenceMap = buildLecturerReferenceMap();
  }
  return lecturerReferenceMap;
}

function parseLecturerName(name) {
  if (!name) return null;
  
  const trimmed = name.trim();
  
  // Try to match pattern: "Nachname, Titel Vorname" or "Nachname, Titel Vorname Zusatz"
  // Examples: "Dimitrov, Dr. Evgeni", "Dieterle, Prof. Dr. Prof. h. c. (IKH Zasag University/Mongolia) Willi K. M."
  const commaMatch = trimmed.match(/^([^,]+),\s*(.+)$/);
  
  if (commaMatch) {
    let lastName = commaMatch[1].trim();
    const rest = commaMatch[2].trim();
    
    // Extract title from the rest (everything before the first name)
    // Titles typically start with: Dr., Prof., Prof. Dr., etc.
    const titleMatch = rest.match(/^((?:Prof\.?\s*)?(?:Dr\.?\s*)?(?:Prof\.?\s*)?(?:h\.?\s*c\.?\s*)?(?:\([^)]+\)\s*)*)/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract first name (everything after the title)
    const firstName = rest.replace(titleMatch ? titleMatch[0] : '', '').trim();
    
    return {
      lastName,
      title,
      firstName,
      original: trimmed
    };
  }
  
  // If no comma, try to parse as "Titel Vorname Nachname"
  // This is less common but might occur
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    // Handle German noble prefixes: von, zu, van, de, etc.
    // These should be part of the last name
    const noblePrefixes = ['von', 'zu', 'van', 'de', 'der', 'den', 'des'];
    let lastNameIndex = parts.length - 1;
    
    // Check if the last part is preceded by a noble prefix
    if (lastNameIndex > 0 && noblePrefixes.includes(parts[lastNameIndex - 1].toLowerCase())) {
      lastNameIndex = lastNameIndex - 1;
    }
    
    const lastName = parts.slice(lastNameIndex).join(' ');
    const titleAndFirstName = parts.slice(0, lastNameIndex).join(' ');
    
    // Try to extract title
    const titleMatch = titleAndFirstName.match(/^((?:Prof\.?\s*)?(?:Dr\.?\s*)?(?:Prof\.?\s*)?(?:h\.?\s*c\.?\s*)?(?:\([^)]+\)\s*)*)/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const firstName = titleAndFirstName.replace(titleMatch ? titleMatch[0] : '', '').trim();
    
    return {
      lastName,
      title,
      firstName,
      original: trimmed
    };
  }
  
  // Fallback: treat entire string as last name
  return {
    lastName: trimmed,
    title: '',
    firstName: '',
    original: trimmed
  };
}

function buildLecturerDatabase(events) {
  const lecturerMap = new Map();
  const referenceMap = getLecturerReferenceMap();
  
  events.forEach(event => {
    const teacherText = event.teacher || extractTeacherFromDescription(event.rawDescription || '');
    if (!teacherText) return;
    
    // Handle multiple teachers separated by comma
    const teachers = teacherText.split(',').map(t => t.trim()).filter(Boolean);
    
    teachers.forEach(teacher => {
      const parsed = parseLecturerName(teacher);
      if (!parsed) return;
      
      const lastName = parsed.lastName.toLowerCase();
      
      // Check if this lecturer exists in the reference list
      let referenceLecturers = referenceMap.get(lastName);
      let lecturerData = parsed;
      
      // If no exact match, try to find partial matches (e.g., "saucken" matches "von Saucken")
      if (!referenceLecturers || referenceLecturers.length === 0) {
        for (const [refLastName, refs] of referenceMap) {
          if (refLastName.includes(lastName) || lastName.includes(refLastName)) {
            referenceLecturers = refs;
            break;
          }
        }
      }
      
      if (referenceLecturers && referenceLecturers.length > 0) {
        // If there's only one lecturer with this last name in reference list,
        // use their data (including title and correct last name) without needing first name matching
        if (referenceLecturers.length === 1) {
          lecturerData = { ...referenceLecturers[0], original: parsed.original };
        } else if (parsed.firstName) {
          // Multiple lecturers with same last name - try to match by first name
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

function formatTeacherName(teacher, lecturerDb = null) {
  if (!teacher) return '';
  
  // If no lecturer database provided, use simple formatting
  if (!lecturerDb) {
    return teacher.split(',').map(t => t.trim()).filter(Boolean).join(', ');
  }
  
  // Check if the teacher string is in "Nachname, Titel Vorname" format (single lecturer)
  // If it contains a comma and the part after comma starts with a title, treat as single lecturer
  const commaMatch = teacher.match(/^([^,]+),\s*(.+)$/);
  if (commaMatch) {
    const afterComma = commaMatch[2].trim();
    const titleMatch = afterComma.match(/^(Prof\.?\s*|Dr\.?\s*)/i);
    if (titleMatch) {
      // Single lecturer in "Nachname, Titel Vorname" format
      const parsed = parseLecturerName(teacher);
      if (!parsed) return teacher;
      
      const lastName = parsed.lastName.toLowerCase();
      const lecturersWithSameLastName = lecturerDb.get(lastName);
      
      if (lecturersWithSameLastName && lecturersWithSameLastName.length > 0) {
        const lecturerData = lecturersWithSameLastName[0];
        if (lecturerData.title) {
          return `${lecturerData.title} ${lecturerData.lastName}`.trim();
        }
        return lecturerData.lastName;
      }
      
      if (parsed.title) {
        return `${parsed.title} ${parsed.lastName}`.trim();
      }
      return parsed.lastName;
    }
  }
  
  // Handle multiple teachers separated by comma
  const teachers = teacher.split(',').map(t => t.trim()).filter(Boolean);
  
  return teachers.map(t => {
    const parsed = parseLecturerName(t);
    if (!parsed) return t;
    
    const lastName = parsed.lastName.toLowerCase();
    const lecturersWithSameLastName = lecturerDb.get(lastName);
    
    // Use the lecturer data from the database (which includes the correct title from LECTURER_REFERENCE_LIST)
    if (lecturersWithSameLastName && lecturersWithSameLastName.length > 0) {
      // Use the first matching lecturer's data (which has the correct title)
      const lecturerData = lecturersWithSameLastName[0];
      
      // Always show title if we have one from the reference list (never show first name)
      if (lecturerData.title) {
        return `${lecturerData.title} ${lecturerData.lastName}`.trim();
      }
      
      // Return just last name (no title, no first name)
      return lecturerData.lastName;
    }
    
    // Fallback: use parsed data if not found in database (never show first name)
    if (parsed.title) {
      return `${parsed.title} ${parsed.lastName}`.trim();
    }
    
    return parsed.lastName;
  }).join(', ');
}

function extractTeacherFromDescription(rawDescription) {
  if (!rawDescription) return '';
  const match = rawDescription.match(/(?:Dozent|Dozentin)\s*:\s*([^\r\n]+)/i);
  if (!match || !match[1]) return '';
  const teacher = match[1].trim();
  return teacher === '-' ? '' : teacher;
}

function isLecturerInReferenceList(teacherName) {
  if (!teacherName) return false;
  
  const parsed = parseLecturerName(teacherName);
  if (!parsed) return false;
  
  const lastName = parsed.lastName.toLowerCase();
  const referenceMap = getLecturerReferenceMap();
  
  // Check for exact last name match
  if (referenceMap.has(lastName)) {
    const referenceLecturers = referenceMap.get(lastName);
    
    // If there's only one lecturer with this last name, it's a match
    if (referenceLecturers.length === 1) {
      return true;
    }
    
    // If multiple lecturers with same last name, try to match by first name
    if (parsed.firstName) {
      const match = referenceLecturers.find(ref => {
        const refFirstName = ref.firstName.toLowerCase();
        const parsedFirstName = parsed.firstName.toLowerCase();
        return refFirstName === parsedFirstName || 
               refFirstName.includes(parsedFirstName) || 
               parsedFirstName.includes(refFirstName);
      });
      if (match) return true;
    }
  }
  
  // Try partial matches (e.g., "saucken" matches "von Saucken")
  for (const [refLastName, refs] of referenceMap) {
    if (refLastName.includes(lastName) || lastName.includes(refLastName)) {
      return true;
    }
  }
  
  return false;
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
  let events = showAllEvents ? data.events : (selectedSource ? data.events.filter((event) => event.sourceId === selectedSource) : []);

  // Build lecturer database from all events to handle duplicate last names
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
  
  // Update date labels for both desktop and mobile
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
  
  const saturdayKey = getLocalDateKey(addDays(weekStart, 5));
  const hasSaturdayEvents = grouped[saturdayKey] && grouped[saturdayKey].length > 0;
  const weekDays = Array.from({ length: hasSaturdayEvents ? 6 : 5 }, (_, index) => addDays(weekStart, index));

  if (isMobile()) {
    renderMobileSchedule(grouped, weekDays, isInitialLoad, lecturerDb);
  } else {
    renderDesktopSchedule(grouped, weekDays, isInitialLoad, lecturerDb);
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
      
      // Check if lecturer is not in reference list and add warning icon
      // let warningIcon = '';
      // const isSpecialCase = teacherText && teacherText.toLowerCase() === 'pause';
      // if (teacherText && !isLecturerInReferenceList(teacherText) && !isSpecialCase) {
      //   warningIcon = `<div class="lecturer-warning-icon">
      //     <span class="material-symbols-outlined">warning</span>
      //     <div class="lecturer-warning-tooltip">Dieser Dozent wurde nicht auf der offiziellen Seite aller Dozenten des FB2 an der HWR gefunden. Sollten Sie Informationen über den Titel oder die E-Mail-Adresse des Dozenten haben, bitte senden Sie eine Mail an hwr.stundenplan.dev@gmail.com</div>
      //   </div>`;
      // }
      
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

  // Scroll to a lower position on initial load for desktop
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

  // Add weekend progress display if it's weekend, showProgressLabel is enabled, and no events today
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

      // Check if lecturer is not in reference list and add warning icon
      // let warningIcon = '';
      // const isSpecialCase = teacherText && teacherText.toLowerCase() === 'pause';
      // if (teacherText && !isLecturerInReferenceList(teacherText) && !isSpecialCase) {
      //   warningIcon = `<div class="lecturer-warning-icon">
      //     <span class="material-symbols-outlined">warning</span>
      //     <div class="lecturer-warning-tooltip">Dieser Dozent wurde nicht auf der offiziellen Seite aller Dozenten des FB2 an der HWR gefunden. Sollten Sie Informationen über den Titel oder die E-Mail-Adresse des Dozenten haben, bitte senden Sie eine Mail an hwr.stundenplan.dev@gmail.com</div>
      //   </div>`;
      // }

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
    console.log('Mobile render - day:', day, 'todayKey:', todayKey, 'isToday:', isToday, 'showProgressLabel:', showProgressLabel, 'isWeekend:', isWeekend);
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

  // Scroll to current day only on initial load
  if (isInitialLoad && !hasInitialScrollOccurred) {
    hasInitialScrollOccurred = true;
    setTimeout(scrollToCurrentDay, 100);
  }

  // Animate weekend progress if needed
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

  // Animate day progress if needed
  if (showProgressLabel && shouldAnimateProgress && (!isWeekend || hasEventsToday)) {
    setTimeout(() => {
      weekDays.forEach((day, index) => {
        const dayKey = getLocalDateKey(day);
        if (dayKey === todayKey) {
          const progressBar = document.querySelector(`.day-progress-bar-${index}`);
          const progressPercent = document.querySelector(`.day-progress-percent-${index}`);
          if (progressBar) {
            const eventsForDay = (grouped[dayKey] || []).slice().sort((a, b) => new Date(a.start) - new Date(b.start));
            let targetPercent = 0;
            
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
                  targetPercent = 0;
                } else if (currentHour > endHour) {
                  targetPercent = 100;
                } else {
                  targetPercent = ((currentHour - startHour) / (endHour - startHour)) * 100;
                }
              }
            }

            progressBar.style.transition = 'width 1500ms cubic-bezier(0.34, 1.56, 0.64, 1)';
            progressBar.style.width = `${targetPercent}%`;
            
            if (progressPercent) {
              let currentProgress = 0;
              const animationInterval = setInterval(() => {
                currentProgress += 2;
                if (currentProgress > targetPercent) currentProgress = targetPercent;
                updatePercentColor(progressPercent, currentProgress);
                if (currentProgress >= targetPercent) {
                  clearInterval(animationInterval);
                  progressPercent.textContent = `${Math.round(targetPercent)}%`;
                }
              }, 30);
              setTimeout(() => {
                progressPercent.textContent = `${Math.round(targetPercent)}%`;
              }, 1500);
            }
          }
        }
      });
    }, 100);
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

function generateICS(events, weekStart, data) {
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

  // Build lecturer database from all events
  const lecturerDb = data ? buildLecturerDatabase(data.events) : null;

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
    const teacher = formatTeacherName(teacherText, lecturerDb).replace(/,/g, '\\,');
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

  // Map to weekday ID (monday, tuesday, wednesday, thursday, friday, saturday)
  let targetDayId;
  const saturdaySection = document.getElementById('saturday');
  const hasSaturdayEvents = saturdaySection !== null;

  if (currentDayIndex === 0) {
    // Sunday: always go to Monday of next week
    targetDayId = 'monday';
  } else if (currentDayIndex === 6) {
    // Saturday: check if there are Saturday events
    if (hasSaturdayEvents) {
      targetDayId = 'saturday';
    } else {
      // No Saturday events: go to Monday of next week
      targetDayId = 'monday';
    }
  } else {
    // Weekday: map to ID
    const dayIds = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    targetDayId = dayIds[currentDayIndex];
  }

  const targetSection = document.getElementById(targetDayId);
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function getFavorites() {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.warn('Failed to load favorites:', error);
    return [];
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.warn('Failed to save favorites:', error);
  }
}

function getPendingDelete() {
  try {
    const pending = localStorage.getItem(PENDING_DELETE_KEY);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.warn('Failed to load pending delete:', error);
    return [];
  }
}

function savePendingDelete(pending) {
  try {
    localStorage.setItem(PENDING_DELETE_KEY, JSON.stringify(pending));
  } catch (error) {
    console.warn('Failed to save pending delete:', error);
  }
}

function addToPendingDelete(favoriteId) {
  const pending = getPendingDelete();
  if (!pending.includes(favoriteId)) {
    pending.push(favoriteId);
    savePendingDelete(pending);
  }
}

function removeFromPendingDelete(favoriteId) {
  const pending = getPendingDelete();
  const index = pending.indexOf(favoriteId);
  if (index > -1) {
    pending.splice(index, 1);
    savePendingDelete(pending);
  }
}

function isPendingDelete(favoriteId) {
  const pending = getPendingDelete();
  return pending.includes(favoriteId);
}

function processPendingDelete(data) {
  const pending = getPendingDelete();
  if (pending.length === 0) return;

  const favorites = getFavorites();
  const updatedFavorites = favorites.filter(f => !pending.includes(f.id));
  saveFavorites(updatedFavorites);
  savePendingDelete([]);

  // Re-render favorites list
  renderFavoritesList(data);

  // Update button states
  const currentFavoriteLabelDesktop = document.getElementById('currentFavoriteLabelDesktop');
  const addToFavoritesDesktopPanel = document.getElementById('addToFavoritesDesktopPanel');
  const currentFavoriteLabelMobile = document.getElementById('currentFavoriteLabelMobile');
  const addToFavoritesMobilePanel = document.getElementById('addToFavoritesMobilePanel');

  if (currentFavoriteLabelDesktop && addToFavoritesDesktopPanel) {
    const semesterSelect = document.getElementById('semesterSelect');
    const facultySelect = document.getElementById('facultySelect');
    const courseSelect = document.getElementById('courseSelect');
    updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
  }

  if (currentFavoriteLabelMobile && addToFavoritesMobilePanel) {
    const semesterSelectMobile = document.getElementById('semesterSelectMobile');
    const facultySelectMobile = document.getElementById('facultySelectMobile');
    const courseSelectMobile = document.getElementById('courseSelectMobile');
    updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
  }
}

function generateFavoriteAbbreviation(semester, faculty, courseTitle) {
  const semNum = semester.replace('semester', '');
  const courseLetter = courseTitle.trim().slice(-1).toUpperCase();
  return `S${semNum} ${faculty} ${courseLetter}`;
}

function updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, labelElement, addButton) {
  if (!labelElement || !semesterSelect || !facultySelect || !courseSelect) return;

  const semester = semesterSelect.value;
  const faculty = facultySelect.value;
  const courseId = courseSelect.value;

  if (!semester || !faculty || !courseId) {
    labelElement.textContent = '';
    if (addButton) addButton.disabled = true;
    return;
  }

  const course = data.schedules.find(s => s.id === courseId);
  if (!course) {
    labelElement.textContent = '';
    if (addButton) addButton.disabled = true;
    return;
  }

  const abbreviation = generateFavoriteAbbreviation(semester, faculty, course.title);
  labelElement.textContent = abbreviation;

  // Check if this course is already in favorites
  const favorites = getFavorites();
  const isAlreadyFavorite = favorites.some(f =>
    f.semester === semester &&
    f.faculty === faculty &&
    f.courseId === courseId
  );

  if (addButton) {
    addButton.disabled = isAlreadyFavorite;
    if (isAlreadyFavorite) {
      addButton.textContent = 'Hinzugefügt';
      addButton.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      addButton.textContent = 'Hinzufügen';
      addButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }
}

function addCurrentToFavorites(data, semesterSelect, facultySelect, courseSelect) {
  const semester = semesterSelect ? semesterSelect.value : '';
  const faculty = facultySelect ? facultySelect.value : '';
  const courseId = courseSelect ? courseSelect.value : '';

  if (!semester || !faculty || !courseId) {
    alert('Bitte wähle zuerst einen Stundenplan aus.');
    return;
  }

  const course = data.schedules.find(s => s.id === courseId);
  if (!course) return;

  const favorites = getFavorites();

  // Check if this course is already in favorites
  const existingFavorite = favorites.find(f =>
    f.semester === semester &&
    f.faculty === faculty &&
    f.courseId === courseId
  );

  if (existingFavorite) {
    // Remove from favorites
    const filtered = favorites.filter(f => f.id !== existingFavorite.id);
    saveFavorites(filtered);
    renderFavoritesList(data);

    // Update button states
    const currentFavoriteLabelDesktop = document.getElementById('currentFavoriteLabelDesktop');
    const addToFavoritesDesktopPanel = document.getElementById('addToFavoritesDesktopPanel');
    const currentFavoriteLabelMobile = document.getElementById('currentFavoriteLabelMobile');
    const addToFavoritesMobilePanel = document.getElementById('addToFavoritesMobilePanel');

    if (currentFavoriteLabelDesktop && addToFavoritesDesktopPanel) {
      updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
    }

    if (currentFavoriteLabelMobile && addToFavoritesMobilePanel) {
      updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
    }

    return;
  }

  // Add to favorites
  const abbreviation = generateFavoriteAbbreviation(semester, faculty, course.title);

  const newFavorite = {
    id: Date.now().toString(),
    semester,
    faculty,
    courseId,
    courseTitle: course.title,
    abbreviation,
    createdAt: new Date().toISOString()
  };

  favorites.push(newFavorite);
  saveFavorites(favorites);
  renderFavoritesList(data);

  // Update button states
  const currentFavoriteLabelDesktop = document.getElementById('currentFavoriteLabelDesktop');
  const addToFavoritesDesktopPanel = document.getElementById('addToFavoritesDesktopPanel');
  const currentFavoriteLabelMobile = document.getElementById('currentFavoriteLabelMobile');
  const addToFavoritesMobilePanel = document.getElementById('addToFavoritesMobilePanel');

  if (currentFavoriteLabelDesktop && addToFavoritesDesktopPanel) {
    updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
  }

  if (currentFavoriteLabelMobile && addToFavoritesMobilePanel) {
    updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
  }
}

function deleteFavorite(favoriteId, data) {
  const favorites = getFavorites();
  const filtered = favorites.filter(f => f.id !== favoriteId);
  saveFavorites(filtered);
  renderFavoritesList(data);
}

function logUpcomingEvents(semester, faculty, data) {
  if (!data || !data.events || !semester || !faculty) {
    console.log('[Upcoming Events] Missing required data');
    return;
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const twoYearsLater = new Date(now.getTime() + (2 * 365 * 24 * 60 * 60 * 1000));

  // Filter events for selected semester and faculty
  const upcomingEvents = data.events
    .filter(event => {
      if (!event.start || !event.sourceSemester || !event.sourceFaculty) return false;
      const eventDate = new Date(event.start);
      const matchesSemester = event.sourceSemester === semester;
      const matchesFaculty = event.sourceFaculty === faculty;
      const isInRange = eventDate >= sixMonthsAgo && eventDate <= twoYearsLater;
      return matchesSemester && matchesFaculty && isInRange;
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 10); // Show max 10 upcoming events

  console.log(`\n=== Nächste anstehende Events für ${semester} - ${faculty} ===`);
  if (upcomingEvents.length === 0) {
    console.log('Keine anstehenden Events gefunden.');
  } else {
    upcomingEvents.forEach((event, index) => {
      const eventDate = new Date(event.start);
      const formattedDate = eventDate.toLocaleDateString('de-DE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const formattedTime = eventDate.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      console.log(`${index + 1}. ${formattedDate} um ${formattedTime}: ${event.title}`);
      console.log(`   Ort: ${event.location || 'N/A'}`);
      console.log(`   Typ: ${event.type || 'N/A'}`);
      console.log('');
    });
  }
  console.log('================================================\n');
}

function hasFacultyEventsInTimeRange(faculty, semester, data) {
  if (!data || !data.events || !data.schedules) {
    console.log('[Filter] Missing data:', { hasData: !!data, hasEvents: !!data?.events, hasSchedules: !!data?.schedules });
    return false;
  }
  
  // Calculate time range: 6 months before today to 2 years in the future (for dual study programs)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const twoYearsLater = new Date(now.getTime() + (2 * 365 * 24 * 60 * 60 * 1000));
  
  // Only consider events from 2020 onwards (ignore old data from 2013)
  const year2020 = new Date('2020-01-01T00:00:00.000Z');
  
  console.log(`[Filter] Checking faculty ${faculty}, semester ${semester}, time range: ${sixMonthsAgo.toISOString()} to ${twoYearsLater.toISOString()} (only events from 2020+)`);
  
  // Find all schedules for this faculty and semester
  const relevantSchedules = data.schedules.filter(
    schedule => schedule.semester === semester && schedule.faculty === faculty
  );
  
  console.log(`[Filter] Found ${relevantSchedules.length} schedules for ${faculty} semester ${semester}`);
  
  if (relevantSchedules.length === 0) return false;
  
  // Get all schedule IDs for this faculty
  const scheduleIds = new Set(relevantSchedules.map(s => s.id));
  console.log(`[Filter] Schedule IDs:`, Array.from(scheduleIds));
  
  // Check if any event for these schedules is in the time range and from 2020 onwards
  let matchingEvents = 0;
  const hasEventInRange = data.events.some(event => {
    if (!event.start) return false;
    if (!scheduleIds.has(event.sourceId)) return false;
    
    const eventDate = new Date(event.start);
    const isFrom2020 = eventDate >= year2020;
    const isInRange = isFrom2020 && eventDate >= sixMonthsAgo && eventDate <= twoYearsLater;
    
    if (isInRange) {
      matchingEvents++;
      console.log(`[Filter] Matching event: ${event.title} at ${eventDate.toISOString()}`);
    }
    
    return isInRange;
  });
  
  console.log(`[Filter] Found ${matchingEvents} matching events for ${faculty} semester ${semester}`);
  return hasEventInRange;
}

function populateFaculties(semesterSelect, facultySelect, data) {
  if (!semesterSelect || !facultySelect || !data) return;
  const sem = semesterSelect.value;
  console.log('populateFaculties called with semester:', sem);
  const schedules = data.schedules || [];
  const faculties = Array.from(new Set(schedules.filter((schedule) => schedule.semester === sem).map((schedule) => schedule.faculty).filter(Boolean)));
  
  // Filter faculties based on events in time range
  const filteredFaculties = faculties.filter(faculty => {
    const hasEvents = hasFacultyEventsInTimeRange(faculty, sem, data);
    console.log(`[Filter] Faculty ${faculty} has events in time range:`, hasEvents);
    return hasEvents;
  });
  
  // Map faculties to study programs and sort alphabetically by full name
  const sortedFaculties = filteredFaculties.map(faculty => {
    const lowerFaculty = faculty.toLowerCase();
    // Find matching study program by abbreviation
    const matchedKey = Object.keys(STUDY_PROGRAMS).find(key => key.toLowerCase() === lowerFaculty);
    if (matchedKey) {
      return {
        value: faculty,
        abbreviation: matchedKey,
        fullName: STUDY_PROGRAMS[matchedKey]
      };
    }
    // Fallback for unknown faculties
    return {
      value: faculty,
      abbreviation: null,
      fullName: faculty
    };
  }).sort((a, b) => a.fullName.localeCompare(b.fullName, 'de-DE'));
  
  console.log('Sorted faculties:', sortedFaculties);
  
  // Generate options with full name only (abbreviation used only for responsive fallback)
  facultySelect.innerHTML = sortedFaculties.length 
    ? sortedFaculties.map(f => `<option value="${f.value}" data-abbreviation="${f.abbreviation || ''}" data-fullname="${f.fullName}">${f.fullName}</option>`).join('')
    : '<option value="">Keine Fachrichtung verfügbar</option>';
  console.log('Faculty select innerHTML set');
}

function populateCourses(courseSelect, semesterSelect, facultySelect, data) {
  if (!courseSelect || !data) return;
  const sem = semesterSelect ? semesterSelect.value : '';
  const fac = facultySelect ? facultySelect.value : '';
  console.log('populateCourses called with semester:', sem, 'faculty:', fac);
  const schedules = data.schedules || [];
  const courses = schedules.filter((schedule) => schedule.semester === sem && schedule.faculty === fac);
  console.log('Courses found:', courses.map(c => c.id));
  courseSelect.innerHTML = courses.length ? courses.map((course) => `<option value="${course.id}">${formatCourseLabel(course.title)}</option>`).join('') : '<option value="">Kein Kurs verfügbar</option>';
  console.log('Course select innerHTML set');
}

function loadFavorite(favorite, data, currentWeekStart, searchQuery) {
  console.log('loadFavorite called with:', favorite);
  
  const isMobileView = isMobile();
  const semesterSelect = isMobileView 
    ? document.getElementById('semesterSelectMobile') 
    : document.getElementById('semesterSelect');
  const facultySelect = isMobileView 
    ? document.getElementById('facultySelectMobile') 
    : document.getElementById('facultySelect');
  const courseSelect = isMobileView 
    ? document.getElementById('courseSelectMobile') 
    : document.getElementById('courseSelect');
  
  console.log('Select elements found:', { semesterSelect: !!semesterSelect, facultySelect: !!facultySelect, courseSelect: !!courseSelect });
  
  if (!semesterSelect || !facultySelect || !courseSelect) {
    console.error('Missing select elements in loadFavorite');
    return favorite.courseId;
  }

  console.log('Setting semester to:', favorite.semester);
  // Set semester
  semesterSelect.value = favorite.semester;
  console.log('Semester set to:', semesterSelect.value);
  
  console.log('Populating faculties...');
  // Populate and set faculty
  populateFaculties(semesterSelect, facultySelect, data);
  
  // Use requestAnimationFrame to ensure DOM is updated before setting value
  requestAnimationFrame(() => {
    console.log('Setting faculty to:', favorite.faculty);
    facultySelect.value = favorite.faculty;
    console.log('Faculty set to:', facultySelect.value);
    
    console.log('Populating courses...');
    // Populate and set course
    populateCourses(courseSelect, semesterSelect, facultySelect, data);
    
    // Use another requestAnimationFrame to ensure DOM is updated before setting value
    requestAnimationFrame(() => {
      console.log('Setting course to:', favorite.courseId);
      courseSelect.value = favorite.courseId;
      console.log('Course set to:', courseSelect.value);

      // Set to current week (same logic as "Heute" button)
      const now = new Date();
      const currentDayIndex = now.getDay();
      let newWeekStart = getMonday(now);
      console.log('Setting week to current week:', newWeekStart);

      saveSelection();
      renderSchedule(data, favorite.courseId, newWeekStart, searchQuery, false);

      // Check if we need to switch to next week (after rendering to check for Saturday events)
      setTimeout(() => {
        const saturdaySection = document.getElementById('saturday');
        const hasSaturdayEvents = saturdaySection !== null;
        
        if (currentDayIndex === 0) {
          // Sunday: always go to next week
          newWeekStart = addDays(newWeekStart, 7);
          renderSchedule(data, favorite.courseId, newWeekStart, searchQuery, false);
        } else if (currentDayIndex === 6 && !hasSaturdayEvents) {
          // Saturday without events: go to next week
          newWeekStart = addDays(newWeekStart, 7);
          renderSchedule(data, favorite.courseId, newWeekStart, searchQuery, false);
        }
        
        // Scroll to current day on mobile
        if (isMobileView) {
          scrollToCurrentDay();
        }
      }, 100);
    });
  });
  
  return favorite.courseId;
}

function renderFavoritesList(data) {
  const favoritesListDesktopPanel = document.getElementById('favoritesListDesktopPanel');
  const favoritesListMobilePanel = document.getElementById('favoritesListMobilePanel');
  const favorites = getFavorites();
  const pendingDelete = getPendingDelete();

  const renderList = (container) => {
    if (!container) return;

    if (favorites.length === 0) {
      const textClass = container.id.includes('Mobile') || container.id.includes('mobile') ? 'text-gray-500' : 'text-slate-500';
      container.innerHTML = `<p class="text-sm ${textClass} text-center py-2 w-full">Keine Favoriten gespeichert</p>`;
      return;
    }

    container.innerHTML = favorites.map(fav => {
      const isPending = pendingDelete.includes(fav.id);
      const starClass = isPending ? 'text-gray-400' : 'text-yellow-500';
      const starFill = isPending ? '' : 'font-variation-settings: \'FILL\' 1;';

      return `
      <div class="favorite-item" data-favorite-id="${fav.id}">
        <span class="favorite-item-name">${fav.abbreviation}</span>
        <button class="favorite-item-delete" data-delete-id="${fav.id}" type="button">
          <span class="material-symbols-outlined ${starClass}" style="${starFill}">star</span>
        </button>
      </div>
    `;
    }).join('');
  };

  renderList(favoritesListDesktopPanel);
  renderList(favoritesListMobilePanel);
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
    const prevButtonBottom = document.getElementById('prevWeekBottom');
    const nextButtonBottom = document.getElementById('nextWeekBottom');
    const resetButton = document.getElementById('resetCache');
    const exportButton = document.getElementById('exportCalendar');
    const showAllEventsButton = document.getElementById('showAllEvents');
    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearch');
    const toggleButton = document.getElementById('toggleFilterButton');
    const toggleProgressButton = document.getElementById('toggleProgressLabel');
    const favoritesButton = document.getElementById('favoritesButton');
    const addToFavoritesButton = document.getElementById('addToFavorites');
    const currentFavoriteLabelDesktop = document.getElementById('currentFavoriteLabelDesktop');
    const addToFavoritesDesktopPanel = document.getElementById('addToFavoritesDesktopPanel');

    // Mobile controls
    const semesterSelectMobile = document.getElementById('semesterSelectMobile');
    const facultySelectMobile = document.getElementById('facultySelectMobile');
    const courseSelectMobile = document.getElementById('courseSelectMobile');
    const prevButtonMobile = document.getElementById('prevWeekMobile');
    const nextButtonMobile = document.getElementById('nextWeekMobile');
    const prevButtonMobileBottom = document.getElementById('prevWeekMobileBottom');
    const nextButtonMobileBottom = document.getElementById('nextWeekMobileBottom');
    const resetButtonMobile = document.getElementById('resetCacheMobile');
    const showAllEventsButtonMobile = document.getElementById('showAllEventsMobile');
    const currentWeekButton = document.getElementById('currentWeek');
    const searchInputMobile = document.getElementById('searchInputMobile');
    const clearSearchButtonMobile = document.getElementById('clearSearchMobile');
    const toggleButtonMobile = document.getElementById('toggleFilterButtonMobile');
    const toggleProgressButtonMobile = document.getElementById('toggleProgressLabelMobile');
    const favoritesButtonMobile = document.getElementById('favoritesButtonMobile');
    const addToFavoritesButtonMobile = document.getElementById('addToFavoritesMobile');
    const currentFavoriteLabelMobile = document.getElementById('currentFavoriteLabelMobile');
    const addToFavoritesMobilePanel = document.getElementById('addToFavoritesMobilePanel');

    const cacheKey = 'st-plan-selection-v1';
    const schedules = data.schedules || [];
    const maxSemester = data.maxSemester || 1;
    let currentWeekStart = getMonday(new Date());
    let activeSource = null;
    let searchQuery = '';

    // Load showAllEvents preference from localStorage
    showAllEvents = localStorage.getItem(SHOW_ALL_EVENTS_KEY) === 'true';

    // Initialize button visual state
    if (showAllEvents) {
      if (showAllEventsButton) showAllEventsButton.classList.add('progress-active');
      if (showAllEventsButtonMobile) showAllEventsButtonMobile.classList.add('progress-active');
    }

    const semesterOptions = Array.from({ length: maxSemester }, (_, index) => `semester${index + 1}`);
    
    // Populate desktop selects
    if (semesterSelect) {
      semesterSelect.innerHTML = semesterOptions.map((semester, index) => `<option value="${semester}">Semester ${index + 1}</option>`).join('');
    }
    
    // Populate mobile selects
    if (semesterSelectMobile) {
      semesterSelectMobile.innerHTML = semesterOptions.map((semester, index) => `<option value="${semester}">Semester ${index + 1}</option>`).join('');
    }
    
    // Populate faculty and course selects BEFORE initializing dropdowns
    if (semesterSelect) populateFaculties(semesterSelect, facultySelect, data);
    if (semesterSelectMobile) populateFaculties(semesterSelectMobile, facultySelectMobile, data);
    
    if (courseSelect) populateCourses(courseSelect, semesterSelect, facultySelect, data);
    if (courseSelectMobile) populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile, data);
    
    // Initialize Schanzen dropdowns AFTER populating selects

    // Initialize Schanzen dropdowns - simplified version
    function initializeSchanzenDropdown(dropdownId, selectId, optionsId) {
      const dropdown = document.querySelector(`[data-dropdown="${dropdownId}"]`);
      const select = document.getElementById(selectId);
      const optionsContainer = document.getElementById(optionsId);
      const container = dropdown?.querySelector('.schanzen-dropdown-container');
      const valueDisplay = dropdown?.querySelector('.schanzen-dropdown-value');
      const dropdownMenu = dropdown?.querySelector('.schanzen-dropdown-menu');

      if (!dropdown || !select || !optionsContainer || !container || !valueDisplay || !dropdownMenu) {
        console.warn('[Dropdown] Missing elements for:', dropdownId);
        return;
      }

      // Check if this is a faculty dropdown (study programs)
      const isFacultyDropdown = dropdownId.includes('faculty');

      // Update options when select changes
      function updateOptions() {
        const options = Array.from(select.options).map(opt => ({
          value: opt.value,
          text: opt.textContent,
          abbreviation: opt.dataset.abbreviation || '',
          fullName: opt.dataset.fullname || opt.textContent,
          selected: opt.selected
        }));

        optionsContainer.innerHTML = options.map(opt => {
          if (isFacultyDropdown && opt.abbreviation && opt.fullName && opt.abbreviation !== opt.fullName) {
            // Study program option with full name by default, abbreviation + info icon on small screens
            // Add line break for "Dienstleistungsmanagement" in tooltip
            const tooltipName = opt.fullName === 'Dienstleistungsmanagement' ? 'Dienstleistungs-<br>management' : opt.fullName;
            return `
              <button class="schanzen-dropdown-option ${opt.selected ? 'selected' : ''}" data-value="${opt.value}">
                <span class="study-program-full">${opt.fullName}</span>
                <span class="study-program-abbreviated">${opt.abbreviation}</span>
                <span class="study-program-info-icon">
                  <span class="material-symbols-outlined">info</span>
                  <span class="study-program-tooltip">${tooltipName}</span>
                </span>
              </button>
            `;
          } else {
            // Regular option (no abbreviation)
            return `
              <button class="schanzen-dropdown-option ${opt.selected ? 'selected' : ''}" data-value="${opt.value}">
                ${opt.text}
              </button>
            `;
          }
        }).join('');

        // Update display value
        const selectedOption = select.options[select.selectedIndex];
        valueDisplay.textContent = selectedOption ? selectedOption.textContent : 'Bitte wählen...';
      }

      // Toggle dropdown
      function toggleDropdown(e) {
        e.preventDefault();
        console.log('[Dropdown] Toggle clicked, dropdownId:', dropdownId);
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        console.log('[Dropdown] Current isOpen state:', isOpen);

        // On mobile, close all other dropdowns before opening this one
        const isMobile = window.innerWidth <= 768 || dropdownId.includes('-mobile');
        if (isMobile) {
          document.querySelectorAll('.schanzen-dropdown.open').forEach(d => {
            if (d !== dropdown) {
              d.classList.remove('open');
              const otherMenu = d.querySelector('.schanzen-dropdown-menu');
              if (otherMenu) {
                otherMenu.style.display = 'none';
                otherMenu.style.opacity = '0';
                otherMenu.style.pointerEvents = 'none';
              }
            }
          });
        }

        if (isOpen) {
          dropdown.classList.remove('open');
          if (dropdownMenu) {
            dropdownMenu.style.display = 'none';
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.pointerEvents = 'none';
          }
          console.log('[Dropdown] Closed dropdown');
        } else {
          dropdown.classList.add('open');
          if (dropdownMenu) {
            dropdownMenu.style.display = 'block';
            dropdownMenu.style.opacity = '1';
            dropdownMenu.style.pointerEvents = 'auto';
            dropdownMenu.style.overflow = 'visible';
            dropdownMenu.style.maxHeight = 'none';
          }
          if (optionsContainer) {
            optionsContainer.style.overflow = 'visible';
            optionsContainer.style.maxHeight = 'none';
          }
          console.log('[Dropdown] Opened dropdown, classes:', dropdown.className);

          // Check for overflow after dropdown is opened (elements are now visible)
          if (isFacultyDropdown) {
            setTimeout(() => {
              console.log('[Study Program] Checking overflow after dropdown opened');
              const studyProgramOptions = optionsContainer.querySelectorAll('.schanzen-dropdown-option');
              studyProgramOptions.forEach(option => {
                const fullNameSpan = option.querySelector('.study-program-full');
                if (fullNameSpan) {
                  const scrollWidth = fullNameSpan.scrollWidth;
                  const clientWidth = fullNameSpan.clientWidth;
                  console.log('[Study Program] Option:', fullNameSpan.textContent, 'scrollWidth:', scrollWidth, 'clientWidth:', clientWidth);
                  if (scrollWidth > clientWidth) {
                    option.classList.add('too-narrow');
                    console.log('[Study Program] Added too-narrow class to:', fullNameSpan.textContent);
                  } else {
                    option.classList.remove('too-narrow');
                  }
                }
              });

              // Setup tooltip positioning for info icons
              const infoIcons = optionsContainer.querySelectorAll('.study-program-info-icon');
              infoIcons.forEach(icon => {
                icon.addEventListener('mouseenter', () => {
                  const tooltip = icon.querySelector('.study-program-tooltip');
                  if (!tooltip) return;

                  const iconRect = icon.getBoundingClientRect();
                  const tooltipRect = tooltip.getBoundingClientRect();
                  const spaceAbove = iconRect.top;
                  const spaceBelow = window.innerHeight - iconRect.bottom;

                  // If not enough space above, position below
                  if (spaceAbove < tooltipRect.height + 20) {
                    tooltip.classList.add('tooltip-below');
                  } else {
                    tooltip.classList.remove('tooltip-below');
                  }
                });
              });
            }, 50);
          }
        }
      }

      // Handle option selection
      function handleOptionClick(e) {
        const optionBtn = e.target.closest('.schanzen-dropdown-option');
        if (!optionBtn) return;

        e.stopPropagation();
        const value = optionBtn.dataset.value;
        select.value = value;

        // Update selected state
        optionsContainer.querySelectorAll('.schanzen-dropdown-option').forEach(btn => {
          btn.classList.remove('selected');
        });
        optionBtn.classList.add('selected');

        // Update display
        valueDisplay.textContent = optionBtn.textContent;

        // Close dropdown
        dropdown.classList.remove('open');
        if (dropdownMenu) {
          dropdownMenu.style.display = 'none';
          dropdownMenu.style.opacity = '0';
          dropdownMenu.style.pointerEvents = 'none';
        }

        // Trigger change event on select
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Close dropdown when clicking outside
      function handleOutsideClick(e) {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
          if (dropdownMenu) {
            dropdownMenu.style.display = 'none';
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.pointerEvents = 'none';
          }
        }
      }

      // Set up event listeners (only once)
      if (!container.hasAttribute('data-dropdown-initialized')) {
        container.setAttribute('data-dropdown-initialized', 'true');
        dropdown.addEventListener('click', toggleDropdown);
        optionsContainer.addEventListener('click', handleOptionClick);
        document.addEventListener('click', handleOutsideClick);
      }

      // Initial population
      updateOptions();

      // Listen for select changes to update options
      select.addEventListener('change', updateOptions);

      // Return update function for external use
      return updateOptions;
    }

    // Initialize desktop Schanzen dropdowns
    const updateSemesterDropdown = initializeSchanzenDropdown('semester', 'semesterSelect', 'semesterOptions');
    const updateFacultyDropdown = initializeSchanzenDropdown('faculty', 'facultySelect', 'facultyOptions');
    const updateCourseDropdown = initializeSchanzenDropdown('course', 'courseSelect', 'courseOptions');

    // Initialize mobile Schanzen dropdowns
    const updateSemesterDropdownMobile = initializeSchanzenDropdown('semester-mobile', 'semesterSelectMobile', 'semesterOptionsMobile');
    const updateFacultyDropdownMobile = initializeSchanzenDropdown('faculty-mobile', 'facultySelectMobile', 'facultyOptionsMobile');
    const updateCourseDropdownMobile = initializeSchanzenDropdown('course-mobile', 'courseSelectMobile', 'courseOptionsMobile');

    // Handle window resize to recheck overflow for study programs
    let studyProgramResizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(studyProgramResizeTimeout);
      studyProgramResizeTimeout = setTimeout(() => {
        const allFacultyDropdowns = document.querySelectorAll('.schanzen-dropdown[data-dropdown="faculty"], .schanzen-dropdown[data-dropdown="faculty-mobile"]');
        allFacultyDropdowns.forEach(dropdown => {
          const optionsContainer = dropdown.querySelector('.schanzen-dropdown-options');
          if (optionsContainer) {
            const studyProgramOptions = optionsContainer.querySelectorAll('.schanzen-dropdown-option');
            studyProgramOptions.forEach(option => {
              const fullNameSpan = option.querySelector('.study-program-full');
              if (fullNameSpan) {
                if (fullNameSpan.scrollWidth > fullNameSpan.clientWidth) {
                  option.classList.add('too-narrow');
                } else {
                  option.classList.remove('too-narrow');
                }
              }
            });
          }
        });
      }, 100);
    });

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

    function updateConfigFromActiveSource(activeSource, data) {
      if (!activeSource || !data || !data.schedules) return;

      const schedule = data.schedules.find(s => s.id === activeSource);
      if (!schedule) return;

      const { semester, faculty, course } = schedule;

      // Update desktop selects without triggering change events
      if (semesterSelect && semesterSelect.value !== semester) {
        semesterSelect.value = semester;
        populateFaculties(semesterSelect, facultySelect, data);
      }
      if (facultySelect && facultySelect.value !== faculty) {
        facultySelect.value = faculty;
        populateCourses(courseSelect, semesterSelect, facultySelect, data);
      }
      if (courseSelect && courseSelect.value !== activeSource) {
        courseSelect.value = activeSource;
      }

      // Update mobile selects without triggering change events
      if (semesterSelectMobile && semesterSelectMobile.value !== semester) {
        semesterSelectMobile.value = semester;
        populateFaculties(semesterSelectMobile, facultySelectMobile, data);
      }
      if (facultySelectMobile && facultySelectMobile.value !== faculty) {
        facultySelectMobile.value = faculty;
        populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile, data);
      }
      if (courseSelectMobile && courseSelectMobile.value !== activeSource) {
        courseSelectMobile.value = activeSource;
      }

      // Update dropdowns
      setTimeout(() => {
        if (updateFacultyDropdown) updateFacultyDropdown();
        if (updateFacultyDropdownMobile) updateFacultyDropdownMobile();
        if (updateCourseDropdown) updateCourseDropdown();
        if (updateCourseDropdownMobile) updateCourseDropdownMobile();
      }, 100);

      // Save the selection to cookies/localStorage
      saveSelection();
    }

    // Desktop event listeners
    if (semesterSelect) {
      semesterSelect.addEventListener('change', () => {
        populateFaculties(semesterSelect, facultySelect, data);
        populateCourses(courseSelect, semesterSelect, facultySelect, data);
        syncSelects(semesterSelect, semesterSelectMobile);
        syncSelects(facultySelect, facultySelectMobile);
        syncSelects(courseSelect, courseSelectMobile);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
        
        // Log upcoming events when semester changes
        if (facultySelect.value) {
          logUpcomingEvents(semesterSelect.value, facultySelect.value, data);
        }
      });
    }

    if (facultySelect) {
      facultySelect.addEventListener('change', () => {
        // Store current course letter before repopulating
        const currentCourseId = courseSelect.value;
        const currentCourseLetter = currentCourseId.slice(-1); // Get last character (e.g., 'a', 'b', 'c')
        
        populateCourses(courseSelect, semesterSelect, facultySelect, data);
        updateCourseDropdown();
        
        // Try to select the same course letter in the new faculty
        const matchingCourse = Array.from(courseSelect.options).find(opt => opt.value && opt.value.slice(-1) === currentCourseLetter);
        if (matchingCourse) {
          courseSelect.value = matchingCourse.value;
          activeSource = matchingCourse.value;
          updateCourseDropdown(); // Update desktop display
          updateCourseDropdownMobile(); // Update mobile display
        }
        
        syncSelects(facultySelect, facultySelectMobile);
        syncSelects(courseSelect, courseSelectMobile);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (courseSelect) {
      courseSelect.addEventListener('change', () => {
        activeSource = courseSelect.value;
        syncSelects(courseSelect, courseSelectMobile);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
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

    if (prevButtonBottom) {
      prevButtonBottom.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (nextButtonBottom) {
      nextButtonBottom.addEventListener('click', () => {
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
        const icsContent = generateICS(events, currentWeekStart, data);
        const filename = `hwr-stundenplan-${formatDateShort(currentWeekStart)}.ics`;
        downloadICS(icsContent, filename);
      });
    }



    if (showAllEventsButton) {
      showAllEventsButton.addEventListener('click', () => {
        showAllEvents = !showAllEvents;
        localStorage.setItem(SHOW_ALL_EVENTS_KEY, String(showAllEvents));
        if (showAllEvents) {
          showAllEventsButton.classList.add('progress-active');
          if (showAllEventsButtonMobile) showAllEventsButtonMobile.classList.add('progress-active');
        } else {
          showAllEventsButton.classList.remove('progress-active');
          if (showAllEventsButtonMobile) showAllEventsButtonMobile.classList.remove('progress-active');
        }
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (showAllEventsButtonMobile) {
      showAllEventsButtonMobile.addEventListener('click', () => {
        showAllEvents = !showAllEvents;
        localStorage.setItem(SHOW_ALL_EVENTS_KEY, String(showAllEvents));
        if (showAllEvents) {
          showAllEventsButtonMobile.classList.add('progress-active');
          if (showAllEventsButton) showAllEventsButton.classList.add('progress-active');
        } else {
          showAllEventsButtonMobile.classList.remove('progress-active');
          if (showAllEventsButton) showAllEventsButton.classList.remove('progress-active');
        }
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    // Dozentenplan button - desktop
    const dozentenplanButton = document.getElementById('dozentenplanButton');
    if (dozentenplanButton) {
      dozentenplanButton.addEventListener('click', () => {
        window.location.href = 'dozentenplan.html';
      });
    }

    // Dozentenplan button - mobile
    const dozentenplanButtonMobile = document.getElementById('dozentenplanButtonMobile');
    if (dozentenplanButtonMobile) {
      dozentenplanButtonMobile.addEventListener('click', () => {
        window.location.href = 'dozentenplan.html';
      });
    }

    // Dark mode toggle - desktop
    const darkModeToggleDesktop = document.getElementById('darkModeToggleDesktop');
    if (darkModeToggleDesktop) {
      darkModeToggleDesktop.addEventListener('click', toggleDarkMode);
    }

    // Dark mode toggle - mobile
    const darkModeToggleMobile = document.getElementById('darkModeToggleMobile');
    if (darkModeToggleMobile) {
      darkModeToggleMobile.addEventListener('click', toggleDarkMode);
    }

    // Initialize dark mode
    initializeDarkMode();

    if (currentWeekButton) {
      currentWeekButton.addEventListener('click', () => {
        const now = new Date();
        const currentDayIndex = now.getDay();
        
        // Collapse mobile filter panel
        const mobileConfigPanel = document.getElementById('mobileConfigPanel');
        const toggleButtonMobile = document.getElementById('toggleFilterButtonMobile');
        if (mobileConfigPanel && !mobileConfigPanel.classList.contains('collapsed')) {
          mobileConfigPanel.classList.add('collapsed');
          if (toggleButtonMobile) {
            toggleButtonMobile.setAttribute('aria-expanded', 'false');
            const icon = toggleButtonMobile.querySelector('.toggle-icon');
            if (icon) icon.textContent = 'expand_more';
          }
        }
        
        currentWeekStart = getMonday(new Date());
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
        
        // Check if we need to switch to next week (after rendering to check for Saturday events)
        setTimeout(() => {
          const saturdaySection = document.getElementById('saturday');
          const hasSaturdayEvents = saturdaySection !== null;
          
          if (currentDayIndex === 0) {
            // Sunday: always go to next week
            currentWeekStart = addDays(currentWeekStart, 7);
            renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
          } else if (currentDayIndex === 6 && !hasSaturdayEvents) {
            // Saturday without events: go to next week
            currentWeekStart = addDays(currentWeekStart, 7);
            renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
          }
          
          scrollToCurrentDay();
        }, 100);
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
        if (showProgressLabel) {
          toggleProgressButton.classList.add('progress-active');
        } else {
          toggleProgressButton.classList.remove('progress-active');
        }
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
        
        // Scroll to schedule grid
        setTimeout(() => {
          const scheduleGrid = document.querySelector('.schedule-table-container');
          if (scheduleGrid) {
            scheduleGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      });
    }

    if (toggleProgressButtonMobile) {
      toggleProgressButtonMobile.addEventListener('click', () => {
        showProgressLabel = !showProgressLabel;
        localStorage.setItem(PROGRESS_LABEL_KEY, String(showProgressLabel));
        if (showProgressLabel) {
          toggleProgressButtonMobile.classList.add('progress-active');
        } else {
          toggleProgressButtonMobile.classList.remove('progress-active');
        }
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    // Favorites button - desktop
    if (favoritesButton) {
      favoritesButton.addEventListener('click', () => {
        const starIcon = favoritesButton.querySelector('.material-symbols-outlined');
        if (starIcon) {
          starIcon.classList.remove('star-click-animation');
          void starIcon.offsetWidth; // Trigger reflow
          starIcon.classList.add('star-click-animation');
        }

        const favoritesDisplay = document.getElementById('desktopFavoritesDisplay');
        if (favoritesDisplay) {
          const isHidden = favoritesDisplay.classList.contains('hidden');
          if (isHidden) {
            favoritesDisplay.classList.remove('hidden');
          } else {
            favoritesDisplay.classList.add('hidden');
            // Process pending delete when closing
            processPendingDelete(data);
          }
        }
      });
    }

    if (addToFavoritesButton) {
      addToFavoritesButton.addEventListener('click', () => {
        addCurrentToFavorites(data, semesterSelect, facultySelect, courseSelect);
      });
    }

    // Favorites button - mobile
    if (favoritesButtonMobile) {
      favoritesButtonMobile.addEventListener('click', () => {
        const starIcon = favoritesButtonMobile.querySelector('.material-symbols-outlined');
        if (starIcon) {
          starIcon.classList.remove('star-click-animation');
          void starIcon.offsetWidth; // Trigger reflow
          starIcon.classList.add('star-click-animation');
        }

        const favoritesDisplay = document.getElementById('mobileFavoritesDisplay');
        if (favoritesDisplay) {
          const isHidden = favoritesDisplay.classList.contains('hidden');
          if (isHidden) {
            favoritesDisplay.classList.remove('hidden');
          } else {
            favoritesDisplay.classList.add('hidden');
            // Process pending delete when closing
            processPendingDelete(data);
          }
        }
      });
    }

    if (addToFavoritesButtonMobile) {
      addToFavoritesButtonMobile.addEventListener('click', () => {
        addCurrentToFavorites(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile);
      });
    }

    // Favorites panel buttons

    if (addToFavoritesMobilePanel) {
      addToFavoritesMobilePanel.addEventListener('click', () => {
        addCurrentToFavorites(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile);
      });
    }

    if (addToFavoritesDesktopPanel) {
      addToFavoritesDesktopPanel.addEventListener('click', () => {
        addCurrentToFavorites(data, semesterSelect, facultySelect, courseSelect);
      });
    }

    // Handle favorite item clicks and delete buttons
    document.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.favorite-item-delete');
      const favoriteItemName = e.target.closest('.favorite-item-name');
      const favoriteItem = e.target.closest('.favorite-item');

      console.log('Click detected:', { deleteBtn: !!deleteBtn, favoriteItemName: !!favoriteItemName, favoriteItem: !!favoriteItem });

      if (deleteBtn) {
        e.stopPropagation();
        const favoriteId = deleteBtn.dataset.deleteId;
        const starIcon = deleteBtn.querySelector('.material-symbols-outlined');

        if (isPendingDelete(favoriteId)) {
          // Restore favorite
          removeFromPendingDelete(favoriteId);
          renderFavoritesList(data);
        } else {
          // Mark for deletion
          addToPendingDelete(favoriteId);
          if (starIcon) {
            starIcon.classList.remove('text-yellow-500');
            starIcon.classList.add('text-gray-400');
            starIcon.style.fontVariationSettings = '';
          }
        }
      } else if (favoriteItemName || (favoriteItem && !deleteBtn)) {
        e.stopPropagation();
        const favoriteId = favoriteItem.dataset.favoriteId;
        console.log('Favorite item clicked, ID:', favoriteId);
        const favorites = getFavorites();
        const favorite = favorites.find(f => f.id === favoriteId);
        console.log('Found favorite:', favorite);
        if (favorite) {
          const newCourseId = loadFavorite(favorite, data, currentWeekStart, searchQuery);
          activeSource = newCourseId;

          // Sync selects between desktop and mobile
          const isMobileView = isMobile();
          const semesterSelect = isMobileView 
            ? document.getElementById('semesterSelectMobile') 
            : document.getElementById('semesterSelect');
          const facultySelect = isMobileView 
            ? document.getElementById('facultySelectMobile') 
            : document.getElementById('facultySelect');
          const courseSelect = isMobileView 
            ? document.getElementById('courseSelectMobile') 
            : document.getElementById('courseSelect');
          const semesterSelectOther = isMobileView 
            ? document.getElementById('semesterSelect') 
            : document.getElementById('semesterSelectMobile');
          const facultySelectOther = isMobileView 
            ? document.getElementById('facultySelect') 
            : document.getElementById('facultySelectMobile');
          const courseSelectOther = isMobileView 
            ? document.getElementById('courseSelect') 
            : document.getElementById('courseSelectMobile');

          if (semesterSelect && semesterSelectOther) semesterSelectOther.value = semesterSelect.value;
          if (facultySelect && facultySelectOther) facultySelectOther.value = facultySelect.value;
          if (courseSelect && courseSelectOther) courseSelectOther.value = courseSelect.value;

          // Close panels
          document.getElementById('desktopFavoritesDisplay')?.classList.add('hidden');
          document.getElementById('mobileFavoritesDisplay')?.classList.add('hidden');
        }
      }
    });

    // Mobile event listeners
    if (semesterSelectMobile) {
      semesterSelectMobile.addEventListener('change', () => {
        populateFaculties(semesterSelectMobile, facultySelectMobile, data);
        populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile, data);
        syncSelects(semesterSelectMobile, semesterSelect);
        syncSelects(facultySelectMobile, facultySelect);
        syncSelects(courseSelectMobile, courseSelect);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (facultySelectMobile) {
      facultySelectMobile.addEventListener('change', () => {
        // Store current course letter before repopulating
        const currentCourseId = courseSelectMobile.value;
        const currentCourseLetter = currentCourseId.slice(-1); // Get last character (e.g., 'a', 'b', 'c')
        
        populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile, data);
        updateCourseDropdownMobile();
        
        // Try to select the same course letter in the new faculty
        const matchingCourse = Array.from(courseSelectMobile.options).find(opt => opt.value && opt.value.slice(-1) === currentCourseLetter);
        if (matchingCourse) {
          courseSelectMobile.value = matchingCourse.value;
          activeSource = matchingCourse.value;
          updateCourseDropdownMobile(); // Update mobile display
          updateCourseDropdown(); // Update desktop display
        }
        
        syncSelects(facultySelectMobile, facultySelect);
        syncSelects(courseSelectMobile, courseSelect);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (courseSelectMobile) {
      courseSelectMobile.addEventListener('change', () => {
        activeSource = courseSelectMobile.value;
        syncSelects(courseSelectMobile, courseSelect);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (prevButtonMobile) {
      prevButtonMobile.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
      prevButtonMobile.addEventListener('touchend', (e) => {
        e.preventDefault();
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (nextButtonMobile) {
      nextButtonMobile.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
      nextButtonMobile.addEventListener('touchend', (e) => {
        e.preventDefault();
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (prevButtonMobileBottom) {
      prevButtonMobileBottom.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
      prevButtonMobileBottom.addEventListener('touchend', (e) => {
        e.preventDefault();
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
    }

    if (nextButtonMobileBottom) {
      nextButtonMobileBottom.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false);
      });
      nextButtonMobileBottom.addEventListener('touchend', (e) => {
        e.preventDefault();
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
        const icon = toggleButtonMobile.querySelector('.toggle-icon');
        const isCollapsed = mobileConfigPanel.classList.contains('collapsed');

        if (mobileConfigPanel) {
          if (isCollapsed) {
            // Expand: set height to scrollHeight first, then animate to auto
            mobileConfigPanel.style.height = mobileConfigPanel.scrollHeight + 'px';
            mobileConfigPanel.classList.remove('collapsed');
            toggleButtonMobile.setAttribute('aria-expanded', 'true');
            if (icon) icon.textContent = 'expand_less';

            // After animation completes, set height to auto
            setTimeout(() => {
              mobileConfigPanel.style.height = 'auto';
            }, 400);
          } else {
            // Collapse: set height to scrollHeight first, then animate to 0
            mobileConfigPanel.style.height = mobileConfigPanel.scrollHeight + 'px';
            mobileConfigPanel.classList.add('collapsed');
            toggleButtonMobile.setAttribute('aria-expanded', 'false');
            if (icon) icon.textContent = 'expand_more';

            // Force reflow
            mobileConfigPanel.offsetHeight;

            // Animate to 0
            mobileConfigPanel.style.height = '0';
          }
        }
      });
    }

    const cached = loadCachedSelection();
    if (cached && semesterOptions.includes(cached.semester)) {
      if (semesterSelect) {
        semesterSelect.value = cached.semester;
        semesterSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (semesterSelectMobile) {
        semesterSelectMobile.value = cached.semester;
        semesterSelectMobile.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Repopulate faculties after setting cached semester
      if (semesterSelect) populateFaculties(semesterSelect, facultySelect, data);
      if (semesterSelectMobile) populateFaculties(semesterSelectMobile, facultySelectMobile, data);
    }

    // Update Schanzen dropdowns after populating faculties
    if (updateFacultyDropdown) updateFacultyDropdown();
    if (updateFacultyDropdownMobile) updateFacultyDropdownMobile();

    if (cached && cached.faculty) {
      if (facultySelect) {
        facultySelect.value = cached.faculty;
        facultySelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (facultySelectMobile) {
        facultySelectMobile.value = cached.faculty;
        facultySelectMobile.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Repopulate courses after setting cached faculty
      if (courseSelect) populateCourses(courseSelect, semesterSelect, facultySelect, data);
      if (courseSelectMobile) populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile, data);
    }
    
    // Update Schanzen dropdowns after populating courses
    if (updateCourseDropdown) updateCourseDropdown();
    if (updateCourseDropdownMobile) updateCourseDropdownMobile();
    
    if (cached && cached.courseId) {
      if (courseSelect) {
        courseSelect.value = cached.courseId;
        courseSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (courseSelectMobile) {
        courseSelectMobile.value = cached.courseId;
        courseSelectMobile.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    
    activeSource = (courseSelect && courseSelect.value) || (courseSelectMobile && courseSelectMobile.value) || activeSource;

    // Update config to match the active source (displayed schedule)
    if (activeSource) {
      updateConfigFromActiveSource(activeSource, data);
    }

    // Check if user visited today and set animation flag
    shouldAnimateProgress = !hasVisitedToday();
    if (!hasVisitedToday()) {
      markDailyVisit();
    }

    filterCollapsed = getInitialFilterCollapsed();
    updateFilterState(filterCollapsed);

    // Process pending delete on page load
    processPendingDelete(data);

    // Initialize favorites list
    renderFavoritesList(data);

    // Initialize current favorite labels
    updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
    updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
    
    // Initialize mobile filter panel state
    const mobileConfigPanel = document.getElementById('mobileConfigPanel');
    if (mobileConfigPanel && filterCollapsed) {
      mobileConfigPanel.classList.add('collapsed');
      if (toggleButtonMobile) {
        toggleButtonMobile.setAttribute('aria-expanded', 'false');
        const icon = toggleButtonMobile.querySelector('.toggle-icon');
        if (icon) icon.textContent = 'expand_more';
      }
    }

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
