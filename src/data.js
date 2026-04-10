import scholarshipsText from '../data/Scholarships-detail-page.csv?raw';
import class1to10LiveText from '../data/Class(1-10)-live-detailPage.csv?raw';
import class11to12LiveText from '../data/Class(11-12)-live-detailPage.csv?raw';
import girlsLiveText from '../data/Girls-live-detailPage.csv?raw';
import girlsUpcomingText from '../data/Girls-upcoming-detailPage.csv?raw';
import graduationLiveText from '../data/Graduation-live-detailPage.csv?raw';
import gujaratUpcomingText from '../data/Gujarat-upcoming-detailPage.csv?raw';
import categoriesWorkbookUrl from '../data/CM-Scholarships-info.xlsx?url';

const DETAIL_CATEGORY_IMAGES = {
  'means-based-scholarship': '/images/means_based.png',
  'merit-based-scholarship': '/images/merit_based.png',
  'girls-scholarship': '/images/girls_scholarship.png',
  'school-scholarship': '/images/school_scholarship.png',
  'college-scholarship': '/images/college_scholarship.png',
  'international-scholarship': '/images/international_scholarship.png',
  'minorities-scholarship': '/images/minorities_scholarship.png',
  'sports-based-scholarship': '/images/sports_based.png',
};

const FRONT_CATEGORY_IMAGES = {
  'means-based-scholarship': 'https://picsum.photos/seed/front-means-edu/1200/800',
  'merit-based-scholarship': 'https://picsum.photos/seed/front-merit-edu/1200/800',
  'girls-scholarship': 'https://picsum.photos/seed/front-girls-edu/1200/800',
  'school-scholarship': 'https://picsum.photos/seed/front-school-edu/1200/800',
  'college-scholarship': 'https://picsum.photos/seed/front-college-edu/1200/800',
  'international-scholarship': 'https://picsum.photos/seed/front-international-edu/1200/800',
  'minorities-scholarship': 'https://picsum.photos/seed/front-minorities-edu/1200/800',
  'sports-based-scholarship': 'https://picsum.photos/seed/front-sports-edu/1200/800',
};

const FALLBACK_CATEGORIES = [
  {
    name: 'Means Based Scholarship',
    description: 'Students from low-income families with income-based eligibility.',
    examples: 'Vidyadhan Scholarship, HDFC Badhte Kadam Scholarship',
  },
  {
    name: 'Merit Based Scholarship',
    description: 'Scholarships for students with strong academic performance.',
    examples: 'INSPIRE Scholarship, PM YASASVI Scheme',
  },
  {
    name: 'Girls Scholarship',
    description: 'Exclusive scholarships for women and girls.',
    examples: 'AICTE Pragati Scholarship, Santoor Women Scholarship',
  },
  {
    name: 'School Scholarship',
    description: 'Scholarships for students in school classes.',
    examples: 'NSP Pre-Matric, NTSE',
  },
  {
    name: 'College Scholarship',
    description: 'Scholarships for UG/PG/diploma students.',
    examples: 'NSP Post-Matric, Reliance Foundation Undergraduate Scholarships',
  },
  {
    name: 'International Scholarship',
    description: 'Funding for students aiming to study abroad.',
    examples: 'Chevening, Fulbright-Nehru, Inlaks Shivdasani',
  },
  {
    name: 'Minorities Scholarship',
    description: 'Scholarships for notified minority communities.',
    examples: 'Pre-Matric Scholarship for Minorities',
  },
  {
    name: 'Sports Based Scholarship',
    description: 'Scholarships for students with sports achievements.',
    examples: 'SAI Schemes, Reliance Foundation Youth Sports',
  },
  {
    name: 'State-wise scholarships',
    description: 'Scholarships provided by state governments.',
    examples: 'All states',
  },
];

