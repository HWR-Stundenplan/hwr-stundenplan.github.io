import { STUDY_PROGRAMS } from './config.js';
import { formatCourseLabel } from './utils.js';

export function logUpcomingEvents(semester, faculty, data) {
  if (!data || !data.events || !semester || !faculty) {
    console.log('[Upcoming Events] Missing required data');
    return;
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const twoYearsLater = new Date(now.getTime() + (2 * 365 * 24 * 60 * 60 * 1000));

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
    .slice(0, 10);

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

export function hasFacultyEventsInTimeRange(faculty, semester, data) {
  if (!data || !data.events || !data.schedules) {
    console.log('[Filter] Missing data:', { hasData: !!data, hasEvents: !!data?.events, hasSchedules: !!data?.schedules });
    return false;
  }
  
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const twoYearsLater = new Date(now.getTime() + (2 * 365 * 24 * 60 * 60 * 1000));
  const year2020 = new Date('2020-01-01T00:00:00.000Z');
  
  console.log(`[Filter] Checking faculty ${faculty}, semester ${semester}, time range: ${sixMonthsAgo.toISOString()} to ${twoYearsLater.toISOString()} (only events from 2020+)`);
  
  const relevantSchedules = data.schedules.filter(
    schedule => schedule.semester === semester && schedule.faculty === faculty
  );
  
  console.log(`[Filter] Found ${relevantSchedules.length} schedules for ${faculty} semester ${semester}`);
  
  if (relevantSchedules.length === 0) return false;
  
  const scheduleIds = new Set(relevantSchedules.map(s => s.id));
  console.log(`[Filter] Schedule IDs:`, Array.from(scheduleIds));
  
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

export function populateFaculties(semesterSelect, facultySelect, data) {
  if (!semesterSelect || !facultySelect || !data) return;
  const sem = semesterSelect.value;
  console.log('populateFaculties called with semester:', sem);
  const schedules = data.schedules || [];
  const faculties = Array.from(new Set(schedules.filter((schedule) => schedule.semester === sem).map((schedule) => schedule.faculty).filter(Boolean)));
  
  const filteredFaculties = faculties.filter(faculty => {
    const hasEvents = hasFacultyEventsInTimeRange(faculty, sem, data);
    console.log(`[Filter] Faculty ${faculty} has events in time range:`, hasEvents);
    return hasEvents;
  });
  
  const sortedFaculties = filteredFaculties.map(faculty => {
    const lowerFaculty = faculty.toLowerCase();
    const matchedKey = Object.keys(STUDY_PROGRAMS).find(key => key.toLowerCase() === lowerFaculty);
    if (matchedKey) {
      return {
        value: faculty,
        abbreviation: matchedKey,
        fullName: STUDY_PROGRAMS[matchedKey]
      };
    }
    return {
      value: faculty,
      abbreviation: null,
      fullName: faculty
    };
  }).sort((a, b) => a.fullName.localeCompare(b.fullName, 'de-DE'));
  
  console.log('Sorted faculties:', sortedFaculties);
  
  facultySelect.innerHTML = sortedFaculties.length 
    ? sortedFaculties.map(f => `<option value="${f.value}" data-abbreviation="${f.abbreviation || ''}" data-fullname="${f.fullName}">${f.fullName}</option>`).join('')
    : '<option value="">Keine Fachrichtung verfügbar</option>';
  console.log('Faculty select innerHTML set');
}

export function populateCourses(courseSelect, semesterSelect, facultySelect, data) {
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
