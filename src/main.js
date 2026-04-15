import './style.css';
import { categories, scholarships, filterGroups, categoryFilterSpecs, escapeHtml } from './data.js';

const app = document.querySelector('#app');

function getScholarshipLogoUrl(scholarship) {
  const fileName = String(scholarship.logoFileName || '').trim();
  return fileName ? `/logos/${encodeURIComponent(fileName)}` : '/logos/_default_logo.png';
}

const statusLabels = {
  live: 'Live Scholarships',
  upcoming: 'Closed Scholarships',
  always: 'Always Open',
};

const savedScholarshipsStorageKey = 'savedScholarshipIds';


const categoryLookup = new Map(categories.map((category) => [category.id, category]));
let searchDebounceTimer = null;

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getListingPath() {
  return '/scholarships';
}

function getScholarshipDetailPath(scholarshipId) {
  return `/scholarships/${encodeURIComponent(String(scholarshipId || ''))}`;
}

function normalizePathname(pathname) {
  const trimmed = String(pathname || '').replace(/\/+$/, '');
  return trimmed || '/';
}

function getRouteFromLocation() {
  const pathname = normalizePathname(window.location.pathname);
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { view: 'home' };
  }

  if (segments[0] !== 'scholarships') {
    return { view: 'home' };
  }

  if (segments.length === 1) {
    return { view: 'listing' };
  }

  return {
    view: 'details',
    scholarshipId: decodeURIComponent(segments.slice(1).join('/')),
  };
}

function getRoutePath(view, params = {}) {
  if (view === 'listing') {
    return getListingPath();
  }

  if (view === 'details') {
    return getScholarshipDetailPath(params.id);
  }

  return '/';
}

