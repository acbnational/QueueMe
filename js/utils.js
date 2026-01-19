/**
 * QueueMe - Utility Functions
 * Common helper functions used throughout the application
 */

const Utils = {
  /**
   * Generate a unique ID
   * @returns {string} UUID v4
   */
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Pad a number with leading zeros
   * @param {number} num - Number to pad
   * @param {number} len - Desired length
   * @returns {string} Padded string
   */
  pad(num, len = 2) {
    return String(num).padStart(len, '0');
  },

  /**
   * Parse offset string to milliseconds
   * @param {string} offset - Offset in HH:MM:SS.mmm format
   * @returns {number|null} Milliseconds or null if invalid
   */
  parseOffset(offset) {
    const match = offset.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
    if (!match) return null;
    const [, h, m, s, ms] = match.map(Number);
    return ((h * 60 + m) * 60 + s) * 1000 + ms;
  },

  /**
   * Format milliseconds to offset string
   * @param {number} ms - Milliseconds
   * @returns {string} Offset in HH:MM:SS.mmm format
   */
  formatOffset(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const milli = ms % 1000;
    return `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}.${this.pad(milli, 3)}`;
  },

  /**
   * Build offset string from component values
   * @param {number} hours
   * @param {number} minutes
   * @param {number} seconds
   * @param {number} milliseconds
   * @returns {string} Offset in HH:MM:SS.mmm format
   */
  buildOffset(hours, minutes, seconds, milliseconds) {
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}.${this.pad(milliseconds, 3)}`;
  },

  /**
   * Debounce a function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Sanitize a filename
   * @param {string} name - Filename to sanitize
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(name) {
    // Remove or replace invalid characters
    return name
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  /**
   * Ensure filename has .csv extension
   * @param {string} name - Filename
   * @returns {string} Filename with .csv extension
   */
  ensureCsvExtension(name) {
    if (!name.toLowerCase().endsWith('.csv')) {
      return name + '.csv';
    }
    return name;
  },

  /**
   * Check if a value is empty (null, undefined, or whitespace-only string)
   * @param {*} value
   * @returns {boolean}
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
  },

  /**
   * Clamp a number to a range
   * @param {number} num
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  /**
   * Get the next focusable element
   * @param {HTMLElement} container - Container to search within
   * @param {HTMLElement} current - Current focused element
   * @param {boolean} reverse - Search in reverse order
   * @returns {HTMLElement|null}
   */
  getNextFocusable(container, current, reverse = false) {
    const focusables = Array.from(container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    
    const currentIndex = focusables.indexOf(current);
    if (currentIndex === -1) return focusables[0] || null;
    
    const nextIndex = reverse 
      ? (currentIndex - 1 + focusables.length) % focusables.length
      : (currentIndex + 1) % focusables.length;
    
    return focusables[nextIndex] || null;
  }
};

// Freeze the Utils object to prevent modifications
Object.freeze(Utils);
