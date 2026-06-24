// Main entry point for the application
import { 
  FILTER_COLLAPSED_KEY, 
  hasInitialScrollOccurred
} from './modules/config.js';

let filterCollapsed = false;
let shouldAnimateProgress = false;
let showProgressLabel = false;

import {
  hasVisitedToday,
  markDailyVisit,
  isStarterViewNeeded,
  markStarterViewCompleted,
  getInitialFilterCollapsed,
  cacheScheduleData,
  getCachedScheduleData,
  loadShowAllEventsPreference,
  saveShowAllEventsPreference,
  getFavorites,
  saveFavorites,
  getPendingDelete,
  savePendingDelete,
  addToPendingDelete,
  removeFromPendingDelete,
  isPendingDelete,
  processPendingDelete,
  setCookie,
  getCookie,
  deleteCookie
} from './modules/storage.js';

import {
  getMonday,
  addDays,
  getLocalDateKey,
  getWeekNumber,
  formatTime,
  formatDateShort,
  formatDateRange,
  formatProgressPercent,
  formatHourLabel,
  stripTitlePrefix,
  formatCourseLabel,
  isMobile,
  dayNames
} from './modules/utils.js';

import { initializeDarkMode, toggleDarkMode } from './modules/dark-mode.js';
import { initializeSchanzenDropdown } from './modules/dropdown.js';
import { 
  parseLecturerName, 
  buildLecturerDatabase, 
  formatTeacherName, 
  extractTeacherFromDescription,
  isLecturerInReferenceList,
  getLecturerReferenceMap
} from './modules/lecturer.js';
import { 
  groupEventsByDay, 
  mergeConsecutiveEvents, 
  parsePauseMinutes 
} from './modules/events.js';
import { 
  renderSkeletonLoader, 
  renderSchedule 
} from './modules/rendering.js';
import {
  generateFavoriteAbbreviation,
  updateCurrentFavoriteLabel,
  addCurrentToFavorites,
  deleteFavorite,
  renderFavoritesList
} from './modules/favorites.js';
import {
  logUpcomingEvents,
  hasFacultyEventsInTimeRange,
  populateFaculties,
  populateCourses
} from './modules/filter.js';
import { initializeStarterView } from './modules/starter-view.js';
import { generateICS, downloadICS } from './modules/ics-export.js';

// Helper functions
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
  
  if (!semesterSelect || !facultySelect || !courseSelect) {
    console.error('Missing select elements in loadFavorite');
    return favorite.courseId;
  }

  semesterSelect.value = favorite.semester;
  
  populateFaculties(semesterSelect, facultySelect, data);
  
  requestAnimationFrame(() => {
    facultySelect.value = favorite.faculty;
    
    populateCourses(courseSelect, semesterSelect, facultySelect, data);
    
    requestAnimationFrame(() => {
      courseSelect.value = favorite.courseId;

      const now = new Date();
      const currentDayIndex = now.getDay();
      let newWeekStart = getMonday(now);

      saveSelection();
      renderSchedule(data, favorite.courseId, newWeekStart, searchQuery, false, showAllEvents);

      setTimeout(() => {
        const saturdaySection = document.getElementById('saturday');
        const hasSaturdayEvents = saturdaySection !== null;
        
        if (currentDayIndex === 0) {
          newWeekStart = addDays(newWeekStart, 7);
          renderSchedule(data, favorite.courseId, newWeekStart, searchQuery, false, showAllEvents);
        } else if (currentDayIndex === 6 && !hasSaturdayEvents) {
          newWeekStart = addDays(newWeekStart, 7);
          renderSchedule(data, favorite.courseId, newWeekStart, searchQuery, false, showAllEvents);
        }
        
        if (isMobileView) {
          scrollToCurrentDay();
        }
      }, 100);
    });
  });
  
  return favorite.courseId;
}

