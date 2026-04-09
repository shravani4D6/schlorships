import './style.css';
import { categories, scholarships, filterGroups, categoryFilterSpecs, escapeHtml } from './data.js';

const app = document.querySelector('#app');

const statusLabels = {
  live: 'Live Scholarships',
  upcoming: 'Closed Scholarships',
  always: 'Always Open',
};


const categoryLookup = new Map(categories.map((category) => [category.id, category]));
let searchDebounceTimer = null;

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getBrandMonogram(value) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 'SC';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

function getCategoryIcon(categoryId) {
  const iconByCategory = {
    'means-based-scholarship': '💸',
    'merit-based-scholarship': '🏅',
    'girls-scholarship': '👩',
    'school-scholarship': '🏫',
    'college-scholarship': '🎓',
    'international-scholarship': '🌍',
    'minorities-scholarship': '🤝',
    'sports-based-scholarship': '🏆',
  };

  return iconByCategory[categoryId] || '🎯';
}

function createFilterState() {
  return Object.fromEntries(filterGroups.map((group) => [group.id, []]));
}

const state = {
  view: 'home',
  selectedCategory: null,
  selectedPresetId: null,
  selectedScholarshipId: null,
  statusFilter: 'live',
  searchQuery: '',
  detailsTab: 'about',
  expandedContent: {},
  categoryFieldFilters: {},
  categoryFieldFiltersTouched: false,
  activeFilters: createFilterState(),
};

function renderExpandableContent(key, text, maxChars = 320) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '<p>Not provided in the CSV file.</p>';
  }

  if (normalized.length <= maxChars) {
    return `<p>${escapeHtml(normalized)}</p>`;
  }

  const expanded = Boolean(state.expandedContent[key]);
  const compactText = `${normalized.slice(0, maxChars).trim()}...`;

  return `
    <div class="expandable-block">
      <p>${escapeHtml(expanded ? normalized : compactText)}</p>
      <button class="read-toggle-btn" type="button" data-expand-key="${escapeHtml(key)}">${expanded ? 'Read less' : 'Read more'}</button>
    </div>
  `;
}

function getFieldOptions(categoryId, fieldName) {
  const spec = categoryFilterSpecs[categoryId];
  const options = spec?.optionsByField?.[fieldName];
  return options && options.length > 0 ? options : ['Yes', 'No'];
}

function getAutoSelectedOptionForField(categoryId, fieldName) {
  const options = getFieldOptions(categoryId, fieldName);
  const categoryItems = scholarships.filter((item) => item.category === categoryId);

  if (categoryItems.length === 0 || options.length === 0) {
    return [];
  }

  let bestOption = '';
  let bestCount = 0;

  options.forEach((option) => {
    const count = categoryItems.reduce((total, item) => {
      return total + (scholarshipMatchesFieldValue(item, fieldName, option) ? 1 : 0);
    }, 0);

    if (count > bestCount) {
      bestCount = count;
      bestOption = option;
    }
  });

  return bestCount > 0 && bestOption ? [bestOption] : [];
}

function initializeCategoryFieldFilters(categoryId) {
  const fields = categoryFilterSpecs[categoryId]?.fields || [];
  const next = {};

  fields.forEach((fieldName) => {
    next[fieldName] = getAutoSelectedOptionForField(categoryId, fieldName);
  });

  state.categoryFieldFilters = next;
  state.categoryFieldFiltersTouched = false;
}

function applySelectedCategory(categoryId) {
  state.selectedPresetId = null;
  state.selectedCategory = categoryId || null;

  if (!categoryId) {
    state.activeFilters['scholarship-categories'] = [];
    state.categoryFieldFilters = {};
    state.categoryFieldFiltersTouched = false;
    return;
  }

  const categoryName = categoryLookup.get(categoryId)?.name;
  if (categoryName) {
    state.activeFilters['scholarship-categories'] = [categoryName];
  }

  initializeCategoryFieldFilters(categoryId);
}