const FALLBACK_CATEGORY_FILTER_SPECS = {
  'means-based-scholarship': {
    fields: ['Education Level', 'Nationality', 'State / Location', 'Course / Stream', 'Gender', 'Government / Private Institution', 'Caste', 'Minority Status', 'Disability Status', 'Scholarship Type', 'Annual Family Income'],
    optionsByField: {},
  },
  'merit-based-scholarship': {
    fields: ['Education Level', 'Gender', 'Annual Family Income', 'State / Location', 'Course / Stream', 'Minimum Percentage', 'Entrance Exam Qualified (Yes/No)', 'Rank Range'],
    optionsByField: {},
  },
  'girls-scholarship': {
    fields: ['Education Level', 'Current Class / Year', 'Annual Family Income', 'State / Location', 'Course / Stream', 'Marital Status', 'Single Girl Child (Yes/No)', 'Parent Occupation'],
    optionsByField: {},
  },
  'school-scholarship': {
    fields: ['Education Level', 'Current Class / Year', 'Annual Family Income', 'State / Location', 'Course / Stream'],
    optionsByField: {},
  },
  'college-scholarship': {
    fields: ['Education Level', 'Current Class / Year', 'Annual Family Income', 'State / Location', 'Course / Stream'],
    optionsByField: {},
  },
  'state-wise-scholarships': {
    fields: ['State / Location', 'Education Level', 'Current Class / Year', 'Course / Stream'],
    optionsByField: {},
  },
  'international-scholarship': {
    fields: ['Education Level', 'Current Class / Year', 'Annual Family Income', 'State / Location', 'Course / Stream', 'Destination Country', 'Passport Available (Yes/No)', 'English Test (IELTS/TOEFL)'],
    optionsByField: {},
  },
  'minorities-scholarship': {
    fields: ['Education Level', 'Current Class / Year', 'Annual Family Income', 'State / Location', 'Course / Stream', 'Religion (Muslim, Christian, Sikh, etc.)', 'Minority Certificate Required (Yes/No)'],
    optionsByField: {},
  },
  'sports-based-scholarship': {
    fields: ['Education Level', 'Current Class / Year', 'Annual Family Income', 'State / Location', 'Course / Stream', 'Sports Type', 'Level (District / State / National)', 'Medal Won (Yes/No)'],
    optionsByField: {},
  },
};

const INDIAN_STATE_OPTIONS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

const COUNTRY_OPTIONS = [
  'Australia',
  'Canada',
  'China',
  'France',
  'Germany',
  'India',
  'Ireland',
  'Japan',
  'Malaysia',
  'Netherlands',
  'New Zealand',
  'Singapore',
  'South Korea',
  'Spain',
  'Sweden',
  'Taiwan',
  'Thailand',
  'United Kingdom',
  'United States of America',
  'USA',
  'UK',
  'Vietnam',
];

const COURSE_OPTIONS = [
  'Engineering',
  'Medical',
  'Science & Research',
  'Science',
  'Arts',
  'Commerce',
  'Law',
  'Management',
  'Pharmacy',
  'Nursing',
  'Technology',
  'Agriculture',
  'Education',
  'Humanities',
  'Diploma',
  'Research',
];