function saveSelection() {
  const select = isMobile() ? document.getElementById('semesterSelectMobile') : document.getElementById('semesterSelect');
  const facultySel = isMobile() ? document.getElementById('facultySelectMobile') : document.getElementById('facultySelect');
  const courseSel = isMobile() ? document.getElementById('courseSelectMobile') : document.getElementById('courseSelect');
  
  if (!select || !facultySel || !courseSel) return;
  
  const selection = {
    semester: select.value,
    faculty: facultySel.value,
    courseId: courseSel.value,
  };
  const payload = JSON.stringify(selection);
  const cacheKey = 'st-plan-selection-v1';
  try {
    localStorage.setItem(cacheKey, payload);
  } catch (error) {
    setCookie(cacheKey, encodeURIComponent(payload), 365);
  }
}

function loadCachedSelection() {
  const cacheKey = 'st-plan-selection-v1';
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

  const semesterSelect = document.getElementById('semesterSelect');
  const facultySelect = document.getElementById('facultySelect');
  const courseSelect = document.getElementById('courseSelect');
  const semesterSelectMobile = document.getElementById('semesterSelectMobile');
  const facultySelectMobile = document.getElementById('facultySelectMobile');
  const courseSelectMobile = document.getElementById('courseSelectMobile');

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

  saveSelection();
}

function syncSelects(sourceSelect, targetSelect) {
  if (sourceSelect && targetSelect) {
    targetSelect.value = sourceSelect.value;
  }
}