function applyDatasetPreset(presetId) {
  const preset = datasetPresets.find((item) => item.id === presetId);
  if (!preset) {
    return;
  }

  state.selectedPresetId = preset.id;
  state.selectedCategory = preset.categoryId || null;
  state.selectedScholarshipId = null;
  state.statusFilter = preset.status || 'live';
  state.searchQuery = '';
  state.detailsTab = 'about';
  state.expandedContent = {};
  state.activeFilters = createFilterState();

  if (state.selectedCategory) {
    const categoryName = categoryLookup.get(state.selectedCategory)?.name;
    if (categoryName) {
      state.activeFilters['scholarship-categories'] = [categoryName];
    }
  }

  state.categoryFieldFilters = {};
  Object.entries(preset.fieldFilters || {}).forEach(([fieldName, values]) => {
    state.categoryFieldFilters[fieldName] = Array.isArray(values) ? values.slice() : [];
  });
  state.categoryFieldFiltersTouched = Object.keys(state.categoryFieldFilters).length > 0;

  render();
  window.scrollTo(0, 0);
}

function resetListingState() {
  state.selectedCategory = null;
  state.selectedPresetId = null;
  state.selectedScholarshipId = null;
  state.statusFilter = 'live';
  state.searchQuery = '';
  state.detailsTab = 'about';
  state.categoryFieldFilters = {};
  state.activeFilters = createFilterState();
}

function navigate(view, params = {}) {
  state.view = view;

  if (view === 'home') {
    resetListingState();
  } else {
    if (Object.prototype.hasOwnProperty.call(params, 'category')) {
      applySelectedCategory(params.category);
    }

    if (Object.prototype.hasOwnProperty.call(params, 'id')) {
      state.selectedScholarshipId = params.id;
      state.detailsTab = 'about';
      state.expandedContent = {};
    }
  }

  render();
  window.scrollTo(0, 0);
}

function Header() {
  return `
    <header class="header">
      <div class="logo" id="logo-btn">🎓 Schlorhips</div>
      <nav class="nav-links">
        <a href="#" class="nav-link" id="home-nav">Home</a>
        <a href="#" class="nav-link">About Us</a>
        <a href="#" class="nav-link">Contact</a>
      </nav>
    </header>
  `;
}

function Footer() {
  return `
    <footer class="footer">
      <div class="footer-contact">
        <div class="footer-item">📞 Contact Us - 7997166666</div>
      </div>
      <div class="footer-social">
        <a href="#" class="footer-whatsapp">Connect on WhatsApp</a>
      </div>
    </footer>
  `;
}

function getCategoryCounts(items) {
  return items.reduce((counts, scholarship) => {
    counts[scholarship.category] = (counts[scholarship.category] || 0) + 1;
    return counts;
  }, {});
}

function getTagCounts(items, groupId) {
  return items.reduce((counts, scholarship) => {
    const tags = scholarship.filters[groupId] || [];

    tags.forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });

    return counts;
  }, {});
}

function matchesStatus(scholarship) {
  return scholarship.status === state.statusFilter;
}

function matchesCategory(scholarship) {
  return !state.selectedCategory || scholarship.category === state.selectedCategory;
}

