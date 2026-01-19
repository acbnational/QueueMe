/**
 * QueueMe - Validation Module
 * Handles all validation logic for cue sheet rows
 */

const Validation = {
  // Valid media types (lowercase)
  VALID_MEDIA_TYPES: ['music', 'talk', 'id', 'promo', 'ad'],
  
  // Year range
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,
  
  // Max field lengths
  MAX_FIELD_LENGTH: 500,

  // Media types that require artist field (music and talk)
  ARTIST_REQUIRED_TYPES: ['music', 'talk'],

  /**
   * Validate a complete row
   * Per Live365 MultiTrack CSV requirements:
   * - Required: offset, media_type, title, artist (artist only for music/talk)
   * - Optional: album, year
   * @param {Object} row - Row data
   * @param {Array} allRows - All existing rows (for duplicate check)
   * @returns {Array} Array of error objects {field, message}
   */
  validateRow(row, allRows = []) {
    const errors = [];
    
    // Offset validation
    const offsetErrors = this.validateOffset(row.offset, row.id, allRows);
    errors.push(...offsetErrors);
    
    // Media type validation
    const mediaTypeErrors = this.validateMediaType(row.mediaType);
    errors.push(...mediaTypeErrors);
    
    // Title validation (always required)
    const titleErrors = this.validateRequiredField(row.title, 'title', 'Title');
    errors.push(...titleErrors);
    
    // Artist validation - required only for music and talk types per Live365 docs
    const normalizedType = (row.mediaType || '').toLowerCase().trim();
    if (this.ARTIST_REQUIRED_TYPES.includes(normalizedType)) {
      const artistErrors = this.validateRequiredField(row.artist, 'artist', 'Artist');
      errors.push(...artistErrors);
    } else {
      // For non-music/talk types, validate length only if provided
      const artistErrors = this.validateOptionalField(row.artist, 'artist', 'Artist');
      errors.push(...artistErrors);
    }
    
    // Album validation (optional per Live365 docs)
    const albumErrors = this.validateOptionalField(row.album, 'album', 'Album');
    errors.push(...albumErrors);
    
    // Year validation (optional)
    const yearErrors = this.validateYear(row.year);
    errors.push(...yearErrors);
    
    return errors;
  },

  /**
   * Validate offset field
   * @param {string} offset - Offset value
   * @param {string} rowId - Current row ID (for duplicate exclusion)
   * @param {Array} allRows - All existing rows
   * @returns {Array} Array of error objects
   */
  validateOffset(offset, rowId, allRows = []) {
    const errors = [];
    
    if (Utils.isEmpty(offset)) {
      errors.push({
        field: 'offset',
        message: 'Offset is required'
      });
      return errors;
    }
    
    if (!this.isValidOffsetFormat(offset)) {
      errors.push({
        field: 'offset',
        message: 'Offset must be in HH:MM:SS.mmm format (e.g., 00:03:45.000)'
      });
      return errors;
    }
    
    // Check for duplicates
    const duplicate = this.findDuplicateOffset(offset, rowId, allRows);
    if (duplicate) {
      errors.push({
        field: 'offset',
        message: `Offset ${offset} is already used in row ${duplicate.rowNum}`
      });
    }
    
    return errors;
  },

  /**
   * Check if offset format is valid
   * @param {string} offset
   * @returns {boolean}
   */
  isValidOffsetFormat(offset) {
    if (!offset) return false;
    const match = offset.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
    if (!match) return false;
    
    const [, h, m, s] = match.map(Number);
    // Validate ranges
    if (m > 59 || s > 59) return false;
    
    return true;
  },

  /**
   * Find duplicate offset in existing rows
   * @param {string} offset - Offset to check
   * @param {string} excludeId - Row ID to exclude from check
   * @param {Array} allRows - All rows to check against
   * @returns {Object|null} Duplicate row info or null
   */
  findDuplicateOffset(offset, excludeId, allRows) {
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      if (row.id !== excludeId && row.offset === offset) {
        return {
          rowId: row.id,
          rowNum: i + 1
        };
      }
    }
    return null;
  },

  /**
   * Validate media type field
   * @param {string} mediaType
   * @returns {Array} Array of error objects
   */
  validateMediaType(mediaType) {
    const errors = [];
    
    if (Utils.isEmpty(mediaType)) {
      errors.push({
        field: 'mediaType',
        message: 'Media type is required'
      });
      return errors;
    }
    
    const normalized = mediaType.toLowerCase().trim();
    if (!this.VALID_MEDIA_TYPES.includes(normalized)) {
      errors.push({
        field: 'mediaType',
        message: `Media type must be one of: ${this.VALID_MEDIA_TYPES.join(', ')}`
      });
    }
    
    return errors;
  },

  /**
   * Normalize media type to lowercase
   * @param {string} mediaType
   * @returns {string|null}
   */
  normalizeMediaType(mediaType) {
    if (Utils.isEmpty(mediaType)) return null;
    const normalized = mediaType.toLowerCase().trim();
    return this.VALID_MEDIA_TYPES.includes(normalized) ? normalized : null;
  },

  /**
   * Validate a required text field
   * @param {string} value - Field value
   * @param {string} fieldName - Field name for error messages
   * @param {string} displayName - Human-readable field name
   * @returns {Array} Array of error objects
   */
  validateRequiredField(value, fieldName, displayName) {
    const errors = [];
    
    if (Utils.isEmpty(value)) {
      errors.push({
        field: fieldName,
        message: `${displayName} is required`
      });
      return errors;
    }
    
    if (value.length > this.MAX_FIELD_LENGTH) {
      errors.push({
        field: fieldName,
        message: `${displayName} must be ${this.MAX_FIELD_LENGTH} characters or less`
      });
    }
    
    return errors;
  },

  /**
   * Validate an optional text field (only checks length if provided)
   * @param {string} value - Field value
   * @param {string} fieldName - Field name for error messages
   * @param {string} displayName - Human-readable field name
   * @returns {Array} Array of error objects
   */
  validateOptionalField(value, fieldName, displayName) {
    const errors = [];
    
    // Optional field - empty is valid
    if (Utils.isEmpty(value)) {
      return errors;
    }
    
    if (value.length > this.MAX_FIELD_LENGTH) {
      errors.push({
        field: fieldName,
        message: `${displayName} must be ${this.MAX_FIELD_LENGTH} characters or less`
      });
    }
    
    return errors;
  },

  /**
   * Validate year field (optional)
   * @param {string} year
   * @returns {Array} Array of error objects
   */
  validateYear(year) {
    const errors = [];
    
    // Year is optional - empty is valid
    if (Utils.isEmpty(year)) {
      return errors;
    }
    
    // Must be 4 digits
    if (!/^\d{4}$/.test(year)) {
      errors.push({
        field: 'year',
        message: 'Year must be a 4-digit number'
      });
      return errors;
    }
    
    // Must be in valid range
    const yearNum = parseInt(year, 10);
    if (yearNum < this.MIN_YEAR || yearNum > this.MAX_YEAR) {
      errors.push({
        field: 'year',
        message: `Year must be between ${this.MIN_YEAR} and ${this.MAX_YEAR}`
      });
    }
    
    return errors;
  },

  /**
   * Validate all rows for export
   * @param {Array} rows - All rows to validate
   * @returns {Object} {valid: boolean, errors: Array}
   */
  validateAllRows(rows) {
    const allErrors = [];
    
    rows.forEach((row, index) => {
      const rowErrors = this.validateRow(row, rows);
      rowErrors.forEach(error => {
        allErrors.push({
          ...error,
          rowId: row.id,
          rowNum: index + 1
        });
      });
    });
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  },

  /**
   * Validate individual time component
   * @param {number} value - Value to validate
   * @param {string} type - 'hours', 'minutes', 'seconds', or 'milliseconds'
   * @returns {number} Clamped valid value
   */
  validateTimeComponent(value, type) {
    const num = parseInt(value, 10) || 0;
    switch (type) {
      case 'hours':
        return Utils.clamp(num, 0, 99);
      case 'minutes':
      case 'seconds':
        return Utils.clamp(num, 0, 59);
      case 'milliseconds':
        return Utils.clamp(num, 0, 999);
      default:
        return num;
    }
  },

  /**
   * Check if a row has any errors
   * @param {Object} row - Row to check
   * @param {Array} allRows - All rows for duplicate check
   * @returns {boolean}
   */
  hasErrors(row, allRows = []) {
    return this.validateRow(row, allRows).length > 0;
  },

  /**
   * Get field-specific errors for a row
   * @param {Object} row - Row to check
   * @param {Array} allRows - All rows for duplicate check
   * @returns {Object} Map of field name to error message
   */
  getFieldErrors(row, allRows = []) {
    const errors = this.validateRow(row, allRows);
    const fieldErrors = {};
    errors.forEach(error => {
      if (!fieldErrors[error.field]) {
        fieldErrors[error.field] = error.message;
      }
    });
    return fieldErrors;
  }
};

// Freeze the Validation object
Object.freeze(Validation);