function syncStateToLocation() {
  const route = getRouteFromLocation();

  state.view = route.view;
  state.detailsTab = 'about';
  state.expandedContent = {};

  if (route.view === 'home') {
    resetListingState();
    return;
  }

  if (route.view === 'listing') {
    state.selectedScholarshipId = null;
    return;
  }

  state.selectedScholarshipId = route.scholarshipId || null;
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

function loadSavedScholarshipIds() {
  try {
    const raw = localStorage.getItem(savedScholarshipsStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function persistSavedScholarshipIds(savedIds) {
  localStorage.setItem(savedScholarshipsStorageKey, JSON.stringify(savedIds));
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
  savedScholarshipIds: loadSavedScholarshipIds(),
};

function renderExpandableContent(key, text, maxChars = 320) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
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

function navigate(view, params = {}, options = {}) {
  const nextPath = getRoutePath(view, params);

  state.view = view;

  if (view === 'home') {
    resetListingState();
  } else {
    if (view !== 'details') {
      state.selectedScholarshipId = null;
      state.detailsTab = 'about';
      state.expandedContent = {};
    }

    if (Object.prototype.hasOwnProperty.call(params, 'category')) {
      applySelectedCategory(params.category);
    }

    if (Object.prototype.hasOwnProperty.call(params, 'id')) {
      state.selectedScholarshipId = params.id;
      state.detailsTab = 'about';
      state.expandedContent = {};
    }
  }

  if (options.replace) {
    window.history.replaceState({ view, params }, '', nextPath);
  } else if (normalizePathname(window.location.pathname) !== normalizePathname(nextPath)) {
    window.history.pushState({ view, params }, '', nextPath);
  }

  render();
  window.scrollTo(0, 0);
}

function Header() {
  return `
    <header class="header">
      <div class="logo" id="logo-btn">🎓 Scholarships</div>
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

function inferScholarshipLevel(scholarship) {
  const text = [
    scholarship.title,
    scholarship.eligibility,
    scholarship.about,
    scholarship.detailedEligibility,
    scholarship.course,
  ].join(' ').toLowerCase();

  if (/(classes?\s*1\s*(?:to|-|–)\s*10|class\s*1\s*(?:to|-|–)\s*10)/.test(text)) {
    return 'Class 1-10';
  }

  if (/(classes?\s*11\s*(?:to|-|–)\s*12|class\s*11\s*(?:to|-|–)\s*12|post-?matric)/.test(text)) {
    return 'Class 11-12';
  }

  if (/(class\s*(1|2|3|4|5|6|7|8|9|10|11|12)|school|pre-?matric|matric)/.test(text)) {
    return 'School';
  }

  if (/(phd|doctorate|doctoral|research)/.test(text)) {
    return 'PhD / Research';
  }

  if (/(postgraduate|\bpg\b|master|m\.?tech|m\.?sc|m\.?a)/.test(text)) {
    return 'Postgraduate';
  }

  if (/(undergraduate|\bug\b|graduation|graduate|bachelor|college|diploma|b\.?tech|b\.?sc|b\.?a)/.test(text)) {
    return 'UG / Graduation';
  }

  return 'All Levels';
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
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
}

function extractImportantDateByType(text, type) {
  const source = String(text || '').trim();
  if (!source) {
    return '';
  }

  const pattern = type === 'start'
    ? /(?:application\s*)?(?:start|starting|open|opening)\s*(?:date)?\s*[:\-]\s*([^\n|;,]+)/i
    : /(?:application\s*)?(?:end|ending|close|closing|deadline|last\s*date)\s*(?:date)?\s*[:\-]\s*([^\n|;,]+)/i;

  const match = source.match(pattern);
  return match ? String(match[1] || '').trim() : '';
}

function normalizeDateLikeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/application|date|deadline|start|end|opening|closing|last/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function renderHowToApplySteps(scholarship) {
  const explicitSteps = scholarship.howToApplySteps || [];
  const applyStepKeyBase = `apply-step-${String(scholarship.id || 'x')}`;

  if (explicitSteps.length > 0) {
    const cleanedExplicitText = explicitSteps
      .map((step) => String(step || '').replace(/^\s*step\s*\d+\s*:\s*/i, '').trim())
      .filter(Boolean)
      .join('\n\n');

    if (!cleanedExplicitText) {
      return '';
    }

    return `<div class="apply-step-content">${renderExpandableContent(`${applyStepKeyBase}-all`, cleanedExplicitText, 340)}</div>`;
  }

  const rawText = String(scholarship.howToApply || '').trim();
  if (!rawText) {
    return '';
  }

  const cleanedText = rawText.replace(/\uFFFD/g, '').replace(/\s+/g, ' ').trim();
  const stepPattern = /Step\s*(\d+)\s*:\s*/gi;
  const matches = [...cleanedText.matchAll(stepPattern)];

  if (matches.length === 0) {
    return `<div class="apply-step-content">${renderExpandableContent(`${applyStepKeyBase}-all`, cleanedText, 340)}</div>`;
  }

  const steps = [];
  const introText = cleanedText.slice(0, matches[0].index || 0).trim();
  if (introText) {
    steps.push(introText);
  }

  matches.forEach((match, index) => {
    const currentStart = (match.index || 0) + match[0].length;
    const nextStart = index + 1 < matches.length ? (matches[index + 1].index || cleanedText.length) : cleanedText.length;
    const text = cleanedText.slice(currentStart, nextStart).trim().replace(/\s+/g, ' ');
    if (text) {
      steps.push(text);
    }
  });

  const mergedStepText = steps.join('\n\n').trim();
  if (!mergedStepText) {
    return '';
  }

  return `<div class="apply-step-content">${renderExpandableContent(`${applyStepKeyBase}-all`, mergedStepText, 340)}</div>`;
}

function renderDetailSection(title, htmlContent, sectionId = '') {
  if (!htmlContent) {
    return '';
  }

  const idAttr = sectionId ? ` id="${escapeHtml(sectionId)}"` : '';
  const headingMarkup = title ? `<h3>${escapeHtml(title)}</h3>` : '';
  return `
    <div class="details-block"${idAttr}>
      ${headingMarkup}
      ${htmlContent}
    </div>
  `;
}

function renderKeyValueList(entries, options = {}) {
  const visibleEntries = entries.filter((entry) => entry && entry.label && entry.value);
  const isStacked = Boolean(options.stacked);
  const labelAsHeading = Boolean(options.labelAsHeading);
  const keyPrefix = String(options.keyPrefix || 'detail-value');
  const maxChars = Number(options.maxChars || 220);

  if (visibleEntries.length === 0) {
    return '';
  }

  return `
    <div class="detail-key-value-grid${isStacked ? ' detail-key-value-grid--stacked' : ''}">
      ${visibleEntries.map((entry, index) => `
        <div class="detail-key-value-item${isStacked ? ' detail-key-value-item--stacked' : ''}">
          ${labelAsHeading
            ? `<h3 class="detail-key-value-label">${escapeHtml(entry.label)}</h3>`
            : `<span class="detail-key-value-label">${escapeHtml(entry.label)}</span>`}
          <div class="detail-key-value-value">${renderExpandableContent(`${keyPrefix}-${index + 1}`, entry.value, maxChars)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function expandFaqItems(faqItems) {
  const expandedItems = [];

  faqItems.forEach((item) => {
    const baseQuestion = String(item?.question || '').trim();
    const baseAnswer = String(item?.answer || '').trim();

    if (!baseQuestion && !baseAnswer) {
      return;
    }

    if (!baseAnswer) {
      expandedItems.push({ question: baseQuestion, answer: '' });
      return;
    }

    const markerPattern = /Question:\s*([\s\S]*?)\s*Answer:\s*([\s\S]*?)(?=(?:\s*Question:\s*|$))/gi;
    const firstQuestionIndex = baseAnswer.search(/Question:\s*/i);

    if (firstQuestionIndex === -1) {
      expandedItems.push({ question: baseQuestion || 'FAQ', answer: baseAnswer });
      return;
    }

    const leadingAnswer = baseAnswer.slice(0, firstQuestionIndex).trim();
    if (baseQuestion || leadingAnswer) {
      expandedItems.push({
        question: baseQuestion || 'FAQ',
        answer: leadingAnswer || baseAnswer,
      });
    }

    let match;
    while ((match = markerPattern.exec(baseAnswer)) !== null) {
      const question = String(match[1] || '').trim();
      const answer = String(match[2] || '').trim();
      if (question || answer) {
        expandedItems.push({ question: question || 'FAQ', answer });
      }
    }
  });

  return expandedItems;
}

function getSafeExternalUrl(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }

  try {
    const parsed = new URL(text);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    return '';
  }

  return '';
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

  const categoryCards = categories.map((category) => {
    return `
    <div class="mini-cat-card ${state.selectedCategory === category.id ? 'active' : ''}" data-id="${category.id}">
      <div class="mini-cat-title">${escapeHtml(category.name)}</div>
    </div>
  `;
  }).join('');

  const resultCards = filtered.length > 0
    ? filtered.map((scholarship, index) => {
        const categoryMeta = categoryLookup.get(scholarship.category);
        const brandName = scholarship.brandName || categoryMeta?.name || 'Scholarship';
        const scholarshipLogo = getScholarshipLogoUrl(scholarship);
        const scholarshipLogoMarkup = `<div class="scholarship-logo-wrap" aria-hidden="true"><img class="scholarship-logo" src="${escapeHtml(scholarshipLogo)}" alt="${escapeHtml(brandName)} logo" onerror="this.onerror=null;this.src='/logos/_default_logo.png';"></div>`;

        return `
          <a class="scholarship-card" href="${escapeHtml(getScholarshipDetailPath(scholarship.id))}" data-id="${escapeHtml(String(scholarship.id))}">
            <div class="scholarship-info">
              <div class="scholarship-card-head">
                ${scholarshipLogoMarkup}
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
          </a>
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
  const bannerSummaryText = compactCardText(scholarship.about, 220);
  const bannerSummaryHtml = `<p>${escapeHtml(bannerSummaryText)}</p>`;
  const faqItems = scholarship.faqItems || [];
  const applicationUrl = getSafeExternalUrl(scholarship.link);
  const isSaved = state.savedScholarshipIds.includes(String(scholarship.id));
  const breadcrumbsMarkup = `
    <nav class="details-breadcrumbs" aria-label="Breadcrumb">
      <a href="/" class="details-breadcrumbs__link" data-breadcrumb-home="true">Home</a>
      <span class="details-breadcrumbs__separator" aria-hidden="true">&gt;</span>
      <a href="${escapeHtml(getListingPath())}" class="details-breadcrumbs__link" data-breadcrumb-scholarships="true">Scholarships</a>
      <span class="details-breadcrumbs__separator" aria-hidden="true">&gt;</span>
      <span class="details-breadcrumbs__current">${escapeHtml(scholarship.title)}</span>
    </nav>
  `;

  const pageTabs = `
    <div class="details-tab-row">
      <button class="details-tab ${state.detailsTab === 'about' ? 'details-tab--active' : ''}" data-target="about" type="button"><span class="details-tab__icon" aria-hidden="true">📘</span><span>About Program</span></button>
      <button class="details-tab ${state.detailsTab === 'faq' ? 'details-tab--active' : ''}" data-target="faq" type="button"><span class="details-tab__icon" aria-hidden="true">❓</span><span>FAQs</span></button>
      <button class="details-tab ${state.detailsTab === 'contact' ? 'details-tab--active' : ''}" data-target="contact" type="button"><span class="details-tab__icon" aria-hidden="true">📞</span><span>Contact Details</span></button>
      <button class="details-tab ${state.detailsTab === 'apply' ? 'details-tab--active' : ''}" data-target="apply" type="button"><span class="details-tab__icon" aria-hidden="true">📝</span><span>Apply Now</span></button>
    </div>
  `;
  const awardMetaMarkup = scholarship.award
    ? `<div class="details-banner-meta"><span class="details-meta-pill"><span class="details-meta-pill__icon" aria-hidden="true">🏆</span>${escapeHtml(compactCardText(scholarship.award, 44))}</span></div>`
    : '';

  const parsedStartFromImportantDates = extractImportantDateByType(scholarship.importantDates, 'start');
  const parsedDeadlineFromImportantDates = extractImportantDateByType(scholarship.importantDates, 'deadline');
  const deadlineDisplay = (
    scholarship.deadlineDisplay
    || formatCardDeadline(scholarship.deadline)
    || parsedDeadlineFromImportantDates
    || 'Open'
  );
  let applicationStartDisplay = (
    scholarship.applicationStartDate
    || scholarship.applicationStart
    || scholarship.startDate
    || scholarship.applicationOpenDate
    || parsedStartFromImportantDates
    || ''
  );

  if (normalizeDateLikeText(applicationStartDisplay) === normalizeDateLikeText(deadlineDisplay)) {
    applicationStartDisplay = parsedStartFromImportantDates || '';
  }

  applicationStartDisplay = applicationStartDisplay || 'Not specified';
  const scholarshipLevel = inferScholarshipLevel(scholarship);

  const detailCards = [
    { label: 'Application Start Date', icon: '🗓️', value: compactCardText(applicationStartDisplay, 45), fullValue: applicationStartDisplay },
    { label: 'Deadline', icon: '📅', value: deadlineDisplay, fullValue: deadlineDisplay },
    { label: 'Level', icon: '🎓', value: scholarshipLevel, fullValue: scholarshipLevel },
  ];

  const bannerCardMarkup = `
    <div class="banner-info-card">
      <div class="banner-info-card__glow" aria-hidden="true"></div>
      <div class="banner-info-card__header">
        <span class="banner-info-card__title">Key Information</span>
      </div>
      <div class="banner-info-card__list">
        ${detailCards.map((card) => `
          <div class="banner-info-card__item">
            <span class="banner-info-card__icon" aria-hidden="true">${card.icon}</span>
            <span class="banner-info-card__label">${escapeHtml(card.label)}</span>
            <span class="banner-info-card__value">${escapeHtml(card.value)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const aboutHtml = scholarship.about
    ? renderExpandableContent('about', scholarship.about, 380)
    : '';
  const detailedEligibilityHtml = scholarship.detailedEligibility || scholarship.eligibility
    ? renderExpandableContent('detailed-eligibility', scholarship.detailedEligibility || scholarship.eligibility, 360)
    : '';
  const benefitsHtml = scholarship.benefits || scholarship.award
    ? renderExpandableContent('benefits', scholarship.benefits || scholarship.award, 320)
    : '';
  const documentsHtml = scholarship.documents
    ? renderExpandableContent('documents', scholarship.documents, 320)
    : '';
  const importantDatesHtml = scholarship.importantDates || scholarship.deadline
    ? renderExpandableContent('important-dates', scholarship.importantDates || scholarship.deadline, 320)
    : '';
  const selectionCriteriaHtml = scholarship.selectionCriteria
    ? renderExpandableContent('selection-criteria', scholarship.selectionCriteria, 320)
    : '';
  const termsHtml = scholarship.termsAndConditions
    ? renderExpandableContent('terms-and-conditions', scholarship.termsAndConditions, 320)
    : '';
  const additionalDetailsMarkup = (scholarship.additionalDetails || [])
    .map((item, index) => {
      return renderDetailSection(
        item.label,
        renderExpandableContent(`additional-${index}`, item.value, 320),
      );
    })
    .join('');
  const sourceDataSectionsMarkup = [
    renderDetailSection('About The Scholarship', aboutHtml, 'section-sheet-overview'),
    renderDetailSection('Eligibility', renderKeyValueList([
      { label: 'Detailed Eligibility', value: scholarship.detailedEligibility },
      { label: 'Selection Criteria', value: scholarship.selectionCriteria },
    ], { stacked: true, labelAsHeading: true, keyPrefix: `sheet-eligibility-${String(scholarship.id || 'x')}`, maxChars: 260 }), 'section-sheet-eligibility'),
    renderDetailSection('How To Apply', renderHowToApplySteps(scholarship), 'section-sheet-apply'),
    renderDetailSection('', renderKeyValueList([
      { label: 'Benefits', value: scholarship.benefits },
      { label: 'Documents', value: scholarship.documents },
      { label: 'Terms and Conditions', value: scholarship.termsAndConditions },
    ], { stacked: true, labelAsHeading: true, keyPrefix: `sheet-resources-${String(scholarship.id || 'x')}`, maxChars: 220 }), 'section-sheet-resources'),
  ].filter(Boolean).join('');
  const expandedFaqItems = expandFaqItems(faqItems);
  const faqMarkup = expandedFaqItems.length > 0
    ? `<div class="faq-grid">${expandedFaqItems.map((item, index) => `
      <article class="faq-card faq-card--accordion" style="--faq-delay: ${Math.min(index, 8) * 0.04}s">
        <button class="faq-card__header faq-card__toggle" type="button" data-expand-key="faq-${escapeHtml(String(scholarship.id || 'x'))}-${index + 1}" aria-expanded="${state.expandedContent[`faq-${String(scholarship.id || 'x')}-${index + 1}`] ? 'true' : 'false'}">
          <span class="faq-card__index">${String(index + 1).padStart(2, '0')}</span>
          <h4>${escapeHtml(item.question)}</h4>
          <span class="faq-card__chevron" aria-hidden="true">▾</span>
        </button>
        <div class="faq-card__answer-wrap${state.expandedContent[`faq-${String(scholarship.id || 'x')}-${index + 1}`] ? ' is-open' : ''}">
          <div class="faq-card__answer">
          <span class="faq-card__answer-label">Answer</span>
          <p>${escapeHtml(item.answer || 'Not specified')}</p>
          </div>
        </div>
      </article>
    `).join('')}</div>`
    : '';
  const contactMarkup = scholarship.contactDetails || scholarship.brandName || scholarship.link
    ? `
      <p><strong>Brand:</strong> ${escapeHtml(scholarship.brandName || categoryName)}</p>
      ${scholarship.contactDetails ? `<p><strong>Contact:</strong> ${escapeHtml(scholarship.contactDetails)}</p>` : ''}
    `
    : '';
  const secondarySectionsMarkup = [
    sourceDataSectionsMarkup ? `<section class="details-subsection details-sheet-data" id="section-sheet-data">${sourceDataSectionsMarkup}</section>` : '',
    additionalDetailsMarkup,
    faqMarkup ? `<section class="details-subsection" id="section-faq"><h3>FAQs</h3>${faqMarkup}</section>` : '',
    contactMarkup ? `<section class="details-subsection" id="section-contact"><h3>Contact Details</h3>${contactMarkup}</section>` : '',
  ].filter(Boolean).join('');

  return `
    <main class="view-container">
      ${breadcrumbsMarkup}
      <div class="details-banner">
        <div class="details-banner-copy">
          <p class="eyebrow">${escapeHtml(categoryName)}</p>
          <h1>${escapeHtml(scholarship.title)}</h1>
          <div class="details-banner-tagline">${bannerSummaryHtml}</div>
          ${awardMetaMarkup}
          <div class="details-banner-actions">
            <button class="details-banner-btn details-banner-btn--apply" type="button" data-open-apply="true">Apply Now</button>
            <button
              class="details-banner-btn details-banner-btn--save ${isSaved ? 'is-saved' : ''}"
              type="button"
              data-save-scholarship="${escapeHtml(String(scholarship.id))}"
              aria-pressed="${isSaved ? 'true' : 'false'}"
            >
              ${isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        <div class="details-banner-visual" aria-hidden="true">
          ${bannerCardMarkup}
        </div>
      </div>

      ${pageTabs}

      <section class="content-section" id="section-about">
        ${secondarySectionsMarkup || '<div class="empty-state">No detailed information is available for this scholarship in the current sheet.</div>'}
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

  document.querySelectorAll('[data-breadcrumb-home]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navigate('home');
    });
  });

  document.querySelectorAll('[data-breadcrumb-scholarships]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navigate('listing', { category: state.selectedCategory });
    });
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
    card.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      event.preventDefault();
      navigate('details', { id: card.dataset.id });
    });
  });

  document.querySelectorAll('.details-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      state.detailsTab = target;
      render();

      const selectorByTarget = {
        about: '#section-sheet-overview',
        faq: '#section-faq',
        contact: '#section-contact',
        apply: '#section-sheet-apply',
      };
      const selector = selectorByTarget[target] || '#section-about';
      const targetSection = document.querySelector(selector);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  document.querySelectorAll('[data-open-apply]').forEach((button) => {
    button.addEventListener('click', () => {
      state.detailsTab = 'apply';
      render();

      const targetSection = document.querySelector('#section-sheet-apply');
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  document.querySelectorAll('[data-save-scholarship]').forEach((button) => {
    button.addEventListener('click', () => {
      const scholarshipId = String(button.dataset.saveScholarship || '');
      if (!scholarshipId) {
        return;
      }

      const savedSet = new Set(state.savedScholarshipIds);
      if (savedSet.has(scholarshipId)) {
        savedSet.delete(scholarshipId);
      } else {
        savedSet.add(scholarshipId);
      }

      state.savedScholarshipIds = Array.from(savedSet);
      persistSavedScholarshipIds(state.savedScholarshipIds);
      render();
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

window.addEventListener('popstate', () => {
  syncStateToLocation();
  render();
});

syncStateToLocation();
window.history.replaceState({ view: state.view, selectedCategory: state.selectedCategory, selectedScholarshipId: state.selectedScholarshipId }, '', getRoutePath(state.view, { id: state.selectedScholarshipId }));
render();
