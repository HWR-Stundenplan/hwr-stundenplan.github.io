// Configuration constants
export const FILTER_COLLAPSED_KEY = 'st-plan-filter-collapsed';
export const FILTER_SEEN_KEY = 'st-plan-filter-seen';
export const SCHEDULE_CACHE_KEY = 'st-plan-schedule-cache';
export const SCHEDULE_CACHE_TIMESTAMP_KEY = 'st-plan-schedule-cache-timestamp';
export const PROGRESS_LABEL_KEY = 'st-plan-progress-label';
export const FAVORITES_KEY = 'st-plan-favorites';
export const PENDING_DELETE_KEY = 'st-plan-pending-delete';
export const DAILY_VISIT_KEY = 'st-plan-daily-visit';
export const SHOW_ALL_EVENTS_KEY = 'st-plan-show-all-events';
export const DARK_MODE_KEY = 'st-plan-dark-mode';
export const STARTER_VIEW_COMPLETED_KEY = 'st-plan-starter-completed';
export const CACHE_EXPIRY_HOURS = 24;

// Study program abbreviation mapping
export const STUDY_PROGRAMS = {
  'wi': 'Wirtschaftsinformatik',
  'dl': 'Dienstleistungsmanagement',
  'fm': 'Facility Management',
  'IBA': 'International Business Administration',
  'ppm': 'Projekt- und Prozessmanagement',
  'IP': 'Intellectual Property'
};

// Global state
export let filterCollapsed = false;
export let hasInitialScrollOccurred = false;
export let showProgressLabel = false;
export let shouldAnimateProgress = false;
export let showAllEvents = false;
export let isDarkMode = false;
