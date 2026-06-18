import { DARK_MODE_KEY } from './config.js';

let isDarkMode = false;

export function initializeDarkMode() {
  const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
  
  if (savedDarkMode !== null) {
    isDarkMode = savedDarkMode === 'true';
  } else {
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  applyDarkMode();
}

export function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
  applyDarkMode();
}

function applyDarkMode() {
  const html = document.documentElement;
  const mobileToggle = document.getElementById('darkModeToggleMobile');
  
  if (isDarkMode) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  
  const icon = isDarkMode ? 'light_mode' : 'dark_mode';
  
  if (mobileToggle) {
    mobileToggle.querySelector('.material-symbols-outlined').textContent = icon;
  }
}
