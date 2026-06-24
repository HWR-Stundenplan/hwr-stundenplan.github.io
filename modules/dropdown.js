import { STUDY_PROGRAMS } from './config.js';

// Global function to initialize Schanzen dropdowns
export function initializeSchanzenDropdown(dropdownId, selectId, optionsId) {
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

  const isFacultyDropdown = dropdownId.includes('faculty');

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
        const tooltipName = opt.fullName === 'Dienstleistungsmanagement' ? 'Dienstleistungs-<br>management' : opt.fullName;
        return `
          <button type="button" class="schanzen-dropdown-option ${opt.selected ? 'selected' : ''}" data-value="${opt.value}">
            <span class="study-program-full">${opt.fullName}</span>
            <span class="study-program-abbreviated">${opt.abbreviation}</span>
            <span class="study-program-info-icon">
              <span class="material-symbols-outlined">info</span>
              <span class="study-program-tooltip">${tooltipName}</span>
            </span>
          </button>
        `;
      } else {
        return `
          <button type="button" class="schanzen-dropdown-option ${opt.selected ? 'selected' : ''}" data-value="${opt.value}">
            ${opt.text}
          </button>
        `;
      }
    }).join('');

    const selectedOption = select.options[select.selectedIndex];
    valueDisplay.textContent = selectedOption ? selectedOption.textContent : 'Bitte wählen...';
  }

  function toggleDropdown(e) {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');

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
    } else {
      dropdown.classList.add('open');
      if (dropdownMenu) {
        dropdownMenu.style.display = 'block';
        dropdownMenu.style.opacity = '1';
        dropdownMenu.style.pointerEvents = 'auto';
        dropdownMenu.style.overflow = 'auto';
        // Set max-height to show approximately 6.5 items for scrollability
        dropdownMenu.style.maxHeight = '290px';
      }
      if (optionsContainer) {
        optionsContainer.style.overflow = 'visible';
        optionsContainer.style.maxHeight = 'none';
      }

      if (isFacultyDropdown) {
        setTimeout(() => {
          const studyProgramOptions = optionsContainer.querySelectorAll('.schanzen-dropdown-option');
          studyProgramOptions.forEach(option => {
            const fullNameSpan = option.querySelector('.study-program-full');
            if (fullNameSpan) {
              const scrollWidth = fullNameSpan.scrollWidth;
              const clientWidth = fullNameSpan.clientWidth;
              if (scrollWidth > clientWidth) {
                option.classList.add('too-narrow');
              } else {
                option.classList.remove('too-narrow');
              }
            }
          });

          const infoIcons = optionsContainer.querySelectorAll('.study-program-info-icon');
          infoIcons.forEach(icon => {
            icon.addEventListener('mouseenter', () => {
              const tooltip = icon.querySelector('.study-program-tooltip');
              if (!tooltip) return;

              const iconRect = icon.getBoundingClientRect();
              const tooltipRect = tooltip.getBoundingClientRect();
              const spaceAbove = iconRect.top;
              const spaceBelow = window.innerHeight - iconRect.bottom;

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

  function handleOptionClick(e) {
    const optionBtn = e.target.closest('.schanzen-dropdown-option');
    if (!optionBtn) return;

    e.stopPropagation();
    const value = optionBtn.dataset.value;
    select.value = value;

    optionsContainer.querySelectorAll('.schanzen-dropdown-option').forEach(btn => {
      btn.classList.remove('selected');
    });
    optionBtn.classList.add('selected');

    valueDisplay.textContent = optionBtn.textContent;

    dropdown.classList.remove('open');
    if (dropdownMenu) {
      dropdownMenu.style.display = 'none';
      dropdownMenu.style.opacity = '0';
      dropdownMenu.style.pointerEvents = 'none';
    }

    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

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

  if (!container.hasAttribute('data-dropdown-initialized')) {
    container.setAttribute('data-dropdown-initialized', 'true');
    
    dropdown.addEventListener('click', toggleDropdown);
    dropdown.addEventListener('touchstart', (e) => {
    }, { passive: true });
    
    optionsContainer.addEventListener('click', handleOptionClick);
    optionsContainer.addEventListener('touchstart', (e) => {
      const optionBtn = e.target.closest('.schanzen-dropdown-option');
      if (optionBtn) {
        e.preventDefault();
        handleOptionClick(e);
      }
    }, { passive: false });
    
    document.addEventListener('click', handleOutsideClick);
  }

  updateOptions();
  select.addEventListener('change', updateOptions);

  return updateOptions;
}