FALLBACK_CATEGORY_FILTER_SPECS['state-wise-scholarships'].optionsByField = {
  'State / Location': INDIAN_STATE_OPTIONS,
  'Education Level': ['School', 'UG', 'PG', 'PhD'],
  'Current Class / Year': ['Class 1-10', 'Class 11-12', 'UG', 'PG', 'PhD'],
  'Course / Stream': ['Engineering', 'Medical', 'Science', 'Arts', 'Law', 'Management', 'Research'],
};

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (inQuotes) {
      if (character === '"') {
        if (nextCharacter === '"') {
          currentCell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }

    if (character === ',') {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if (character === '\n') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    if (character !== '\r') {
      currentCell += character;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  const headers = (rows.shift() || []).map((header) => header.trim());

  return rows
    .filter((row) => row.some((cell) => cell && cell.trim() !== ''))
    .map((row) => Object.fromEntries(headers.map((header, idx) => [header, (row[idx] || '').trim()])));
}

function buildScholarshipSourceRows(sourceId, text) {
  return parseCSV(text).map((row) => ({
    ...row,
    __sourceIds: [sourceId],
  }));
}

function mergeScholarshipRows(rows) {
  const mergedRows = new Map();

  rows.forEach((row) => {
    const title = sanitizeText(row.Name || row.Title || row['Scholarship Name']);
    if (!title) {
      return;
    }

    const key = normalizeWhitespace([
      title,
      row.Link,
      row.Deadline,
    ].join('|')).toLowerCase();

    const existing = mergedRows.get(key);
    if (!existing) {
      mergedRows.set(key, { ...row });
      return;
    }

    const sourceIds = new Set([...(existing.__sourceIds || []), ...(row.__sourceIds || [])]);

    Object.keys(row).forEach((fieldName) => {
      if (fieldName === '__sourceIds') {
        return;
      }

      if (!sanitizeText(existing[fieldName]) && sanitizeText(row[fieldName])) {
        existing[fieldName] = row[fieldName];
      }
    });

    existing.__sourceIds = Array.from(sourceIds);
  });

  return Array.from(mergedRows.values());
}

const scholarshipSources = [
  { id: 'core', text: scholarshipsText },
  { id: 'class-1-10-live', text: class1to10LiveText },
  { id: 'class-11-12-live', text: class11to12LiveText },
  { id: 'girls-live', text: girlsLiveText },
  { id: 'girls-upcoming', text: girlsUpcomingText },
  { id: 'graduation-live', text: graduationLiveText },
  { id: 'gujarat-upcoming', text: gujaratUpcomingText },
];

const scholarshipRows = mergeScholarshipRows(
  scholarshipSources.flatMap((source) => buildScholarshipSourceRows(source.id, source.text)),
);

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizeText(value) {
  const text = normalizeWhitespace(value);
  if (!text) {
    return '';
  }

  const lowered = text.toLowerCase();
  if (['n/a', 'na', 'none', '-', '--'].includes(lowered)) {
    return '';
  }

  return text
    .replace(/\s*read\s+more\.{0,3}\s*$/i, '')
    .replace(/\s*`carefully,?/gi, ' carefully,')
    .trim();
}

function normalizeDeadlineDisplay(deadline) {
  const text = sanitizeText(deadline);
  const parsed = parseDeadline(text);
  if (!parsed) {
    return text || 'Open';
  }

  return parsed
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    })
    .replace(/\s+/g, '-');
}

function parseHowToApplySteps(value) {
  const text = sanitizeText(value);
  if (!text) {
    return [];
  }

  const normalized = text
    .replace(/\bstep\s*0*(\d+)\s*[:.)-]?/gi, '|||Step $1: ')
    .replace(/\b\d+\)\s+/g, '|||')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const parts = normalized
    .split('|||')
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);

  const cleaned = parts
    .map((part) => part.replace(/^Step\s*\d+\s*:\s*/i, '').trim())
    .filter(Boolean)
    .slice(0, 12);

  if (cleaned.length >= 2) {
    return cleaned;
  }

  return text
    .split(/\s+\.\s+/)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)
    .slice(0, 8);
}

function inferText(record) {
  return normalizeWhitespace([
    record.title,
    record.eligibility,
    record.about,
    record.detailedEligibility,
    record.benefits,
    record.award,
    record.howToApply,
  ].join(' ')).toLowerCase();
}

function parseDeadline(deadline) {
  const text = normalizeWhitespace(deadline);
  const exactMatch = text.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})$/);

  if (!exactMatch) {
    return null;
  }

  const [, day, monthName, year] = exactMatch;
  const monthLookup = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  const monthIndex = monthLookup[monthName.toLowerCase()];
  if (monthIndex === undefined) {
    return null;
  }

  const yearNumber = Number(year.length === 2 ? `20${year}` : year);
  const date = new Date(yearNumber, monthIndex, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function detectStatus(deadline) {
  const normalized = sanitizeText(deadline).toLowerCase();

  if (!normalized || normalized === 'n/a' || normalized === 'na' || normalized === 'none' || normalized.includes('always open') || normalized.includes('open ended') || normalized.includes('ongoing')) {
    return 'always';
  }

  if (normalized.includes('closed') || normalized.includes('expired') || normalized.includes('last day to go')) {
    return 'upcoming';
  }

  return 'live';
}

function matchWorkbookCategoryName(text, workbookCategoryNames) {
  const checks = [
    { needle: 'means', regex: /(means|income|low-income|economically disadvantaged|need based)/ },
    { needle: 'merit', regex: /(merit|topper|academic excellence|high achiever|ranking|percentile)/ },
    { needle: 'girls', regex: /(girls|women|female|kanya|wings)/ },
    { needle: 'school', regex: /(class\s*([1-9]|1[0-2])|school|pre-matric|matric)/ },
    { needle: 'college', regex: /(college|undergraduate|postgraduate|ug|pg|bachelor|master|diploma)/ },
    { needle: 'international', regex: /(international|overseas|study abroad|uk\b|usa|canada|australia|new zealand|europe)/ },
    { needle: 'minorit', regex: /(minority|minorities|muslim|christian|sikh|buddhist|jain|parsi)/ },
    { needle: 'sports', regex: /(sports|athlete|chess|olympiad)/ },
    { needle: 'state-wise', regex: /(state|domicile|residency|state government)/ },
  ];

  const matched = [];
  checks.forEach((rule) => {
    if (!rule.regex.test(text)) {
      return;
    }

    const workbookName = workbookCategoryNames.find((name) => slugify(name).includes(rule.needle));
    if (workbookName && !matched.includes(workbookName)) {
      matched.push(workbookName);
    }
  });

  return matched;
}

function deriveFilters(record, workbookCategoryNames) {
  const text = inferText(record);

  const workbookCategoryFilters = matchWorkbookCategoryName(text, workbookCategoryNames);
  const aid = [];
  const course = [];
  const location = [];
  const benefit = [];

  if (/fee waiver|tuition fee|fee reduction|fee reimbursement/.test(text)) {
    aid.push('Tuition & Fee Support');
    benefit.push('Tuition Fee Waiver');
  }
  if (/stipend|allowance|grant|cash/.test(text)) {
    aid.push('Stipend / Grants');
    benefit.push('Stipend');
  }
  if (/fellowship|internship/.test(text)) {
    aid.push('Fellowship / Internship');
    benefit.push('Fellowship');
  }

  if (/engineering|b\.tech|m\.tech/.test(text)) {
    course.push('Engineering');
  }
  if (/mbbs|medical|nursing|pharmacy/.test(text)) {
    course.push('Medical');
  }
  if (/law|llb|llm/.test(text)) {
    course.push('Law');
  }
  if (/science|bsc|msc|research|phd/.test(text)) {
    course.push('Science & Research');
  }

  if (/international|overseas|study abroad|uk\b|usa|australia|new zealand|europe/.test(text)) {
    location.push('International');
  }
  if (/india|indian|central govt|state government|delhi|odisha|karnataka|maharashtra/.test(text)) {
    location.push('India');
  }

  return {
    'scholarship-categories': workbookCategoryFilters,
    'application-status': [record.status],
    'financial-aid-provision': aid,
    'course-based-categories': course,
    'location-based': location,
    benefit,
  };
}

function firstNonEmpty(...values) {
  return values.find((value) => normalizeWhitespace(value)) || '';
}

function extractBrandName(title) {
  const cleaned = normalizeWhitespace(title);
  if (!cleaned) {
    return 'Scholarship Board';
  }

  const split = cleaned.split(/[:\-–]/)[0].trim();
  if (split.length >= 4) {
    return split;
  }

  return cleaned.split(' ').slice(0, 3).join(' ');
}

function parseWorkbookCategories(rows) {
  return rows
    .map((row) => {
      const keys = Object.keys(row);
      const name = normalizeWhitespace(row['8'] || row.Category || row['Scholarship Category'] || row[keys[0]]);
      const examples = normalizeWhitespace(row['Scholarship Names'] || row.Examples || row[keys[1]]);
      const description = normalizeWhitespace(row['Description / Notes'] || row.Description || row[keys[2]]);

      return {
        name,
        examples,
        description,
      };
    })
    .filter((item) => item.name && !item.name.toLowerCase().includes('scholarship names'));
}

function parseBulletFields(value) {
  const text = normalizeWhitespace(value).replace(/\u2022/g, '•');
  if (!text) {
    return [];
  }

  return text
    .split('•')
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);
}

function parseTagList(rows) {
  const tags = new Set();

  rows.forEach((row) => {
    const filtersValue = normalizeWhitespace(row.Filters || row.Filter || row['Filter Tags']);
    if (!filtersValue) {
      return;
    }

    filtersValue.split(',').map((item) => normalizeWhitespace(item)).filter(Boolean).forEach((item) => tags.add(item));
  });

  return Array.from(tags);
}

function defaultOptionsForField(fieldName, sheetTags) {
  const defaults = {
    'Education Level': ['School', 'UG', 'PG', 'PhD'],
    Nationality: ['Indian', 'International'],
    'State / Location': ['All India', 'Delhi', 'Karnataka', 'Maharashtra', 'Odisha', 'Telangana', 'Andhra Pradesh', 'International'],
    'Course / Stream': ['Engineering', 'Medical', 'Science', 'Arts', 'Law', 'Management'],
    Gender: ['Girls/Women', 'Boys', 'All'],
    'Government / Private Institution': ['Government', 'Private', 'Both'],
    Caste: ['SC', 'ST', 'OBC', 'EWS', 'General'],
    'Minority Status': ['Minority', 'Non-Minority'],
    'Disability Status': ['Yes', 'No'],
    'Scholarship Type': ['Tuition Fee Waiver', 'Stipend', 'Grant', 'Fellowship'],
    'Annual Family Income': ['< 1 Lakh', '1 - 3 Lakhs', '3 - 5 Lakhs', '> 5 Lakhs'],
    'Current Class / Year': ['Class 1-10', 'Class 11-12', 'UG', 'PG'],
    'Marital Status': ['Unmarried', 'Married'],
    'Single Girl Child (Yes/No)': ['Yes', 'No'],
    'Parent Occupation': ['Farmer', 'Labor', 'Government Employee', 'Private Employee', 'Other'],
    'Destination Country': ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'New Zealand', 'International'],
    'Passport Available (Yes/No)': ['Yes', 'No'],
    'English Test (IELTS/TOEFL)': ['IELTS', 'TOEFL', 'Not Required'],
    'Religion (Muslim, Christian, Sikh, etc.)': ['Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi'],
    'Minority Certificate Required (Yes/No)': ['Yes', 'No'],
    'Sports Type': ['Individual', 'Team'],
    'Level (District / State / National)': ['District', 'State', 'National'],
    'Medal Won (Yes/No)': ['Yes', 'No'],
    'Minimum Percentage': ['60%+', '70%+', '80%+', '90%+'],
    'Entrance Exam Qualified (Yes/No)': ['Yes', 'No'],
    'Rank Range': ['Top 10', 'Top 100', 'Top 1000'],
  };

  const seed = defaults[fieldName] || [];
  const merged = new Set(seed);
  sheetTags.forEach((tag) => merged.add(tag));
  return Array.from(merged);
}

function getTextPool(rows) {
  return rows
    .map((row) => Object.values(row).map((value) => normalizeWhitespace(value)).filter(Boolean).join(' '))
    .join(' ')
    .toLowerCase();
}

function collectMatchingOptions(textPool, candidates) {
  const matches = [];

  candidates.forEach((candidate) => {
    const label = typeof candidate === 'string' ? candidate : candidate.label;
    const patterns = typeof candidate === 'string' ? [candidate] : candidate.patterns;

    const found = patterns.some((pattern) => {
      if (pattern instanceof RegExp) {
        return pattern.test(textPool);
      }

      const normalizedPattern = String(pattern || '').toLowerCase();
      return normalizedPattern ? textPool.includes(normalizedPattern) : false;
    });

    if (found && !matches.includes(label)) {
      matches.push(label);
    }
  });

  return matches;
}

function buildFieldOptions(fieldName, sheetRows, workbookCategoryRows, scholarshipRowsData) {
  const textPool = [getTextPool(sheetRows), getTextPool(workbookCategoryRows), getTextPool(scholarshipRowsData)].join(' ');

  if (fieldName === 'State / Location') {
    const values = collectMatchingOptions(textPool, [
      { label: 'All India', patterns: [/all india/, /nationwide/, /pan india/] },
      { label: 'India', patterns: [/\bindia\b/, /indian/] },
      ...INDIAN_STATE_OPTIONS.map((stateName) => ({
        label: stateName,
        patterns: [new RegExp(`\\b${stateName.replace(/\s+/g, '\\s+')}\\b`, 'i')],
      })),
      { label: 'International', patterns: [/international/, /overseas/, /study abroad/] },
    ]);

    return values;
  }

  if (fieldName === 'Destination Country') {
    const values = collectMatchingOptions(textPool, COUNTRY_OPTIONS.map((country) => ({
      label: country,
      patterns: [new RegExp(`\\b${country.replace(/\s+/g, '\\s+')}\\b`, 'i')],
    })));

    return values;
  }

  if (fieldName === 'Course / Stream') {
    const values = collectMatchingOptions(textPool, COURSE_OPTIONS.map((course) => ({
      label: course,
      patterns: [new RegExp(`\\b${course.replace(/\s*\&\s*/g, '\\s*&\\s*').replace(/\s+/g, '\\s+')}\\b`, 'i')],
    })));

    return values;
  }

  if (fieldName === 'Education Level' || fieldName === 'Current Class / Year') {
    const values = collectMatchingOptions(textPool, [
      { label: 'School', patterns: [/school/, /pre-matric/, /classes?\s*1\s*(?:to|-|–)\s*10/, /class\s*1\s*(?:to|-|–)\s*10/] },
      { label: 'Class 1-10', patterns: [/classes?\s*1\s*(?:to|-|–)\s*10/, /class\s*1\s*(?:to|-|–)\s*10/] },
      { label: 'Class 11-12', patterns: [/classes?\s*11\s*(?:to|-|–)\s*12/, /class\s*11\s*(?:to|-|–)\s*12/, /post-matric/] },
      { label: 'UG', patterns: [/\bug\b/, /undergraduate/, /bachelor/] },
      { label: 'PG', patterns: [/\bpg\b/, /postgraduate/, /master|masters/] },
      { label: 'PhD', patterns: [/\bphd\b/, /doctoral|doctorate/] },
      { label: 'Diploma', patterns: [/diploma/] },
    ]);

    return values;
  }

  if (fieldName === 'Gender') {
    const values = collectMatchingOptions(textPool, [
      { label: 'Girls/Women', patterns: [/girl/, /women?/, /female/, /kanya/] },
      { label: 'Boys', patterns: [/boy/, /male/] },
      { label: 'All', patterns: [/all students?/, /open to all/, /any gender/] },
    ]);

    return values;
  }

  if (fieldName === 'Scholarship Type') {
    const values = collectMatchingOptions(textPool, [
      { label: 'Tuition Fee Waiver', patterns: [/tuition fee waiver/, /fee waiver/, /fee reduction/, /reimbursement/] },
      { label: 'Stipend', patterns: [/stipend/, /monthly allowance/, /monthly assistance/] },
      { label: 'Grant', patterns: [/grant/, /financial assistance/] },
      { label: 'Fellowship', patterns: [/fellowship/] },
    ]);

    return values;
  }

  return defaultOptionsForField(fieldName, []);
}

async function loadWorkbookDataset() {
  try {
    const XLSX = await import('xlsx');
    const response = await fetch(categoriesWorkbookUrl);
    if (!response.ok) {
      return {
        categories: FALLBACK_CATEGORIES,
        filterSpecsByCategory: FALLBACK_CATEGORY_FILTER_SPECS,
      };
    }

    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const firstSheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '' });
    const parsedCategories = parseWorkbookCategories(firstSheetRows);
    const categories = parsedCategories.length > 0 ? parsedCategories : FALLBACK_CATEGORIES;

    const filterSpecsByCategory = {};
    const workbookCategoryRows = workbook.SheetNames.slice(1).flatMap((sheetName) => XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }));

    workbook.SheetNames.slice(1).forEach((sheetName) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      const categoryId = slugify(sheetName);

      const filterLogicCell = rows.find((row) => normalizeWhitespace(row['Filter Logic']))?.['Filter Logic'] || '';
      const fields = parseBulletFields(filterLogicCell);

      const optionsByField = {};
      fields.forEach((fieldName) => {
        optionsByField[fieldName] = buildFieldOptions(fieldName, rows, workbookCategoryRows, scholarshipRows);
      });

      filterSpecsByCategory[categoryId] = {
        fields,
        optionsByField,
      };
    });

    return {
      categories,
      filterSpecsByCategory: {
        ...FALLBACK_CATEGORY_FILTER_SPECS,
        ...filterSpecsByCategory,
      },
    };
  } catch {
    return {
      categories: FALLBACK_CATEGORIES,
      filterSpecsByCategory: FALLBACK_CATEGORY_FILTER_SPECS,
    };
  }
}

const workbookDataset = await loadWorkbookDataset();
const workbookCategories = workbookDataset.categories;

export const categories = workbookCategories
  .map((entry) => {
  const id = slugify(entry.name);
  return {
    id,
    name: entry.name,
    description: entry.description,
    examples: entry.examples,
    image: FRONT_CATEGORY_IMAGES[id] || 'https://picsum.photos/seed/front-default-edu/1200/800',
    detailImage: DETAIL_CATEGORY_IMAGES[id] || '/images/college_scholarship.png',
  };
});

const workbookCategoryNames = categories.map((item) => item.name);

export const categoryFilterSpecs = workbookDataset.filterSpecsByCategory || FALLBACK_CATEGORY_FILTER_SPECS;

export const filterGroups = [
  {
    id: 'scholarship-categories',
    label: 'Scholarship Categories (XLSX)',
    options: workbookCategoryNames,
  },
  {
    id: 'application-status',
    label: 'Application Status',
    options: ['live', 'upcoming', 'always'],
  },
  {
    id: 'financial-aid-provision',
    label: 'Financial Aid Provision',
    options: ['Tuition & Fee Support', 'Stipend / Grants', 'Fellowship / Internship'],
  },
  {
    id: 'course-based-categories',
    label: 'Course-Based Categories',
    options: ['Engineering', 'Medical', 'Law', 'Science & Research'],
  },
  {
    id: 'location-based',
    label: 'Location-Based',
    options: ['India', 'International'],
  },
];

export const datasetPresets = [
  {
    id: 'class-1-10-live',
    label: 'Class 1-10 Live',
    sourceName: 'Class(1-10)-live-detailPage.csv',
    categoryId: 'school-scholarship',
    status: 'live',
    fieldFilters: {
      'Current Class / Year': ['Class 1-10'],
    },
  },
  {
    id: 'class-11-12-live',
    label: 'Class 11-12 Live',
    sourceName: 'Class(11-12)-live-detailPage.csv',
    categoryId: 'school-scholarship',
    status: 'live',
    fieldFilters: {
      'Current Class / Year': ['Class 11-12'],
    },
  },
  {
    id: 'girls-live',
    label: 'Girls Live',
    sourceName: 'Girls-live-detailPage.csv',
    categoryId: 'girls-scholarship',
    status: 'live',
    fieldFilters: {
      Gender: ['Girls/Women'],
    },
  },
  {
    id: 'girls-upcoming',
    label: 'Girls Upcoming',
    sourceName: 'Girls-upcoming-detailPage.csv',
    categoryId: 'girls-scholarship',
    status: 'upcoming',
    fieldFilters: {
      Gender: ['Girls/Women'],
    },
  },
  {
    id: 'graduation-live',
    label: 'Graduation Live',
    sourceName: 'Graduation-live-detailPage.csv',
    categoryId: 'college-scholarship',
    status: 'live',
    fieldFilters: {
      'Education Level': ['UG'],
    },
  },
  {
    id: 'gujarat-upcoming',
    label: 'Gujarat Upcoming',
    sourceName: 'Gujarat-upcoming-detailPage.csv',
    categoryId: 'state-wise-scholarships',
    status: 'upcoming',
    fieldFilters: {
      'State / Location': ['Gujarat'],
    },
  },
];

function choosePrimaryCategory(record, filters) {
  const matched = filters['scholarship-categories'] || [];
  if (matched.length > 0) {
    return slugify(matched[0]);
  }

  const text = inferText(record);
  if (/international|overseas|study abroad/.test(text)) {
    return 'international-scholarship';
  }

  return 'college-scholarship';
}

export const scholarships = scholarshipRows
  .map((row) => {
    const title = sanitizeText(row.Name || row.Title || row['Scholarship Name']);
    if (!title) {
      return null;
    }

    let eligibility = sanitizeText(row.Eligibility);
    
    // Add state information for state-wise scholarships
    if (row.__sourceIds?.includes('gujarat-upcoming')) {
      eligibility = eligibility ? `${eligibility}. Exclusive to Gujarat residents.` : 'Exclusive to Gujarat residents.';
    }

    const record = {
      id: slugify(title),
      title,
      brandName: extractBrandName(title),
      link: sanitizeText(row.Link),
      deadline: sanitizeText(row.Deadline),
      award: sanitizeText(row.Award),
      eligibility,
      about: sanitizeText(row.About),
      detailedEligibility: sanitizeText(row.Detailed_Eligibility),
      benefits: sanitizeText(row.Benefits),
      howToApply: sanitizeText(row.How_to_Apply),
    };
    const status = detectStatus(record.deadline);
    record.status = status;

    const filters = deriveFilters(record, workbookCategoryNames);
    const category = choosePrimaryCategory(record, filters);

    return {
      ...record,
      category,
      filters,
      deadlineDisplay: normalizeDeadlineDisplay(record.deadline),
      howToApplySteps: parseHowToApplySteps(record.howToApply),
      summary: firstNonEmpty(record.about, record.eligibility, record.benefits, record.award, record.detailedEligibility, record.howToApply) || 'Scholarship details imported from the CSV file.',
      deadlineDate: parseDeadline(record.deadline),
    };
  })
  .filter(Boolean)
  .sort((left, right) => {
    const leftDate = left.deadlineDate ? left.deadlineDate.getTime() : Number.POSITIVE_INFINITY;
    const rightDate = right.deadlineDate ? right.deadlineDate.getTime() : Number.POSITIVE_INFINITY;

    if (leftDate !== rightDate) {
      return leftDate - rightDate;
    }

    return left.title.localeCompare(right.title);
  });

export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
