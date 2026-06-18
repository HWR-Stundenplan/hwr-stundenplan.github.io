import {
  FILTER_COLLAPSED_KEY,
  FILTER_SEEN_KEY,
  SCHEDULE_CACHE_KEY,
  SCHEDULE_CACHE_TIMESTAMP_KEY,
  CACHE_EXPIRY_HOURS,
  DAILY_VISIT_KEY,
  STARTER_VIEW_COMPLETED_KEY,
  SHOW_ALL_EVENTS_KEY,
  FAVORITES_KEY,
  PENDING_DELETE_KEY
} from './config.js';

// Daily visit tracking
export function hasVisitedToday() {
  const todayKey = getLocalDateKey(new Date());
  const lastVisit = localStorage.getItem(DAILY_VISIT_KEY);
  return lastVisit === todayKey;
}

export function markDailyVisit() {
  const todayKey = getLocalDateKey(new Date());
  localStorage.setItem(DAILY_VISIT_KEY, todayKey);
}

// Starter view
export function isStarterViewNeeded() {
  const starterCompleted = localStorage.getItem(STARTER_VIEW_COMPLETED_KEY);
  const cacheKey = 'st-plan-selection-v1';

  console.log('[Starter View Debug] Checking if starter view is needed...');
  console.log('[Starter View Debug] STARTER_VIEW_COMPLETED_KEY:', starterCompleted);
  console.log('[Starter View Debug] cacheKey:', cacheKey);

  if (starterCompleted === 'true') {
    console.log('[Starter View Debug] Starter view already completed, returning false');
    return false;
  }

  const cachedSelection = localStorage.getItem(cacheKey);
  console.log('[Starter View Debug] cachedSelection from localStorage:', cachedSelection);
  if (cachedSelection) {
    try {
      const parsed = JSON.parse(cachedSelection);
      console.log('[Starter View Debug] Parsed cached selection:', parsed);
      if (parsed && parsed.semester && parsed.faculty && parsed.courseId) {
        console.log('[Starter View Debug] Valid cached selection found, returning false');
        return false;
      }
    } catch (e) {
      console.log('[Starter View Debug] Error parsing cached selection:', e);
    }
  }

  const cookieSelection = getCookie(cacheKey);
  console.log('[Starter View Debug] cookieSelection:', cookieSelection);
  if (cookieSelection) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookieSelection));
      console.log('[Starter View Debug] Parsed cookie selection:', parsed);
      if (parsed && parsed.semester && parsed.faculty && parsed.courseId) {
        console.log('[Starter View Debug] Valid cookie selection found, returning false');
        return false;
      }
    } catch (e) {
      console.log('[Starter View Debug] Error parsing cookie selection:', e);
    }
  }

  const favorites = getFavorites();
  console.log('[Starter View Debug] favorites:', favorites);
  console.log('[Starter View Debug] favorites.length:', favorites ? favorites.length : 0);
  if (favorites && favorites.length > 0) {
    console.log('[Starter View Debug] Favorites found, returning false');
    return false;
  }

  console.log('[Starter View Debug] No cached data found, starter view needed, returning true');
  return true;
}

export function markStarterViewCompleted() {
  localStorage.setItem(STARTER_VIEW_COMPLETED_KEY, 'true');
}

// Filter state
export function getInitialFilterCollapsed() {
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

// Schedule caching
export function cacheScheduleData(data) {
  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(SCHEDULE_CACHE_KEY, payload);
    localStorage.setItem(SCHEDULE_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to cache schedule data:', error);
  }
}

export function getCachedScheduleData() {
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

// Show all events preference
export function loadShowAllEventsPreference() {
  return localStorage.getItem(SHOW_ALL_EVENTS_KEY) === 'true';
}

export function saveShowAllEventsPreference(value) {
  localStorage.setItem(SHOW_ALL_EVENTS_KEY, String(value));
}

// Favorites management
export function getFavorites() {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.warn('Failed to get favorites:', error);
    return [];
  }
}

export function saveFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.warn('Failed to save favorites:', error);
  }
}

// Pending delete management
export function getPendingDelete() {
  try {
    const pending = localStorage.getItem(PENDING_DELETE_KEY);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.warn('Failed to get pending delete:', error);
    return [];
  }
}

export function savePendingDelete(pending) {
  try {
    localStorage.setItem(PENDING_DELETE_KEY, JSON.stringify(pending));
  } catch (error) {
    console.warn('Failed to save pending delete:', error);
  }
}

export function addToPendingDelete(favoriteId) {
  const pending = getPendingDelete();
  if (!pending.includes(favoriteId)) {
    pending.push(favoriteId);
    savePendingDelete(pending);
  }
}

export function removeFromPendingDelete(favoriteId) {
  const pending = getPendingDelete();
  const filtered = pending.filter(id => id !== favoriteId);
  savePendingDelete(filtered);
}

export function isPendingDelete(favoriteId) {
  const pending = getPendingDelete();
  return pending.includes(favoriteId);
}

export function processPendingDelete(data) {
  const pending = getPendingDelete();
  const favorites = getFavorites();
  const filtered = favorites.filter(f => !pending.includes(f.id));
  
  if (filtered.length !== favorites.length) {
    saveFavorites(filtered);
    savePendingDelete([]);
  }
}

// Cookie helpers
export function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export function getCookie(name) {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// Helper function (will be imported from utils.js)
function getLocalDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
