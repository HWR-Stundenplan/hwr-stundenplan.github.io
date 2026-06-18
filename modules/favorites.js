import { getFavorites, saveFavorites } from './storage.js';

export function generateFavoriteAbbreviation(semester, faculty, courseTitle) {
  const semNum = semester.replace('semester', '');
  const courseLetter = courseTitle.trim().slice(-1).toUpperCase();
  return `S${semNum} ${faculty} ${courseLetter}`;
}

export function updateCurrentFavoriteLabel(data, semesterSelect, facultySelect, courseSelect, labelElement, addButton) {
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

export function addCurrentToFavorites(data, semesterSelect, facultySelect, courseSelect) {
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

  const existingFavorite = favorites.find(f =>
    f.semester === semester &&
    f.faculty === faculty &&
    f.courseId === courseId
  );

  if (existingFavorite) {
    const filtered = favorites.filter(f => f.id !== existingFavorite.id);
    saveFavorites(filtered);
    return;
  }

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
}

export function deleteFavorite(favoriteId) {
  const favorites = getFavorites();
  const filtered = favorites.filter(f => f.id !== favoriteId);
  saveFavorites(filtered);
}

export function renderFavoritesList(data) {
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

function getPendingDelete() {
  try {
    const pending = localStorage.getItem('st-plan-pending-delete');
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    return [];
  }
}
