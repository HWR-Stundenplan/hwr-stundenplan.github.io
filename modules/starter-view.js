import { initializeSchanzenDropdown } from './dropdown.js';
import { populateFaculties, populateCourses } from './filter.js';
import { generateFavoriteAbbreviation } from './favorites.js';
import { markStarterViewCompleted } from './storage.js';
import { setCookie } from './storage.js';

export function initializeStarterView(data, maxSemester, cacheKey) {
  const modal = document.getElementById('starterViewModal');
  if (!modal) return;

  modal.classList.remove('hidden');
  // Block body scroll when modal is open
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');

  const semesterSelect = document.getElementById('starterSemesterSelect');
  const facultySelect = document.getElementById('starterFacultySelect');
  const courseSelect = document.getElementById('starterCourseSelect');
  const submitButton = document.getElementById('starterViewSubmit');

  if (!semesterSelect || !facultySelect || !courseSelect || !submitButton) return;

  const semesterOptions = Array.from({ length: maxSemester }, (_, index) => `semester${index + 1}`);
  semesterSelect.innerHTML = semesterOptions.map((semester, index) => `<option value="${semester}">Semester ${index + 1}</option>`).join('');

  const updateSemesterDropdown = initializeSchanzenDropdown('starter-semester', 'starterSemesterSelect', 'starterSemesterOptions');
  const updateFacultyDropdown = initializeSchanzenDropdown('starter-faculty', 'starterFacultySelect', 'starterFacultyOptions');
  const updateCourseDropdown = initializeSchanzenDropdown('starter-course', 'starterCourseSelect', 'starterCourseOptions');

  semesterSelect.addEventListener('change', () => {
    populateFaculties(semesterSelect, facultySelect, data);
    updateFacultyDropdown();
    courseSelect.innerHTML = '';
    updateCourseDropdown();
    updateSubmitButton();
  });

  facultySelect.addEventListener('change', () => {
    populateCourses(courseSelect, semesterSelect, facultySelect, data);
    updateCourseDropdown();
    updateSubmitButton();
  });

  courseSelect.addEventListener('change', () => {
    updateSubmitButton();
  });

  function updateSubmitButton() {
    const isValid = semesterSelect.value && facultySelect.value && courseSelect.value;
    submitButton.disabled = !isValid;
  }

  submitButton.addEventListener('click', () => {
    const semester = semesterSelect.value;
    const faculty = facultySelect.value;
    const courseId = courseSelect.value;

    if (!semester || !faculty || !courseId) return;

    const selection = {
      semester: semester,
      faculty: faculty,
      courseId: courseId,
    };
    const payload = JSON.stringify(selection);
    try {
      localStorage.setItem(cacheKey, payload);
    } catch (error) {
      setCookie(cacheKey, encodeURIComponent(payload), 365);
    }

    const course = data.schedules.find(s => s.id === courseId);
    if (course) {
      const favorites = getFavorites();
      const abbreviation = generateFavoriteAbbreviation(semester, faculty, course.title);
      const newFavorite = {
        id: Date.now().toString(),
        semester: semester,
        faculty: faculty,
        courseId: courseId,
        abbreviation: abbreviation,
        createdAt: new Date().toISOString()
      };
      favorites.push(newFavorite);
      saveFavorites(favorites);
    }

    markStarterViewCompleted();

    modal.classList.add('hidden');
    // Restore body scroll when modal is closed
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    location.reload();
  });
}

function getFavorites() {
  try {
    const favorites = localStorage.getItem('st-plan-favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    return [];
  }
}

function saveFavorites(favorites) {
  try {
    localStorage.setItem('st-plan-favorites', JSON.stringify(favorites));
  } catch (error) {
    console.warn('Failed to save favorites:', error);
  }
}
