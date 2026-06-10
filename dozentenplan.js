// Reuse utility functions from script.js
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

function stripTitlePrefix(title) {
  return title.replace(/^\s*\d+\s*-\s*/, '').trim();
}

function isMobile() {
  return window.innerWidth <= 768;
}

// Lecturer reference list (same as in script.js)
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

function parseLecturerName(name) {
  if (!name) return null;
  
  const trimmed = name.trim();
  
  // Try to match pattern: "Nachname, Titel Vorname" or "Nachname, Titel Vorname Zusatz"
  const commaMatch = trimmed.match(/^([^,]+),\s*(.+)$/);
  
  if (commaMatch) {
    let lastName = commaMatch[1].trim();
    const rest = commaMatch[2].trim();
    
    // Extract title from the rest
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
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const noblePrefixes = ['von', 'zu', 'van', 'de', 'der', 'den', 'des'];
    let lastNameIndex = parts.length - 1;
    
    if (lastNameIndex > 0 && noblePrefixes.includes(parts[lastNameIndex - 1].toLowerCase())) {
      lastNameIndex = lastNameIndex - 1;
    }
    
    const lastName = parts.slice(lastNameIndex).join(' ');
    const titleAndFirstName = parts.slice(0, lastNameIndex).join(' ');
    
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

function getLecturerReferenceMap() {
  return buildLecturerReferenceMap();
}

function formatTeacherName(teacher, lecturerDb = null) {
  if (!teacher) return '';
  
  if (!lecturerDb) {
    return teacher.split(',').map(t => t.trim()).filter(Boolean).join(', ');
  }
  
  const teachers = teacher.split(',').map(t => t.trim()).filter(Boolean);
  
  return teachers.map(t => {
    const parsed = parseLecturerName(t);
    if (!parsed) return t;
    
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
  }).join(', ');
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
    
    // Handle multiple teachers separated by comma
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

function extractAllLecturers(events) {
  const lecturerSet = new Set();
  const lecturerDb = buildLecturerDatabase(events);
  
  events.forEach(event => {
    const teacherText = event.teacher || extractTeacherFromDescription(event.rawDescription || '');
    if (!teacherText) return;
    
    // Handle multiple teachers separated by comma
    const teachers = teacherText.split(',').map(t => t.trim()).filter(Boolean);
    
    teachers.forEach(teacher => {
      const formattedName = formatTeacherName(teacher, lecturerDb);
      if (formattedName) {
        lecturerSet.add(formattedName);
      }
    });
  });
  
  // Convert to array and sort
  return Array.from(lecturerSet).sort((a, b) => a.localeCompare(b, 'de'));
}

function filterEventsByLecturer(events, lecturerName, lecturerDb) {
  if (!lecturerName) return [];
  
  const normalizedSearchName = lecturerName.toLowerCase().trim();
  
  return events.filter(event => {
    const teacherText = event.teacher || extractTeacherFromDescription(event.rawDescription || '');
    if (!teacherText) return false;
    
    // Handle multiple teachers separated by comma
    const teachers = teacherText.split(',').map(t => t.trim()).filter(Boolean);
    
    return teachers.some(teacher => {
      const formattedName = formatTeacherName(teacher, lecturerDb).toLowerCase();
      // Check if the formatted name contains the search name or vice versa
      return formattedName.includes(normalizedSearchName) || normalizedSearchName.includes(formattedName);
    });
  });
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

function renderDesktopSchedule(grouped, weekDays, lecturerDb) {
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
      const location = ev.location ? `<div class="event-item-meta"><span class="material-symbols-outlined" style="font-size: 0.9rem;">location_on</span> ${ev.location}${isAsync ? ' <span style="color: #7c3aed;">(asynchron)</span>' : ''}</div>` : '';
      const teacherText = ev.teacher || extractTeacherFromDescription(ev.rawDescription || '');
      const teacher = teacherText ? `<div class="event-item-meta"><span class="material-symbols-outlined" style="font-size: 0.9rem;">person</span> ${formatTeacherName(teacherText, lecturerDb)}</div>` : '';
      const typeClass = isExam ? ' exam' : isOnline ? ' online' : isAsync ? ' async' : '';
      let typeLabel = 'Vorlesung';
      let pillColorClass = 'pill-blue';
      if (isExam) {
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

    const dayContentStyle = `style="min-height:${dayHeightPx}px;"`;

    return `
      <section class="day-column-grid${isToday ? ' current-day' : ''}">
        <div class="day-header-grid">
          <span class="day-name-grid">${dayDateLabel}</span>
        </div>
        <div class="day-content" ${dayContentStyle}>
          ${eventsHtml}
        </div>
      </section>
    `;
  }).join('');
}

function renderMobileSchedule(grouped, weekDays, lecturerDb) {
  const scheduleContainer = document.getElementById('scheduleContainerMobile');
  if (!scheduleContainer) return;

  const dayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  scheduleContainer.innerHTML = weekDays.map((day, index) => {
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
      const location = ev.location ? `<div class="flex items-center gap-2 text-gray-500"><span class="material-symbols-outlined text-[18px]">meeting_room</span><span class="text-sm">${ev.location}${isAsync ? ' <span style="color: #7c3aed;">(asynchron)</span>' : ''}</span></div>` : '';
      const teacherText = ev.teacher || extractTeacherFromDescription(ev.rawDescription || '');
      const teacher = teacherText ? `<div class="flex items-center gap-2 text-gray-500 col-span-2"><span class="material-symbols-outlined text-[18px]">person</span><span class="text-sm">${formatTeacherName(teacherText, lecturerDb)}</span></div>` : '';
      let typeLabel = 'V';
      let typeColorClass = 'bg-blue-50 text-[#002551]';
      if (isExam) {
        typeLabel = 'K';
        typeColorClass = 'bg-red-50 text-red-700';
      } else if (isOnline) {
        typeLabel = 'O';
        typeColorClass = 'bg-green-50 text-green-700';
      } else if (isAsync) {
        typeLabel = 'A';
        typeColorClass = 'bg-purple-50 text-purple-700';
      }

      const borderColor = isExam ? 'border-red-600' : isOnline ? 'border-green-600' : isAsync ? 'border-purple-600' : 'border-[#003a79]';
      const typeClass = isExam ? ' exam' : isOnline ? ' online' : isAsync ? ' async' : '';

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
    const isToday = getLocalDateKey(day) === getLocalDateKey(new Date());
    const dayName = dayNames[day.getDay()];
    const borderClass = isToday ? 'border-red-600' : 'border-blue-600';

    return `
      <section id="${dayIds[index]}" class="space-y-4">
        <div class="flex items-center justify-between border-l-4 ${borderClass} pl-3">
          <h2 class="text-lg font-semibold text-[#002551]">${dayName}</h2>
          <span class="text-xs font-mono text-gray-500">${dayDateLabel.toUpperCase()}</span>
        </div>
        <div class="space-y-3">
          ${eventsHtml}
        </div>
      </section>
    `;
  }).join('');
}

function renderSchedule(filteredEvents, referenceDate, lecturerDb) {
  if (filteredEvents.length === 0) {
    if (isMobile()) {
      document.getElementById('scheduleContainerMobile').innerHTML = `
        <div class="text-center py-12">
          <span class="material-symbols-outlined text-6xl text-gray-300">event_busy</span>
          <p class="mt-4 text-gray-500">Keine Veranstaltungen für diesen Dozenten gefunden.</p>
        </div>
      `;
    } else {
      document.getElementById('daysGrid').innerHTML = `
        <div class="text-center py-12 col-span-5">
          <span class="material-symbols-outlined text-6xl text-gray-300">event_busy</span>
          <p class="mt-4 text-gray-500">Keine Veranstaltungen für diesen Dozenten gefunden.</p>
        </div>
      `;
    }
    return;
  }

  const grouped = groupEventsByDay(filteredEvents);
  const weekStart = getMonday(referenceDate);
  
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
    renderMobileSchedule(grouped, weekDays, lecturerDb);
  } else {
    renderDesktopSchedule(grouped, weekDays, lecturerDb);
  }
}

function showLecturerSuggestions(suggestions, isMobile = false) {
  const containerId = isMobile ? 'lecturerSuggestionsMobile' : 'lecturerSuggestions';
  const container = document.getElementById(containerId);
  
  if (!container || suggestions.length === 0) {
    if (container) container.classList.add('hidden');
    return;
  }
  
  container.innerHTML = suggestions.map(name => `
    <div class="lecturer-suggestion-item" data-lecturer="${name}">
      <span class="material-symbols-outlined">person</span>
      <span>${name}</span>
    </div>
  `).join('');
  
  container.classList.remove('hidden');
  
  // Add click handlers
  container.querySelectorAll('.lecturer-suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const lecturerName = item.dataset.lecturer;
      selectLecturer(lecturerName, isMobile);
    });
  });
}

