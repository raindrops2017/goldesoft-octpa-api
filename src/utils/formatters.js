/**
 * Utility formatters for data sanitization and number formatting
 */

/**
 * Convert value to number (parseFloat), defaulting to 0 for null/undefined/NaN
 * @param {*} val 
 * @param {number} [fallback=0]
 * @returns {number}
 */
const toNumber = (val, fallback = 0) => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

/**
 * Format money/decimal values with specified decimal places (default: 4)
 * @param {number|string} val 
 * @param {number} decimals 
 * @returns {number}
 */
const formatMoney = (val, decimals = 4) => {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

/**
 * Trim trailing/leading whitespace from CHAR fields in MSSQL
 * @param {string} str 
 * @returns {string}
 */
const trimString = (str) => {
  if (str === null || str === undefined) return '';
  return String(str).trim();
};

/**
 * Format datetime to YYYY-MM-DD
 * @param {Date|string} dateVal 
 * @returns {string}
 */
const formatDate = (dateVal) => {
  if (!dateVal) return '';
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toISOString().split('T')[0];
  }
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return trimString(dateVal);
};

/**
 * Format time or datetime string to ISO local format (YYYY-MM-DDTHH:mm:ss)
 * @param {string|Date} timeOrDateStr 
 * @param {string} [baseDate] YYYY-MM-DD
 * @returns {string|null}
 */
const formatIsoDateTime = (timeOrDateStr, baseDate) => {
  if (!timeOrDateStr) return null;
  const str = String(timeOrDateStr).trim();
  if (!str) return null;

  // Match full datetime: YYYY[/|-]MM[/|-]DD H:mm:ss (AM|PM|A|P)?
  const fullMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM|A|P)?$/i);
  if (fullMatch) {
    let [, y, m, d, hh, mm, ss, meridiem] = fullMatch;
    let hour = parseInt(hh, 10);
    if (meridiem) {
      const isPm = meridiem.toUpperCase().startsWith('P');
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour === 12) hour = 0;
    }
    const sec = ss ? ss.padStart(2, '0') : '00';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${String(hour).padStart(2, '0')}:${mm.padStart(2, '0')}:${sec}`;
  }

  // Match time only: HH:mm[:ss] (AM|PM|A|P)?
  const timeMatch = str.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM|A|P)?$/i);
  if (timeMatch && baseDate) {
    let [, hh, mm, ss, meridiem] = timeMatch;
    let hour = parseInt(hh, 10);
    if (meridiem) {
      const isPm = meridiem.toUpperCase().startsWith('P');
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour === 12) hour = 0;
    }
    const sec = ss ? ss.padStart(2, '0') : '00';
    return `${baseDate}T${String(hour).padStart(2, '0')}:${mm.padStart(2, '0')}:${sec}`;
  }

  // If already contains T (e.g. ISO string)
  if (str.includes('T')) {
    return str.split('.')[0];
  }

  return baseDate ? `${baseDate}T${str}` : str;
};

module.exports = {
  toNumber,
  formatMoney,
  trimString,
  formatDate,
  formatIsoDateTime
};
