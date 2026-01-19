/**
 * QueueMe - Accessibility Module
 * Handles ARIA live regions, announcements, and error summary
 */

const A11y = {
  // Cache DOM references
  _livePolite: null,
  _liveAssertive: null,
  _errorSummary: null,
  _errorSummaryHeading: null,
  _errorSummaryList: null,

  /**
   * Initialize accessibility module
   */
  init() {
    this._livePolite = document.getElementById('live-region-polite');
    this._liveAssertive = document.getElementById('live-region-assertive');
    this._errorSummary = document.getElementById('error-summary');
    this._errorSummaryHeading = document.getElementById('error-summary-heading');
    this._errorSummaryList = document.getElementById('error-summary-list');
  },

  /**
   * Announce a message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    const region = priority === 'assertive' ? this._liveAssertive : this._livePolite;
    if (!region) return;
    
    // Clear and set after a brief delay to ensure announcement
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  },

  /**
   * Announce error to screen readers
   * @param {string} message
   */
  announceError(message) {
    this.announce(message, 'assertive');
  },

  /**
   * Announce success to screen readers
   * @param {string} message
   */
  announceSuccess(message) {
    this.announce(message, 'polite');
  },

  /**
   * Update the error summary region
   * @param {Array} errors - Array of {field, message, rowId?, rowNum?, fieldId?}
   */
  updateErrorSummary(errors) {
    if (!this._errorSummary) return;
    
    if (errors.length === 0) {
      this._errorSummary.hidden = true;
      return;
    }
    
    this._errorSummary.hidden = false;
    
    // Update heading
    const count = errors.length;
    this._errorSummaryHeading.textContent = 
      `${count} error${count > 1 ? 's' : ''} must be corrected before export`;
    
    // Update list
    this._errorSummaryList.innerHTML = errors.map(error => {
      const fieldId = error.fieldId || this.getFieldId(error);
      const location = error.rowNum ? `Row ${error.rowNum}: ` : '';
      return `<li><a href="#${fieldId}">${location}${error.message}</a></li>`;
    }).join('');
    
    // Announce
    this.announceError(`${count} error${count > 1 ? 's' : ''} found. Check error summary for details.`);
  },

  /**
   * Clear the error summary
   */
  clearErrorSummary() {
    if (this._errorSummary) {
      this._errorSummary.hidden = true;
    }
  },

  /**
   * Get field ID for error linking
   * @param {Object} error
   * @returns {string}
   */
  getFieldId(error) {
    // For grid cells
    if (error.rowId) {
      return `cell-${error.rowId}-${error.field}`;
    }
    // For form fields
    const formFieldIds = {
      offset: 'offset-hours',
      mediaType: 'media-type',
      title: 'title',
      artist: 'artist',
      album: 'album',
      year: 'year'
    };
    return formFieldIds[error.field] || error.field;
  },

  /**
   * Show inline error for a form field
   * @param {string} fieldId - Field element ID
   * @param {string} message - Error message
   */
  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorId = `${fieldId}-error`.replace(/-/g, '_');
    let errorEl = document.getElementById(`${fieldId.split('-')[0]}-error`);
    
    // Try common error element patterns
    if (!errorEl) {
      errorEl = document.getElementById(`${fieldId}-error`);
    }
    if (!errorEl && field) {
      // Look for sibling error element
      errorEl = field.parentElement.querySelector('.field-error');
    }
    
    if (field) {
      field.setAttribute('aria-invalid', 'true');
    }
    
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  },

  /**
   * Clear inline error for a form field
   * @param {string} fieldId - Field element ID
   */
  clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId.split('-')[0]}-error`) ||
                    document.getElementById(`${fieldId}-error`);
    
    if (field) {
      field.removeAttribute('aria-invalid');
    }
    
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  },

  /**
   * Clear all form errors
   */
  clearAllFormErrors() {
    const formFields = ['offset-hours', 'offset-minutes', 'offset-seconds', 'offset-ms',
                        'media-type', 'title', 'artist', 'album', 'year'];
    
    formFields.forEach(fieldId => {
      this.clearFieldError(fieldId);
    });
    
    // Also clear any .field-error elements
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.hidden = true;
    });
    
    // Remove aria-invalid from all form inputs
    document.querySelectorAll('[aria-invalid="true"]').forEach(el => {
      el.removeAttribute('aria-invalid');
    });
  },

  /**
   * Focus on a field and scroll into view
   * @param {string} fieldId
   */
  focusField(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.focus();
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  /**
   * Set up focus trap for modal
   * @param {HTMLElement} modal - Modal element
   * @returns {Function} Cleanup function
   */
  trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };
    
    modal.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }
    
    return () => {
      modal.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Update row count announcement
   * @param {number} count
   * @param {boolean} isNewImport - Whether this is from a fresh import
   */
  updateRowCount(count, isNewImport = false) {
    const countEl = document.getElementById('row-count');
    if (countEl) {
      countEl.textContent = `(${count} row${count !== 1 ? 's' : ''})`;
    }
    
    // For large imports, announce that the grid is ready and how to navigate
    if (isNewImport && count > 0) {
      setTimeout(() => {
        this.announce(`${count} row${count !== 1 ? 's' : ''} loaded. Use arrow keys to navigate the grid, Enter or Space to edit cells.`, 'polite');
      }, 500);
    }
  }
};