function selectLecturer(lecturerName, isMobile = false) {
  const displayId = isMobile ? 'selectedLecturerDisplayMobile' : 'selectedLecturerDisplay';
  const nameId = isMobile ? 'selectedLecturerNameMobile' : 'selectedLecturerName';
  const searchInputId = isMobile ? 'lecturerSearchInputMobile' : 'lecturerSearchInput';
  const suggestionsId = isMobile ? 'lecturerSuggestionsMobile' : 'lecturerSuggestions';
  
  // Show selected lecturer display
  document.getElementById(displayId).classList.remove('hidden');
  document.getElementById(nameId).textContent = lecturerName;
  
  // Hide suggestions
  document.getElementById(suggestionsId).classList.add('hidden');
  
  // Clear search input
  document.getElementById(searchInputId).value = '';
  
  // Store selected lecturer
  window.selectedLecturer = lecturerName;
  
  // Filter and render events
  if (window.scheduleData) {
    const lecturerDb = buildLecturerDatabase(window.scheduleData.events);
    const filteredEvents = filterEventsByLecturer(window.scheduleData.events, lecturerName, lecturerDb);
    renderSchedule(filteredEvents, window.currentWeekStart, lecturerDb);
  }
}

function clearLecturerSelection(isMobile = false) {
  const displayId = isMobile ? 'selectedLecturerDisplayMobile' : 'selectedLecturerDisplay';
  const searchInputId = isMobile ? 'lecturerSearchInputMobile' : 'lecturerSearchInput';
  
  // Hide selected lecturer display
  document.getElementById(displayId).classList.add('hidden');
  
  // Clear search input
  document.getElementById(searchInputId).value = '';
  
  // Clear selected lecturer
  window.selectedLecturer = null;
  
  // Clear schedule
  if (isMobile()) {
    document.getElementById('scheduleContainerMobile').innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-6xl text-gray-300">search</span>
        <p class="mt-4 text-gray-500">Bitte wählen Sie einen Dozenten aus.</p>
      </div>
    `;
  } else {
    document.getElementById('daysGrid').innerHTML = `
      <div class="text-center py-12 col-span-5">
        <span class="material-symbols-outlined text-6xl text-gray-300">search</span>
        <p class="mt-4 text-gray-500">Bitte wählen Sie einen Dozenten aus.</p>
      </div>
    `;
  }
}

async function init() {
  try {
    const response = await fetch('schedule.json');
    window.scheduleData = await response.json();
    
    window.currentWeekStart = getMonday(new Date());
    window.selectedLecturer = null;
    
    // Extract all lecturers
    const allLecturers = extractAllLecturers(window.scheduleData.events);
    window.allLecturers = allLecturers;
    
    // Desktop search input
    const lecturerSearchInput = document.getElementById('lecturerSearchInput');
    const clearLecturerSearch = document.getElementById('clearLecturerSearch');
    
    if (lecturerSearchInput) {
      lecturerSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (clearLecturerSearch) {
          clearLecturerSearch.style.display = query ? 'flex' : 'none';
        }
        
        if (query.length === 0) {
          showLecturerSuggestions([], false);
          return;
        }
        
        const filtered = allLecturers.filter(name => 
          name.toLowerCase().includes(query)
        ).slice(0, 10);
        
        showLecturerSuggestions(filtered, false);
      });
    }
    
    if (clearLecturerSearch) {
      clearLecturerSearch.addEventListener('click', () => {
        lecturerSearchInput.value = '';
        clearLecturerSearch.style.display = 'none';
        showLecturerSuggestions([], false);
      });
    }
    
    // Mobile search input
    const lecturerSearchInputMobile = document.getElementById('lecturerSearchInputMobile');
    const clearLecturerSearchMobile = document.getElementById('clearLecturerSearchMobile');
    
    if (lecturerSearchInputMobile) {
      lecturerSearchInputMobile.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (clearLecturerSearchMobile) {
          clearLecturerSearchMobile.style.display = query ? 'flex' : 'none';
        }
        
        if (query.length === 0) {
          showLecturerSuggestions([], true);
          return;
        }
        
        const filtered = allLecturers.filter(name => 
          name.toLowerCase().includes(query)
        ).slice(0, 10);
        
        showLecturerSuggestions(filtered, true);
      });
    }
    
    if (clearLecturerSearchMobile) {
      clearLecturerSearchMobile.addEventListener('click', () => {
        lecturerSearchInputMobile.value = '';
        clearLecturerSearchMobile.style.display = 'none';
        showLecturerSuggestions([], true);
      });
    }
    
    // Clear selection buttons
    const clearLecturerSelectionBtn = document.getElementById('clearLecturerSelection');
    if (clearLecturerSelectionBtn) {
      clearLecturerSelectionBtn.addEventListener('click', () => clearLecturerSelection(false));
    }
    
    const clearLecturerSelectionBtnMobile = document.getElementById('clearLecturerSelectionMobile');
    if (clearLecturerSelectionBtnMobile) {
      clearLecturerSelectionBtnMobile.addEventListener('click', () => clearLecturerSelection(true));
    }
    
    // Week navigation - desktop
    const prevWeek = document.getElementById('prevWeek');
    const nextWeek = document.getElementById('nextWeek');
    
    if (prevWeek) {
      prevWeek.addEventListener('click', () => {
        window.currentWeekStart = addDays(window.currentWeekStart, -7);
        if (window.selectedLecturer && window.scheduleData) {
          const lecturerDb = buildLecturerDatabase(window.scheduleData.events);
          const filteredEvents = filterEventsByLecturer(window.scheduleData.events, window.selectedLecturer, lecturerDb);
          renderSchedule(filteredEvents, window.currentWeekStart, lecturerDb);
        }
      });
    }
    
    if (nextWeek) {
      nextWeek.addEventListener('click', () => {
        window.currentWeekStart = addDays(window.currentWeekStart, 7);
        if (window.selectedLecturer && window.scheduleData) {
          const lecturerDb = buildLecturerDatabase(window.scheduleData.events);
          const filteredEvents = filterEventsByLecturer(window.scheduleData.events, window.selectedLecturer, lecturerDb);
          renderSchedule(filteredEvents, window.currentWeekStart, lecturerDb);
        }
      });
    }
    
    // Week navigation - mobile
    const prevWeekMobile = document.getElementById('prevWeekMobile');
    const nextWeekMobile = document.getElementById('nextWeekMobile');
    
    if (prevWeekMobile) {
      prevWeekMobile.addEventListener('click', () => {
        window.currentWeekStart = addDays(window.currentWeekStart, -7);
        if (window.selectedLecturer && window.scheduleData) {
          const lecturerDb = buildLecturerDatabase(window.scheduleData.events);
          const filteredEvents = filterEventsByLecturer(window.scheduleData.events, window.selectedLecturer, lecturerDb);
          renderSchedule(filteredEvents, window.currentWeekStart, lecturerDb);
        }
      });
    }
    
    if (nextWeekMobile) {
      nextWeekMobile.addEventListener('click', () => {
        window.currentWeekStart = addDays(window.currentWeekStart, 7);
        if (window.selectedLecturer && window.scheduleData) {
          const lecturerDb = buildLecturerDatabase(window.scheduleData.events);
          const filteredEvents = filterEventsByLecturer(window.scheduleData.events, window.selectedLecturer, lecturerDb);
          renderSchedule(filteredEvents, window.currentWeekStart, lecturerDb);
        }
      });
    }
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      const suggestionsDesktop = document.getElementById('lecturerSuggestions');
      const suggestionsMobile = document.getElementById('lecturerSuggestionsMobile');
      const searchDesktop = document.getElementById('lecturerSearchInput');
      const searchMobile = document.getElementById('lecturerSearchInputMobile');
      
      if (suggestionsDesktop && !suggestionsDesktop.contains(e.target) && e.target !== searchDesktop) {
        suggestionsDesktop.classList.add('hidden');
      }
      
      if (suggestionsMobile && !suggestionsMobile.contains(e.target) && e.target !== searchMobile) {
        suggestionsMobile.classList.add('hidden');
      }
    });
    
    // Show initial empty state
    if (isMobile()) {
      document.getElementById('scheduleContainerMobile').innerHTML = `
        <div class="text-center py-12">
          <span class="material-symbols-outlined text-6xl text-gray-300">search</span>
          <p class="mt-4 text-gray-500">Bitte wählen Sie einen Dozenten aus.</p>
        </div>
      `;
    } else {
      document.getElementById('daysGrid').innerHTML = `
        <div class="text-center py-12 col-span-5">
          <span class="material-symbols-outlined text-6xl text-gray-300">search</span>
          <p class="mt-4 text-gray-500">Bitte wählen Sie einen Dozenten aus.</p>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Error loading schedule data:', error);
    if (isMobile()) {
      document.getElementById('scheduleContainerMobile').innerHTML = `
        <div class="text-center py-12">
          <span class="material-symbols-outlined text-6xl text-red-300">error</span>
          <p class="mt-4 text-red-500">Fehler beim Laden der Daten.</p>
        </div>
      `;
    } else {
      document.getElementById('daysGrid').innerHTML = `
        <div class="text-center py-12 col-span-5">
          <span class="material-symbols-outlined text-6xl text-red-300">error</span>
          <p class="mt-4 text-red-500">Fehler beim Laden der Daten.</p>
        </div>
      `;
    }
  }
}

window.addEventListener('DOMContentLoaded', init);