function matchesSearch(scholarship) {
  const query = state.searchQuery.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  const haystack = [
    scholarship.title,
    scholarship.brandName,
    scholarship.summary,
    scholarship.eligibility,
    scholarship.award,
    scholarship.about,
    scholarship.detailedEligibility,
    scholarship.benefits,
    scholarship.howToApply,
    scholarship.deadline,
    scholarship.category,
    ...(scholarship.filters['scholarship-categories'] || []),
    ...(scholarship.filters['location-based'] || []),
    ...(scholarship.filters['course-based-categories'] || []),
  ].join(' ').toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

function scholarshipMatchesFieldValue(scholarship, fieldName, selectedValue) {
  if (!selectedValue) {
    return true;
  }

  const haystack = `${scholarship.title} ${scholarship.summary} ${scholarship.eligibility} ${scholarship.award} ${scholarship.about} ${scholarship.howToApply}`.toLowerCase();
  const value = selectedValue.toLowerCase();

  if (fieldName === 'Gender' && value === 'girls/women') {
    return /(girl|female|women|kanya)/.test(haystack);
  }

  if (fieldName.includes('(Yes/No)') || selectedValue === 'Yes' || selectedValue === 'No') {
    const positive = /(yes|required|must|eligible)/.test(haystack);
    return selectedValue === 'Yes' ? positive : !positive;
  }

  if (fieldName === 'State / Location' && value === 'all india') {
    return /(india|indian|all states|nationwide)/.test(haystack);
  }

  return haystack.includes(value);
}

function matchesCategoryFieldFilters(scholarship) {
  if (!state.categoryFieldFiltersTouched) {
    return true;
  }

  const fields = Object.entries(state.categoryFieldFilters || {});
  if (fields.length === 0) {
    return true;
  }

  return fields.every(([fieldName, selectedValues]) => {
    if (!Array.isArray(selectedValues) || selectedValues.length === 0) {
      return true;
    }

    return selectedValues.some((value) => scholarshipMatchesFieldValue(scholarship, fieldName, value));
  });
}

function matchesFilters(scholarship) {
  return filterGroups.every((group) => {
    const selectedValues = state.activeFilters[group.id] || [];

    if (selectedValues.length === 0) {
      return true;
    }

    const availableValues = scholarship.filters[group.id] || [];
    return selectedValues.some((value) => availableValues.includes(value));
  });
}

function inferScholarshipTopic(scholarship) {
  const text = [
    scholarship.title,
    scholarship.eligibility,
    scholarship.about,
    scholarship.detailedEligibility,
    scholarship.benefits,
  ].join(' ').toLowerCase();

  if (/(girl|women|female|kanya)/.test(text)) {
    return 'Women and Girls';
  }

  if (/(minority|muslim|christian|sikh|jain|buddhist|parsi)/.test(text)) {
    return 'Minority Students';
  }

  if (/(sport|athlete|player|medal)/.test(text)) {
    return 'Sports Students';
  }

  if (/(international|abroad|overseas|foreign)/.test(text)) {
    return 'International Study';
  }

  if (/(class\s*(8|9|10|11|12)|school|pre-?matric)/.test(text)) {
    return 'School Students';
  }

  if (/(undergraduate|ug|bachelor|college|diploma)/.test(text)) {
    return 'Undergraduate Students';
  }

  if (/(postgraduate|pg|master|phd|doctorate|research)/.test(text)) {
    return 'Postgraduate and Research';
  }

  if (/(income|economically|ews|means)/.test(text)) {
    return 'Need-Based Support';
  }

  if (/(merit|rank|percentage|academic)/.test(text)) {
    return 'Merit-Based Support';
  }

  return 'General Eligibility';
}

function compactCardText(value, maxLength = 52) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return 'Not specified';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function formatCardDeadline(value) {
  if (!value) {
    return 'Open';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
}

function renderHowToApplySteps(scholarship) {
  const steps = scholarship.howToApplySteps || [];
  if (steps.length === 0) {
    return `<p>${escapeHtml(scholarship.howToApply || 'Use the official scholarship link for application instructions.')}</p>`;
  }

  return `
    <ol class="apply-steps">
      ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
    </ol>
  `;
}

function getFilteredScholarships() {
  return scholarships.filter((scholarship) => matchesStatus(scholarship) && matchesCategory(scholarship) && matchesFilters(scholarship) && matchesSearch(scholarship) && matchesCategoryFieldFilters(scholarship));
}

function getBaseFilteredScholarships() {
  return scholarships.filter((scholarship) => matchesCategory(scholarship) && matchesFilters(scholarship) && matchesSearch(scholarship) && matchesCategoryFieldFilters(scholarship));
}

function renderCountBadge(count) {
  return `<span class="count-badge">${count}</span>`;
}

function HomeView() {
  const cards = categories
    .map((category) => `
      <div class="category-card" data-id="${category.id}">
        <img src="${category.image}" class="category-image" alt="${escapeHtml(category.name)}">
        <div class="category-title category-title--simple">
          <div>${escapeHtml(category.name)}</div>
        </div>
      </div>
    `)
    .join('');

  return `
    <main class="view-container">
      <div class="category-grid">
        ${cards}
      </div>
    </main>
  `;
}

function renderActiveChips() {
  const chips = [];

  if (state.selectedCategory) {
    const category = categoryLookup.get(state.selectedCategory);
    chips.push(`<span class="filter-chip filter-chip--category">Category: ${escapeHtml(category?.name || state.selectedCategory)}</span>`);
  }

  filterGroups.forEach((group) => {
    if (group.id === 'scholarship-categories') {
      return;
    }

    const values = state.activeFilters[group.id] || [];

    values.forEach((value) => {
      chips.push(`<span class="filter-chip">${escapeHtml(group.label)}: ${escapeHtml(value)}</span>`);
    });
  });

  if (state.statusFilter !== 'live') {
    chips.push(`<span class="filter-chip">Status: ${escapeHtml(statusLabels[state.statusFilter] || state.statusFilter)}</span>`);
  }

  return chips.length > 0
    ? `<div class="active-chips">${chips.join('')}</div>`
    : '';
}

function ListingView() {
  const filtered = getFilteredScholarships();
  const baseFiltered = getBaseFilteredScholarships();
  const statusCounts = {
    live: baseFiltered.filter((item) => item.status === 'live').length,
    upcoming: baseFiltered.filter((item) => item.status === 'upcoming').length,
    always: baseFiltered.filter((item) => item.status === 'always').length,
  };

  const sidebarCategoryId = state.selectedCategory || categories[0]?.id || null;
  const activeCategorySpec = categoryFilterSpecs[sidebarCategoryId] || { fields: [], optionsByField: {} };
  const activeCategoryFields = activeCategorySpec.fields || [];

  const sidebarContent = activeCategoryFields.length > 0
    ? activeCategoryFields.map((fieldName, index) => {
      const isExpanded = index === 0;
      const fieldId = encodeURIComponent(fieldName);
      const options = getFieldOptions(sidebarCategoryId, fieldName);

      return `
        <div class="accordion-item">
          <button class="accordion-header ${isExpanded ? 'expanded' : ''}" type="button" data-accordion-toggle="${fieldId}">
            <span class="accordion-label">Select ${escapeHtml(fieldName)}</span>
            <span class="accordion-toggle-icon">▼</span>
          </button>
          <div class="accordion-content ${isExpanded ? 'expanded' : ''}" data-accordion-content="${fieldId}">
            ${options.map((option) => {
              const selected = state.categoryFieldFilters[fieldName] || [];
              const checked = selected.includes(option) ? 'checked' : '';

              return `
                <label class="filter-option">
                  <input type="checkbox" data-field-option="${fieldId}" data-option="${escapeHtml(option)}" ${checked}>
                  <span>${escapeHtml(option)}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('')
    : '<div class="empty-state">No XLSX filter logic found for this category.</div>';

  const categoryCards = categories.map((category) => `
    <div class="mini-cat-card ${state.selectedCategory === category.id ? 'active' : ''}" data-id="${category.id}">
      <div class="mini-cat-title">${escapeHtml(category.name)}</div>
    </div>
  `).join('');

  const resultCards = filtered.length > 0
    ? filtered.map((scholarship, index) => {
        const pastelClass = `scholarship-card--pastel-${index % 6}`;
        const brandName = scholarship.brandName || categoryLookup.get(scholarship.category)?.name || 'Scholarship';
        const brandMonogram = getBrandMonogram(brandName);

        return `
          <div class="scholarship-card ${pastelClass}" data-id="${scholarship.id}">
            <div class="scholarship-info">
              <div class="scholarship-card-head">
                <div class="deadline-top">
                  <span class="deadline-top-label">Deadline</span>
                  <span class="deadline-top-value">📅 ${escapeHtml(scholarship.deadline || 'Open')}</span>
                </div>
              </div>
              <h3>${escapeHtml(scholarship.title)}</h3>
              <div class="info-row">
                <span class="info-row-icon" aria-hidden="true">🏆</span>
                <div class="info-row-body">
                  <div class="info-row-label">Award</div>
                  <div class="info-row-value">${escapeHtml(scholarship.award || 'Varies')}</div>
                </div>
              </div>
              <div class="info-row">
                <span class="info-row-icon" aria-hidden="true">🎓</span>
                <div class="info-row-body">
                  <div class="info-row-label">Eligibility</div>
                  <div class="info-row-value">${escapeHtml(scholarship.eligibility || 'As per guidelines')}</div>
                </div>
              </div>
              <div class="scholarship-card-footer">
                <span class="deadline-label">Last Updated</span>
                <span class="deadline-value">${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')
    : `<div class="empty-state">No scholarships matched the current filters.</div>`;

  return `
    <main class="view-container">
      <div class="search-row">
        <span class="search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79L20 21.49 21.49 20l-5.99-6zM10 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
          </svg>
        </span>
        <input id="scholarship-search" class="search-input" type="text" placeholder="Search scholarships by name, brand, award, eligibility..." value="${escapeHtml(state.searchQuery)}" />
        ${state.searchQuery.trim() ? '<button id="clear-search-btn" class="search-clear-btn" type="button" aria-label="Clear search">Clear</button>' : ''}
      </div>

      <div class="intermediate-page-header intermediate-page-header--top">
         <h2>Scholarship Categories</h2>
         <div class="category-matrix">
           ${categoryCards}
         </div>
      </div>

      <div class="listing-layout">
        <aside class="sidebar">
          <div class="filter-header-row">
            <div class="filter-logic-title">Filters</div>
            <button class="clear-filters" id="clear-filters-btn" type="button">Reset All</button>
          </div>
          <div class="filter-accordion">
            ${sidebarContent}
          </div>
        </aside>

        <section class="listing-content">
          <div class="status-tabs-container">
             <div class="status-tab ${state.statusFilter === 'live' ? 'active' : ''}" data-status="live">${escapeHtml(statusLabels.live)} <strong>${statusCounts.live}</strong></div>
             <div class="status-tab ${state.statusFilter === 'upcoming' ? 'active' : ''}" data-status="upcoming">${escapeHtml(statusLabels.upcoming)} <strong>${statusCounts.upcoming}</strong></div>
             <div class="status-tab ${state.statusFilter === 'always' ? 'active' : ''}" data-status="always">${escapeHtml(statusLabels.always)} <strong>${statusCounts.always}</strong></div>
          </div>

          ${renderActiveChips()}

          <div class="results-header">
             <h2>Found ${filtered.length} Scholarships</h2>
          </div>

          <div class="scholarship-list">
            ${resultCards}
          </div>
        </section>
      </div>
    </main>
  `;
}

function DetailsView() {
  const scholarship = scholarships.find((item) => item.id === state.selectedScholarshipId);

  if (!scholarship) {
    return '<div class="empty-state">Scholarship not found.</div>';
  }

  const categoryName = categoryLookup.get(scholarship.category)?.name || scholarship.category;
  const bannerSummary = compactCardText(scholarship.summary || scholarship.about || scholarship.eligibility || 'Explore scholarship details, eligibility, and application guidance.', 110);
  const scholarshipTopic = inferScholarshipTopic(scholarship);
  const faqItems = [
    { question: 'Who can apply?', answer: scholarship.eligibility || 'Check the eligibility section above.' },
    { question: 'What are the benefits?', answer: scholarship.benefits || scholarship.award || 'Benefits are listed in the scholarship details.' },
    { question: 'How do I apply?', answer: scholarship.howToApply || 'Follow the official application process for this scholarship.' },
  ];

  const pageTabs = `
    <div class="details-tab-row">
      <button class="details-tab ${state.detailsTab === 'about' ? 'details-tab--active' : ''}" data-target="about" type="button">About Program</button>
      <button class="details-tab ${state.detailsTab === 'scholarships' ? 'details-tab--active' : ''}" data-target="scholarships" type="button">Scholarships</button>
      <button class="details-tab ${state.detailsTab === 'faqs' ? 'details-tab--active' : ''}" data-target="faqs" type="button">FAQ's</button>
      <button class="details-tab ${state.detailsTab === 'contact' ? 'details-tab--active' : ''}" data-target="contact" type="button">Contact Details</button>
      <button class="details-tab ${state.detailsTab === 'apply' ? 'details-tab--active' : ''}" data-target="apply" type="button">Apply Now</button>
    </div>
  `;

  const supportTypeText = (scholarship.filters.benefit || []).join(', ') || 'Not specified';

  const detailCards = [
    { label: 'Topic', icon: '🧭', value: scholarshipTopic, fullValue: scholarshipTopic },
    { label: 'Deadline', icon: '📅', value: scholarship.deadlineDisplay || formatCardDeadline(scholarship.deadline), fullValue: scholarship.deadlineDisplay || scholarship.deadline || 'Open' },
    { label: 'Award', icon: '🏆', value: compactCardText(scholarship.award || 'Varies', 45), fullValue: scholarship.award || 'Varies' },
    { label: 'Eligibility', icon: '🎓', value: compactCardText(scholarship.eligibility || 'See scholarship details', 58), fullValue: scholarship.eligibility || 'See scholarship details' },
    { label: 'Support Type', icon: '🧾', value: compactCardText(supportTypeText, 46), fullValue: supportTypeText },
  ];

  const bannerCardMarkup = `
    <div class="banner-info-card">
      <div class="banner-info-card__glow" aria-hidden="true"></div>
      <div class="banner-info-card__header">
        <span class="banner-info-card__title">Key Information</span>
        <span class="banner-info-card__tag">5 points</span>
      </div>
      <div class="banner-info-card__list">
        ${detailCards.map((card) => `
          <div class="banner-info-card__item">
            <span class="banner-info-card__icon" aria-hidden="true">${card.icon}</span>
            <span class="banner-info-card__label">${escapeHtml(card.label)}</span>
            <span class="banner-info-card__value" title="${escapeHtml(card.fullValue)}">${escapeHtml(card.value)}</span>
            <span class="banner-info-card__popup" role="tooltip">${escapeHtml(card.fullValue)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  return `
    <main class="view-container">
      <div class="details-banner">
        <div class="details-banner-copy">
          <p class="eyebrow">${escapeHtml(categoryName)}</p>
          <h1>${escapeHtml(scholarship.title)}</h1>
          <p class="details-banner-tagline">${escapeHtml(bannerSummary)}</p>
          <div class="details-banner-meta">
            <span class="details-meta-pill">${escapeHtml(scholarshipTopic)}</span>
            <span class="details-meta-pill">${escapeHtml(scholarship.deadlineDisplay || scholarship.deadline || 'Open deadline')}</span>
          </div>
        </div>
        <div class="details-banner-visual" aria-hidden="true">
          ${bannerCardMarkup}
        </div>
      </div>

      ${pageTabs}

      <section class="content-section" id="section-about">
        <div class="details-block">
          <h2 class="section-title">About The Scholarship</h2>
          ${renderExpandableContent('about', scholarship.about || scholarship.summary, 380)}
        </div>

        <div class="details-block">
          <h3>Topic</h3>
          <p>${escapeHtml(scholarshipTopic)}</p>
        </div>

        <div class="details-block">
          <h3>Detailed Eligibility</h3>
          ${renderExpandableContent('detailed-eligibility', scholarship.detailedEligibility || scholarship.eligibility || 'Not provided in the CSV file.', 360)}
        </div>

        <div class="details-block">
          <h3>Benefits</h3>
          ${renderExpandableContent('benefits', scholarship.benefits || scholarship.award || 'Not provided in the CSV file.', 320)}
        </div>

        <div class="details-block">
          <h3>How To Apply</h3>
          ${renderHowToApplySteps(scholarship)}
        </div>

        <section class="details-subsection" id="section-faqs">
          <h3>FAQs</h3>
          ${faqItems.map((item) => `
            <div class="faq-item">
              <h4>${escapeHtml(item.question)}</h4>
              <p>${escapeHtml(item.answer)}</p>
            </div>
          `).join('')}
        </section>

        <section class="details-subsection" id="section-contact">
          <h3>Contact Details</h3>
          <p><strong>Brand:</strong> ${escapeHtml(scholarship.brandName || categoryName)}</p>
          <p><strong>Reference Link:</strong> ${escapeHtml(scholarship.link || 'Not available')}</p>
        </section>

        <section class="details-subsection" id="section-apply">
          <h3>Apply Now</h3>
          ${renderHowToApplySteps(scholarship)}
          <div class="details-actions">
            <button class="details-link details-link--primary" type="button">Save Scholarship</button>
            <button class="details-link details-link--secondary" type="button">Get Application Guidance</button>
          </div>
        </section>
      </section>
    </main>
  `;
}

function render() {
  let viewContent = '';

  if (state.view === 'home') {
    viewContent = HomeView();
  } else if (state.view === 'listing') {
    viewContent = ListingView();
  } else if (state.view === 'details') {
    viewContent = DetailsView();
  }

  app.innerHTML = `
    ${Header()}
    ${viewContent}
    ${Footer()}
  `;

  attachEventListeners();
}

function updateFilter(groupId, option, checked) {
  state.selectedPresetId = null;
  const current = new Set(state.activeFilters[groupId] || []);

  if (checked) {
    current.add(option);
  } else {
    current.delete(option);
  }

  state.activeFilters[groupId] = Array.from(current);
  render();
}

function updateCategoryFieldFilter(fieldName, option, checked) {
  state.selectedPresetId = null;
  state.categoryFieldFiltersTouched = true;

  const current = new Set(state.categoryFieldFilters[fieldName] || []);

  if (checked) {
    current.add(option);
  } else {
    current.delete(option);
  }

  state.categoryFieldFilters[fieldName] = Array.from(current);
  render();
}

function clearFilters() {
  state.selectedPresetId = null;
  state.statusFilter = 'live';
  state.searchQuery = '';
  state.activeFilters = createFilterState();
  state.categoryFieldFiltersTouched = false;

  if (state.selectedCategory) {
    const categoryName = categoryLookup.get(state.selectedCategory)?.name;
    if (categoryName) {
      state.activeFilters['scholarship-categories'] = [categoryName];
    }

    Object.keys(state.categoryFieldFilters).forEach((fieldName) => {
      state.categoryFieldFilters[fieldName] = [];
    });
  } else {
    state.categoryFieldFilters = {};
  }

  render();
}

function attachEventListeners() {
  document.querySelector('#logo-btn')?.addEventListener('click', () => navigate('home'));
  document.querySelector('#home-nav')?.addEventListener('click', (event) => {
    event.preventDefault();
    navigate('home');
  });

  document.querySelectorAll('.category-card').forEach((card) => {
    card.addEventListener('click', () => {
      navigate('listing', { category: card.dataset.id });
    });
  });



  document.querySelectorAll('.status-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.selectedPresetId = null;
      state.statusFilter = tab.dataset.status;
      render();
    });
  });

  document.querySelectorAll('.mini-cat-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.selectedPresetId = null;
      applySelectedCategory(card.dataset.id);
      render();
    });
  });

  document.querySelectorAll('.filter-option input[type="checkbox"]').forEach((input) => {
    if (input.dataset.fieldOption) {
      return;
    }

    input.addEventListener('change', () => {
      updateFilter(input.dataset.group, input.dataset.option, input.checked);
    });
  });

  document.querySelectorAll('input[data-field-option]').forEach((input) => {
    input.addEventListener('change', () => {
      const fieldName = decodeURIComponent(input.dataset.fieldOption);
      updateCategoryFieldFilter(fieldName, input.dataset.option, input.checked);
    });
  });

  document.querySelectorAll('[data-accordion-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const groupId = button.dataset.accordionToggle;
      const isCurrentlyExpanded = button.classList.contains('expanded');

      document.querySelectorAll('[data-accordion-toggle]').forEach((otherButton) => {
        otherButton.classList.remove('expanded');
      });

      document.querySelectorAll('[data-accordion-content]').forEach((otherContent) => {
        otherContent.classList.remove('expanded');
      });

      if (!isCurrentlyExpanded) {
        button.classList.add('expanded');
        const content = document.querySelector(`[data-accordion-content="${groupId}"]`);
        if (content) {
          content.classList.add('expanded');
        }
      }
    });
  });

  document.querySelector('#clear-filters-btn')?.addEventListener('click', () => {
    clearFilters();
  });

  document.querySelector('#scholarship-search')?.addEventListener('input', (event) => {
    const value = event.target.value;
    const cursorPosition = event.target.selectionStart ?? value.length;

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = setTimeout(() => {
      state.searchQuery = value;
      render();

      const refreshedInput = document.querySelector('#scholarship-search');
      if (refreshedInput) {
        refreshedInput.focus();
        const safePosition = Math.min(cursorPosition, refreshedInput.value.length);
        refreshedInput.setSelectionRange(safePosition, safePosition);
      }
    }, 120);
  });

  document.querySelector('#clear-search-btn')?.addEventListener('click', () => {
    state.searchQuery = '';
    render();

    const refreshedInput = document.querySelector('#scholarship-search');
    if (refreshedInput) {
      refreshedInput.focus();
    }
  });

  document.querySelectorAll('.scholarship-card').forEach((card) => {
    card.addEventListener('click', () => {
      navigate('details', { id: card.dataset.id });
    });
  });

  document.querySelectorAll('.details-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      state.detailsTab = target;
      render();

      const targetSection = document.querySelector(`#section-${target}`);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  document.querySelectorAll('[data-expand-key]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.expandKey;
      state.expandedContent[key] = !state.expandedContent[key];
      render();
    });
  });

}

render();