// Main initialization function
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
    const showAllEventsButton = document.getElementById('showAllEvents');
    const searchInput = document.getElementById('searchInput');
    const clearSearchButton = document.getElementById('clearSearch');
    const toggleButton = document.getElementById('toggleFilterButton');
    const toggleProgressButton = document.getElementById('toggleProgressLabel');
    const favoritesButton = document.getElementById('favoritesButton');
    const addToFavoritesButton = document.getElementById('addToFavorites');
    const currentFavoriteLabelDesktop = document.getElementById('currentFavoriteLabelDesktop');
    const addToFavoritesDesktopPanel = document.getElementById('addToFavoritesDesktopPanel');
    const dozentenplanButton = document.getElementById('dozentenplanButton');
    const settingsButtonDesktop = document.getElementById('settingsButtonDesktop');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const darkModeToggleSettings = document.getElementById('darkModeToggleSettings');
    const exportCalendarSettings = document.getElementById('exportCalendarSettings');
    const resetCacheSettings = document.getElementById('resetCacheSettings');

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
    const dozentenplanButtonMobile = document.getElementById('dozentenplanButtonMobile');

    const cacheKey = 'st-plan-selection-v1';
    const schedules = data.schedules || [];
    const maxSemester = data.maxSemester || 1;
    let currentWeekStart = getMonday(new Date());
    let activeSource = null;
    let searchQuery = '';
    let showAllEvents = loadShowAllEventsPreference();

    if (showAllEvents) {
      if (showAllEventsButton) showAllEventsButton.classList.add('progress-active');
      if (showAllEventsButtonMobile) showAllEventsButtonMobile.classList.add('progress-active');
    }

    if (isStarterViewNeeded()) {
      initializeStarterView(data, maxSemester, cacheKey);
      return;
    }

    const semesterOptions = Array.from({ length: maxSemester }, (_, index) => `semester${index + 1}`);
    
    if (semesterSelect) {
      semesterSelect.innerHTML = semesterOptions.map((semester, index) => `<option value="${semester}">Semester ${index + 1}</option>`).join('');
    }
    
    if (semesterSelectMobile) {
      semesterSelectMobile.innerHTML = semesterOptions.map((semester, index) => `<option value="${semester}">Semester ${index + 1}</option>`).join('');
    }
    
    if (semesterSelect) populateFaculties(semesterSelect, facultySelect, data);
    if (semesterSelectMobile) populateFaculties(semesterSelectMobile, facultySelectMobile, data);
    
    if (courseSelect) populateCourses(courseSelect, semesterSelect, facultySelect, data);
    if (courseSelectMobile) populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile, data);

    const updateSemesterDropdown = initializeSchanzenDropdown('semester', 'semesterSelect', 'semesterOptions');
    const updateFacultyDropdown = initializeSchanzenDropdown('faculty', 'facultySelect', 'facultyOptions');
    const updateCourseDropdown = initializeSchanzenDropdown('course', 'courseSelect', 'courseOptions');

    const updateSemesterDropdownMobile = initializeSchanzenDropdown('semester-mobile', 'semesterSelectMobile', 'semesterOptionsMobile');
    const updateFacultyDropdownMobile = initializeSchanzenDropdown('faculty-mobile', 'facultySelectMobile', 'facultyOptionsMobile');
    const updateCourseDropdownMobile = initializeSchanzenDropdown('course-mobile', 'courseSelectMobile', 'courseOptionsMobile');

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
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
        
        if (facultySelect.value) {
          logUpcomingEvents(semesterSelect.value, facultySelect.value, data);
        }
      });
    }

    if (facultySelect) {
      facultySelect.addEventListener('change', () => {
        const currentCourseId = courseSelect.value;
        const currentCourseLetter = currentCourseId.slice(-1);
        
        populateCourses(courseSelect, semesterSelect, facultySelect, data);
        updateCourseDropdown();
        
        const matchingCourse = Array.from(courseSelect.options).find(opt => opt.value && opt.value.slice(-1) === currentCourseLetter);
        if (matchingCourse) {
          courseSelect.value = matchingCourse.value;
          activeSource = matchingCourse.value;
          updateCourseDropdown();
          updateCourseDropdownMobile();
        }
        
        syncSelects(facultySelect, facultySelectMobile);
        syncSelects(courseSelect, courseSelectMobile);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (courseSelect) {
      courseSelect.addEventListener('change', () => {
        activeSource = courseSelect.value;
        syncSelects(courseSelect, courseSelectMobile);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (prevButtonBottom) {
      prevButtonBottom.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (nextButtonBottom) {
      nextButtonBottom.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    // Settings Modal
    if (settingsButtonDesktop) {
      settingsButtonDesktop.addEventListener('click', () => {
        if (settingsModal) {
          settingsModal.classList.remove('hidden');
        }
      });
    }

    if (closeSettings) {
      closeSettings.addEventListener('click', () => {
        if (settingsModal) {
          settingsModal.classList.add('hidden');
        }
      });
    }

    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal || e.target.classList.contains('settings-overlay')) {
          settingsModal.classList.add('hidden');
        }
      });
    }

    if (resetCacheSettings) {
      resetCacheSettings.addEventListener('click', () => {
        try {
          localStorage.removeItem(cacheKey);
          localStorage.removeItem('st-plan-schedule-cache');
          localStorage.removeItem('st-plan-schedule-cache-timestamp');
          localStorage.removeItem('st-plan-starter-completed');
          localStorage.removeItem('st-plan-favorites');
          deleteCookie(cacheKey);
        } catch (error) {
          console.warn(error);
        }
        location.reload();
      });
    }

    if (exportCalendarSettings) {
      exportCalendarSettings.addEventListener('click', () => {
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

    if (darkModeToggleSettings) {
      darkModeToggleSettings.addEventListener('click', () => {
        toggleDarkMode();
      });
    }

    const toggleBtn = document.getElementById('toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('change', () => {
        toggleDarkMode();
      });
    }

    if (showAllEventsButton) {
      showAllEventsButton.addEventListener('click', () => {
        showAllEvents = !showAllEvents;
        saveShowAllEventsPreference(showAllEvents);
        if (showAllEvents) {
          showAllEventsButton.classList.add('progress-active');
          if (showAllEventsButtonMobile) showAllEventsButtonMobile.classList.add('progress-active');
        } else {
          showAllEventsButton.classList.remove('progress-active');
          if (showAllEventsButtonMobile) showAllEventsButtonMobile.classList.remove('progress-active');
        }
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearSearchButton) clearSearchButton.style.display = searchQuery ? 'flex' : 'none';
        if (searchInputMobile) searchInputMobile.value = searchQuery;
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (clearSearchButton) {
      clearSearchButton.addEventListener('click', () => {
        searchQuery = '';
        searchInput.value = '';
        clearSearchButton.style.display = 'none';
        if (searchInputMobile) searchInputMobile.value = '';
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
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
        localStorage.setItem('st-plan-progress-label', String(showProgressLabel));
        toggleProgressButton.classList.toggle('progress-active', showProgressLabel);
        if (toggleProgressButtonMobile) {
          toggleProgressButtonMobile.classList.toggle('progress-active', showProgressLabel);
        }
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (favoritesButton) {
      favoritesButton.addEventListener('click', () => {
        const desktopFavoritesDisplay = document.getElementById('desktopFavoritesDisplay');
        if (desktopFavoritesDisplay) {
          desktopFavoritesDisplay.classList.toggle('hidden');
        }
      });
    }

    if (addToFavoritesButton) {
      addToFavoritesButton.addEventListener('click', () => {
        addCurrentToFavorites(data, semesterSelect, facultySelect, courseSelect);
        renderFavoritesList(data);
        updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
        updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
      });
    }

    if (dozentenplanButton) {
      dozentenplanButton.addEventListener('click', () => {
        window.location.href = 'dozentenplan.html';
      });
    }

    const favoritesListDesktopPanel = document.getElementById('favoritesListDesktopPanel');
    if (favoritesListDesktopPanel) {
      favoritesListDesktopPanel.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.favorite-item-delete');
        const favoriteItemName = e.target.closest('.favorite-item-name');
        const favoriteItem = e.target.closest('.favorite-item');

        if (deleteBtn) {
          e.stopPropagation();
          const favoriteId = deleteBtn.dataset.deleteId;
          const starIcon = deleteBtn.querySelector('.material-symbols-outlined');

          if (isPendingDelete(favoriteId)) {
            removeFromPendingDelete(favoriteId);
            renderFavoritesList(data);
          } else {
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
          const favorites = getFavorites();
          const favorite = favorites.find(f => f.id === favoriteId);
          if (favorite) {
            const newCourseId = loadFavorite(favorite, data, currentWeekStart, searchQuery);
            activeSource = newCourseId;

            const isMobileView = isMobile();
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

            document.getElementById('desktopFavoritesDisplay')?.classList.add('hidden');
            document.getElementById('mobileFavoritesDisplay')?.classList.add('hidden');
          }
        }
      });
    }

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
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (facultySelectMobile) {
      facultySelectMobile.addEventListener('change', () => {
        const currentCourseId = courseSelectMobile.value;
        const currentCourseLetter = currentCourseId.slice(-1);
        
        populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile, data);
        updateCourseDropdownMobile();
        
        const matchingCourse = Array.from(courseSelectMobile.options).find(opt => opt.value && opt.value.slice(-1) === currentCourseLetter);
        if (matchingCourse) {
          courseSelectMobile.value = matchingCourse.value;
          activeSource = matchingCourse.value;
          updateCourseDropdownMobile();
          updateCourseDropdown();
        }
        
        syncSelects(facultySelectMobile, facultySelect);
        syncSelects(courseSelectMobile, courseSelect);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (courseSelectMobile) {
      courseSelectMobile.addEventListener('change', () => {
        activeSource = courseSelectMobile.value;
        syncSelects(courseSelectMobile, courseSelect);
        saveSelection();
        updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (prevButtonMobile) {
      prevButtonMobile.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
      prevButtonMobile.addEventListener('touchend', (e) => {
        e.preventDefault();
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (nextButtonMobile) {
      nextButtonMobile.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
      nextButtonMobile.addEventListener('touchend', (e) => {
        e.preventDefault();
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (prevButtonMobileBottom) {
      prevButtonMobileBottom.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
      prevButtonMobileBottom.addEventListener('touchend', (e) => {
        e.preventDefault();
        currentWeekStart = addDays(currentWeekStart, -7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (nextButtonMobileBottom) {
      nextButtonMobileBottom.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
      nextButtonMobileBottom.addEventListener('touchend', (e) => {
        e.preventDefault();
        currentWeekStart = addDays(currentWeekStart, 7);
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (resetButtonMobile) {
      resetButtonMobile.addEventListener('click', () => {
        try {
          localStorage.removeItem(cacheKey);
          localStorage.removeItem('st-plan-schedule-cache');
          localStorage.removeItem('st-plan-schedule-cache-timestamp');
          localStorage.removeItem('st-plan-starter-completed');
          localStorage.removeItem('st-plan-favorites');
          deleteCookie(cacheKey);
        } catch (error) {
          console.warn(error);
        }
        location.reload();
      });
    }

    if (showAllEventsButtonMobile) {
      showAllEventsButtonMobile.addEventListener('click', () => {
        showAllEvents = !showAllEvents;
        saveShowAllEventsPreference(showAllEvents);
        if (showAllEvents) {
          showAllEventsButtonMobile.classList.add('progress-active');
          if (showAllEventsButton) showAllEventsButton.classList.add('progress-active');
        } else {
          showAllEventsButtonMobile.classList.remove('progress-active');
          if (showAllEventsButton) showAllEventsButton.classList.remove('progress-active');
        }
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (currentWeekButton) {
      currentWeekButton.addEventListener('click', () => {
        currentWeekStart = getMonday(new Date());
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
        if (isMobile()) {
          scrollToCurrentDay();
        }
      });
    }

    if (searchInputMobile) {
      searchInputMobile.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearSearchButtonMobile) clearSearchButtonMobile.style.display = searchQuery ? 'flex' : 'none';
        if (searchInput) searchInput.value = searchQuery;
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (clearSearchButtonMobile) {
      clearSearchButtonMobile.addEventListener('click', () => {
        searchQuery = '';
        searchInputMobile.value = '';
        clearSearchButtonMobile.style.display = 'none';
        if (searchInput) searchInput.value = '';
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (toggleButtonMobile) {
      toggleButtonMobile.addEventListener('click', () => {
        const mobileConfigPanel = document.getElementById('mobileConfigPanel');
        const icon = toggleButtonMobile.querySelector('.toggle-icon');
        const isCollapsed = mobileConfigPanel.classList.contains('collapsed');

        if (mobileConfigPanel) {
          if (isCollapsed) {
            mobileConfigPanel.style.height = mobileConfigPanel.scrollHeight + 'px';
            mobileConfigPanel.classList.remove('collapsed');
            toggleButtonMobile.setAttribute('aria-expanded', 'true');
            if (icon) icon.textContent = 'expand_less';

            setTimeout(() => {
              mobileConfigPanel.style.height = 'auto';
            }, 400);
          } else {
            mobileConfigPanel.style.height = mobileConfigPanel.scrollHeight + 'px';
            mobileConfigPanel.classList.add('collapsed');
            toggleButtonMobile.setAttribute('aria-expanded', 'false');
            if (icon) icon.textContent = 'expand_more';

            mobileConfigPanel.offsetHeight;

            mobileConfigPanel.style.height = '0';
          }
        }
      });
    }

    if (toggleProgressButtonMobile) {
      toggleProgressButtonMobile.addEventListener('click', () => {
        showProgressLabel = !showProgressLabel;
        localStorage.setItem('st-plan-progress-label', String(showProgressLabel));
        toggleProgressButtonMobile.classList.toggle('progress-active', showProgressLabel);
        if (toggleProgressButton) {
          toggleProgressButton.classList.toggle('progress-active', showProgressLabel);
        }
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
      });
    }

    if (favoritesButtonMobile) {
      favoritesButtonMobile.addEventListener('click', () => {
        const mobileFavoritesDisplay = document.getElementById('mobileFavoritesDisplay');
        if (mobileFavoritesDisplay) {
          mobileFavoritesDisplay.classList.toggle('hidden');
        }
      });
    }

    if (dozentenplanButtonMobile) {
      dozentenplanButtonMobile.addEventListener('click', () => {
        window.location.href = 'dozentenplan.html';
      });
    }

    if (addToFavoritesButtonMobile) {
      addToFavoritesButtonMobile.addEventListener('click', () => {
        addCurrentToFavorites(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile);
        renderFavoritesList(data);
        updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
        updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
      });
    }

    const favoritesListMobilePanel = document.getElementById('favoritesListMobilePanel');
    if (favoritesListMobilePanel) {
      favoritesListMobilePanel.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.favorite-item-delete');
        const favoriteItemName = e.target.closest('.favorite-item-name');
        const favoriteItem = e.target.closest('.favorite-item');

        if (deleteBtn) {
          e.stopPropagation();
          const favoriteId = deleteBtn.dataset.deleteId;
          const starIcon = deleteBtn.querySelector('.material-symbols-outlined');

          if (isPendingDelete(favoriteId)) {
            removeFromPendingDelete(favoriteId);
            renderFavoritesList(data);
          } else {
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
          const favorites = getFavorites();
          const favorite = favorites.find(f => f.id === favoriteId);
          if (favorite) {
            const newCourseId = loadFavorite(favorite, data, currentWeekStart, searchQuery);
            activeSource = newCourseId;

            const isMobileView = isMobile();
            const semesterSelectOther = isMobileView 
              ? document.getElementById('semesterSelect') 
              : document.getElementById('semesterSelectMobile');
            const facultySelectOther = isMobileView 
              ? document.getElementById('facultySelect') 
              : document.getElementById('facultySelectMobile');
            const courseSelectOther = isMobileView 
              ? document.getElementById('courseSelect') 
              : document.getElementById('courseSelectMobile');

            if (semesterSelectMobile && semesterSelectOther) semesterSelectOther.value = semesterSelectMobile.value;
            if (facultySelectMobile && facultySelectOther) facultySelectOther.value = facultySelectMobile.value;
            if (courseSelectMobile && courseSelectOther) courseSelectOther.value = courseSelectMobile.value;

            document.getElementById('desktopFavoritesDisplay')?.classList.add('hidden');
            document.getElementById('mobileFavoritesDisplay')?.classList.add('hidden');
          }
        }
      });
    }

    // Dark mode
    initializeDarkMode();

    // Mobile settings button
    const settingsButtonMobile = document.getElementById('settingsButtonMobile');
    if (settingsButtonMobile) {
      settingsButtonMobile.addEventListener('click', () => {
        if (settingsModal) {
          settingsModal.classList.remove('hidden');
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

      if (semesterSelect) populateFaculties(semesterSelect, facultySelect, data);
      if (semesterSelectMobile) populateFaculties(semesterSelectMobile, facultySelectMobile, data);
    }

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

      if (courseSelect) populateCourses(courseSelect, semesterSelect, facultySelect, data);
      if (courseSelectMobile) populateCourses(courseSelectMobile, semesterSelectMobile, facultySelectMobile, data);
    }
    
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

    if (activeSource) {
      updateConfigFromActiveSource(activeSource, data);
    }

    shouldAnimateProgress = !hasVisitedToday();
    if (!hasVisitedToday()) {
      markDailyVisit();
    }

    showProgressLabel = localStorage.getItem('st-plan-progress-label') === 'true';

    filterCollapsed = getInitialFilterCollapsed();
    updateFilterState(filterCollapsed);

    processPendingDelete(data);
    renderFavoritesList(data);

    updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, currentFavoriteLabelDesktop, addToFavoritesDesktopPanel);
    updateCurrentFavoriteLabel(data, semesterSelectMobile, facultySelectMobile, courseSelectMobile, currentFavoriteLabelMobile, addToFavoritesMobilePanel);
    
    const mobileConfigPanel = document.getElementById('mobileConfigPanel');
    if (mobileConfigPanel && filterCollapsed) {
      mobileConfigPanel.classList.add('collapsed');
      if (toggleButtonMobile) {
        toggleButtonMobile.setAttribute('aria-expanded', 'false');
        const icon = toggleButtonMobile.querySelector('.toggle-icon');
        if (icon) icon.textContent = 'expand_more';
      }
    }

    renderSchedule(data, activeSource, currentWeekStart, searchQuery, true, showAllEvents);
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        renderSchedule(data, activeSource, currentWeekStart, searchQuery, false, showAllEvents);
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

