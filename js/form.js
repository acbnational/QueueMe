/**
 * QueueMe - Form Module
 * Handles the Quick Add form
 */

const Form = {
  // DOM references
  _form: null,
  _hoursInput: null,
  _minutesInput: null,
  _secondsInput: null,
  _msInput: null,
  _mediaTypeInput: null,
  _titleInput: null,
  _artistInput: null,
  _albumInput: null,
  _yearInput: null,
  _addButton: null,

  /**
   * Initialize the form
   */
  init() {
    this._form = document.getElementById('quick-add-form');
    this._hoursInput = document.getElementById('offset-hours');
    this._minutesInput = document.getElementById('offset-minutes');
    this._secondsInput = document.getElementById('offset-seconds');
    this._msInput = document.getElementById('offset-ms');
    this._mediaTypeInput = document.getElementById('media-type');
    this._titleInput = document.getElementById('title');
    this._artistInput = document.getElementById('artist');
    this._albumInput = document.getElementById('album');
    this._yearInput = document.getElementById('year');
    this._addButton = document.getElementById('btn-add-row');
    
    // Set up event listeners
    this._form.addEventListener('submit', this._handleSubmit.bind(this));
    
    // Time input validation
    [this._hoursInput, this._minutesInput, this._secondsInput, this._msInput].forEach(input => {
      input.addEventListener('input', this._handleTimeInput.bind(this));
      input.addEventListener('blur', this._handleTimeBlur.bind(this));
      input.addEventListener('keydown', this._handleTimeKeyDown.bind(this));
    });
    
    // Clear errors on input
    [this._titleInput, this._artistInput, this._albumInput, this._yearInput].forEach(input => {
      input.addEventListener('input', () => {
        this._clearFieldError(input.id);
      });
    });
  },

  /**
   * Handle form submission
   * @param {Event} e
   */
  _handleSubmit(e) {
    e.preventDefault();
    
    // Build offset string
    const offset = this._buildOffset();
    
    // Get form values
    const rowData = {
      offset: offset,
      mediaType: this._mediaTypeInput.value,
      title: this._titleInput.value.trim(),
      artist: this._artistInput.value.trim(),
      album: this._albumInput.value.trim(),
      year: this._yearInput.value.trim()
    };
    
    // Validate
    const errors = Validation.validateRow(rowData, State.getRows());
    
    if (errors.length > 0) {
      this._showErrors(errors);
      return;
    }
    
    // Add row
    State.addRow(rowData);
    
    // Clear form
    this._clearForm();
    
    // Announce success
    A11y.announceSuccess(`Added "${rowData.title}" to the cue sheet`);
    
    // Focus first field for next entry
    this.focusFirstField();
  },

  /**
   * Build offset string from time inputs
   * @returns {string}
   */
  _buildOffset() {
    const hours = parseInt(this._hoursInput.value, 10) || 0;
    const minutes = parseInt(this._minutesInput.value, 10) || 0;
    const seconds = parseInt(this._secondsInput.value, 10) || 0;
    const ms = parseInt(this._msInput.value, 10) || 0;
    
    return Utils.buildOffset(hours, minutes, seconds, ms);
  },

  /**
   * Handle time input changes
   * @param {Event} e
   */
  _handleTimeInput(e) {
    const input = e.target;
    const id = input.id;
    let value = input.value.replace(/\D/g, '');
    
    // Limit length
    let maxLength = 2;
    if (id === 'offset-ms') {
      maxLength = 3;
    }
    
    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
    }
    
    input.value = value;
    
    // Clear error
    this._clearFieldError('offset-hours');
  },

  /**
   * Handle time input blur (format/validate)
   * @param {Event} e
   */
  _handleTimeBlur(e) {
    const input = e.target;
    const id = input.id;
    let value = parseInt(input.value, 10) || 0;
    
    // Validate ranges
    switch (id) {
      case 'offset-hours':
        value = Validation.validateTimeComponent(value, 'hours');
        input.value = Utils.pad(value, 2);
        break;
      case 'offset-minutes':
        value = Validation.validateTimeComponent(value, 'minutes');
        input.value = Utils.pad(value, 2);
        break;
      case 'offset-seconds':
        value = Validation.validateTimeComponent(value, 'seconds');
        input.value = Utils.pad(value, 2);
        break;
      case 'offset-ms':
        value = Validation.validateTimeComponent(value, 'milliseconds');
        input.value = Utils.pad(value, 3);
        break;
    }
  },

  /**
   * Handle arrow keys in time inputs
   * @param {KeyboardEvent} e
   */
  _handleTimeKeyDown(e) {
    const input = e.target;
    const id = input.id;
    let value = parseInt(input.value, 10) || 0;
    
    let max, padLen;
    switch (id) {
      case 'offset-hours':
        max = 99;
        padLen = 2;
        break;
      case 'offset-minutes':
      case 'offset-seconds':
        max = 59;
        padLen = 2;
        break;
      case 'offset-ms':
        max = 999;
        padLen = 3;
        break;
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      value = (value + 1) % (max + 1);
      input.value = Utils.pad(value, padLen);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      value = value > 0 ? value - 1 : max;
      input.value = Utils.pad(value, padLen);
    }
  },

  /**
   * Show validation errors
   * @param {Array} errors
   */
  _showErrors(errors) {
    A11y.clearAllFormErrors();
    
    const errorSummary = [];
    
    errors.forEach(error => {
      const fieldId = this._getFieldId(error.field);
      this._showFieldError(fieldId, error.message);
      errorSummary.push({
        field: error.field,
        message: error.message,
        fieldId: fieldId
      });
    });
    
    // Update error summary
    A11y.updateErrorSummary(errorSummary);
    
    // Focus first error field
    if (errorSummary.length > 0) {
      A11y.focusField(errorSummary[0].fieldId);
    }
  },

  /**
   * Get form field ID from field name
   * @param {string} field
   * @returns {string}
   */
  _getFieldId(field) {
    const fieldMap = {
      offset: 'offset-hours',
      mediaType: 'media-type',
      title: 'title',
      artist: 'artist',
      album: 'album',
      year: 'year'
    };
    return fieldMap[field] || field;
  },

  /**
   * Show error for a specific field
   * @param {string} fieldId
   * @param {string} message
   */
  _showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Set aria-invalid
    field.setAttribute('aria-invalid', 'true');
    
    // For offset, mark all time inputs
    if (fieldId === 'offset-hours') {
      [this._hoursInput, this._minutesInput, this._secondsInput, this._msInput].forEach(input => {
        input.setAttribute('aria-invalid', 'true');
      });
    }
    
    // Find error element
    let errorId;
    if (fieldId.startsWith('offset-')) {
      errorId = 'offset-error';
    } else {
      errorId = `${fieldId}-error`;
    }
    
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  },

  /**
   * Clear error for a specific field
   * @param {string} fieldId
   */
  _clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.removeAttribute('aria-invalid');
    }
    
    // For offset, clear all time inputs
    if (fieldId.startsWith('offset-')) {
      [this._hoursInput, this._minutesInput, this._secondsInput, this._msInput].forEach(input => {
        input.removeAttribute('aria-invalid');
      });
      const errorEl = document.getElementById('offset-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.hidden = true;
      }
    } else {
      const errorEl = document.getElementById(`${fieldId}-error`);
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.hidden = true;
      }
    }
    
    // Clear error summary if no more form errors
    A11y.clearErrorSummary();
  },

  /**
   * Clear the form
   */
  _clearForm() {
    this._hoursInput.value = '00';
    this._minutesInput.value = '00';
    this._secondsInput.value = '00';
    this._msInput.value = '000';
    this._mediaTypeInput.value = 'music';
    this._titleInput.value = '';
    this._artistInput.value = '';
    this._albumInput.value = '';
    this._yearInput.value = '';
    
    A11y.clearAllFormErrors();
    A11y.clearErrorSummary();
  },

  /**
   * Focus the first field (hours input)
   */
  focusFirstField() {
    if (this._hoursInput) {
      this._hoursInput.focus();
      this._hoursInput.select();
    }
  },

  /**
   * Reset the form completely
   */
  reset() {
    this._clearForm();
  },

  /**
   * Set form values (for editing)
   * @param {Object} values
   */
  setValues(values) {
    if (values.offset) {
      const match = values.offset.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
      if (match) {
        this._hoursInput.value = match[1];
        this._minutesInput.value = match[2];
        this._secondsInput.value = match[3];
        this._msInput.value = match[4];
      }
    }
    if (values.mediaType) {
      this._mediaTypeInput.value = values.mediaType;
    }
    if (values.title !== undefined) {
      this._titleInput.value = values.title;
    }
    if (values.artist !== undefined) {
      this._artistInput.value = values.artist;
    }
    if (values.album !== undefined) {
      this._albumInput.value = values.album;
    }
    if (values.year !== undefined) {
      this._yearInput.value = values.year;
    }
  }
};
