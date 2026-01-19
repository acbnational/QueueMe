/**
 * QueueMe - Import Module
 * Handles CSV and XLSX file import with column mapping
 */

const Import = {
  // DOM references
  _modal: null,
  _dropzone: null,
  _fileInput: null,
  _mappingModal: null,
  _mappingBody: null,
  
  // Temporary import state
  _parsedData: null,
  _sourceHeaders: [],
  _currentMapping: null,

  /**
   * Initialize the import module
   */
  init() {
    this._modal = document.getElementById('modal-import');
    this._dropzone = document.getElementById('import-dropzone');
    this._fileInput = document.getElementById('file-input');
    this._mappingModal = document.getElementById('modal-mapping');
    this._mappingBody = document.getElementById('mapping-body');
    
    // File input change handler
    this._fileInput.addEventListener('change', this._handleFileSelect.bind(this));
    
    // Browse button
    document.getElementById('btn-browse-files').addEventListener('click', () => {
      this._fileInput.click();
    });
    
    // Dropzone handlers
    this._dropzone.addEventListener('dragover', this._handleDragOver.bind(this));
    this._dropzone.addEventListener('dragleave', this._handleDragLeave.bind(this));
    this._dropzone.addEventListener('drop', this._handleDrop.bind(this));
    
    // Dropzone keyboard support
    this._dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._fileInput.click();
      }
    });
    
    // Cancel import button
    document.getElementById('btn-cancel-import').addEventListener('click', () => {
      this.cancelImport();
    });
    
    // Mapping modal buttons
    document.getElementById('btn-cancel-mapping').addEventListener('click', () => {
      this.cancelMapping();
    });
    
    document.getElementById('btn-complete-mapping').addEventListener('click', () => {
      this.completeMapping();
    });
  },

  /**
   * Open the import dialog
   */
  openDialog() {
    // Reset file input
    this._fileInput.value = '';
    Modal.open('modal-import');
  },

  /**
   * Cancel import and close dialog
   */
  cancelImport() {
    this._parsedData = null;
    this._sourceHeaders = [];
    this._currentMapping = null;
    Modal.close();
  },

  /**
   * Handle drag over event
   * @param {DragEvent} e
   */
  _handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this._dropzone.classList.add('drag-over');
  },

  /**
   * Handle drag leave event
   * @param {DragEvent} e
   */
  _handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this._dropzone.classList.remove('drag-over');
  },

  /**
   * Handle file drop
   * @param {DragEvent} e
   */
  _handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this._dropzone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this._processFile(files[0]);
    }
  },

  /**
   * Handle file input selection
   * @param {Event} e
   */
  _handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this._processFile(files[0]);
    }
  },

  /**
   * Process uploaded file
   * @param {File} file
   */
  async _processFile(file) {
    const fileName = file.name.toLowerCase();
    
    // Validate file type
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
      A11y.announceError('Invalid file type. Please upload a CSV or XLSX file.');
      return;
    }
    
    try {
      A11y.announce('Processing file...', 'polite');
      
      let parsedData;
      
      if (fileName.endsWith('.xlsx')) {
        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
          A11y.announceError('XLSX support not available. Please use a CSV file or refresh the page.');
          return;
        }
        parsedData = await this._parseXlsx(file);
      } else {
        parsedData = await this._parseCsv(file);
      }
      
      // Validate we have data
      if (!parsedData.headers || parsedData.headers.length === 0) {
        A11y.announceError('No column headers found in file. The first row should contain column names.');
        return;
      }
      
      if (parsedData.rows.length === 0) {
        A11y.announceError('No data rows found in file. The file appears to contain only headers.');
        return;
      }
      
      // Log import info for debugging
      console.log('Import: Found columns:', parsedData.headers);
      console.log('Import: Found', parsedData.rows.length, 'data rows');
      
      // Store parsed data
      this._parsedData = parsedData;
      this._sourceHeaders = parsedData.headers;
      
      // Attempt auto-mapping
      this._currentMapping = CSV.autoMapColumns(parsedData.headers);
      
      console.log('Import: Auto-mapped columns:', this._currentMapping);
      
      // Check if mapping is complete
      const mappingCheck = CSV.checkMappingComplete(this._currentMapping);
      
      // Close import modal
      Modal.close(false);
      
      if (mappingCheck.complete) {
        // Auto-mapping successful, ask to confirm or show mapping UI
        this._showMappingUI();
      } else {
        // Show mapping UI
        this._showMappingUI();
      }
      
    } catch (error) {
      console.error('Import error:', error);
      
      // Provide more specific error messages
      if (error.message && error.message.includes('Encrypted')) {
        A11y.announceError('This file appears to be password-protected. Please provide an unprotected file.');
      } else if (error.message && error.message.includes('Unsupported')) {
        A11y.announceError('This file format is not supported. Please use a standard CSV or XLSX file.');
      } else if (error.name === 'TypeError') {
        A11y.announceError('Error processing file structure. The file may be corrupted or in an unexpected format.');
      } else {
        A11y.announceError(`Error reading file: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  },

  /**
   * Parse CSV file
   * @param {File} file
   * @returns {Promise<Object>}
   */
  _parseCsv(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const parsed = CSV.parse(text);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'UTF-8');
    });
  },

  /**
   * Parse XLSX file using SheetJS
   * @param {File} file
   * @returns {Promise<Object>}
   */
  _parseXlsx(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          // Convert to array of arrays
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          if (rows.length === 0) {
            resolve({ headers: [], rows: [] });
            return;
          }
          
          // First row is headers
          let headers = rows[0].map((h, index) => {
            const headerVal = String(h || '').trim();
            // If header is empty, generate a placeholder
            return headerVal || `Column ${index + 1}`;
          });
          
          const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
          
          // Detect columns that might contain time values (Excel decimal time)
          // and convert them to HH:MM:SS.mmm format
          const timeColumns = this._detectTimeColumns(dataRows, headers);
          
          // Convert data rows to string arrays, handling time conversion
          const stringRows = dataRows.map(row => 
            headers.map((header, i) => {
              const value = row[i];
              
              // Check if this is a potential time column with numeric value
              if (timeColumns.has(i) && typeof value === 'number' && value >= 0 && value < 1) {
                return this._excelTimeToOffset(value);
              }
              
              return String(value ?? '').trim();
            })
          );
          
          // If we detected time columns, update their headers to indicate they're time
          timeColumns.forEach(colIndex => {
            if (!headers[colIndex].toLowerCase().includes('time') && 
                !headers[colIndex].toLowerCase().includes('offset') &&
                !headers[colIndex].toLowerCase().includes('duration')) {
              // Check if it's a generic "Column X" header
              if (headers[colIndex].startsWith('Column ')) {
                headers[colIndex] = `Time (Column ${colIndex + 1})`;
              }
            }
          });
          
          resolve({ headers, rows: stringRows });
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Detect columns that likely contain Excel time values
   * @param {Array} rows - Data rows
   * @param {Array} headers - Column headers
   * @returns {Set} Set of column indices containing time values
   */
  _detectTimeColumns(rows, headers) {
    const timeColumns = new Set();
    const sampleSize = Math.min(10, rows.length);
    
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      let numericTimeCount = 0;
      let totalValues = 0;
      
      for (let rowIndex = 0; rowIndex < sampleSize; rowIndex++) {
        const row = rows[rowIndex];
        if (!row || colIndex >= row.length) continue;
        
        const value = row[colIndex];
        if (value === undefined || value === null || value === '') continue;
        
        totalValues++;
        
        // Check if it's a number that looks like Excel time (0 <= x < 1)
        // Excel represents time as fraction of a day
        if (typeof value === 'number' && value >= 0 && value < 1) {
          numericTimeCount++;
        }
      }
      
      // If most values in this column are numeric time-like values, mark it
      if (totalValues > 0 && numericTimeCount / totalValues >= 0.8) {
        timeColumns.add(colIndex);
      }
    }
    
    return timeColumns;
  },

  /**
   * Convert Excel decimal time to HH:MM:SS.mmm format
   * Excel represents time as fraction of a day (0.5 = 12:00:00)
   * @param {number} excelTime - Decimal time value
   * @returns {string} Formatted time string
   */
  _excelTimeToOffset(excelTime) {
    // Convert decimal day fraction to total milliseconds
    const totalMs = excelTime * 24 * 60 * 60 * 1000;
    
    const hours = Math.floor(totalMs / (60 * 60 * 1000));
    const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((totalMs % (60 * 1000)) / 1000);
    const milliseconds = Math.round(totalMs % 1000);
    
    // Format as HH:MM:SS.mmm
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const ms = String(milliseconds).padStart(3, '0');
    
    return `${hh}:${mm}:${ss}.${ms}`;
  },

  /**
   * Show the column mapping UI
   */
  _showMappingUI() {
    // Build mapping table
    // Only title is required for import - other fields can be added/edited later
    const fields = [
      { key: 'offset', label: 'Offset', required: false, note: 'required for export' },
      { key: 'mediaType', label: 'Media Type', required: false, note: 'defaults to music' },
      { key: 'title', label: 'Title', required: true },
      { key: 'artist', label: 'Artist', required: false, note: 'required for export' },
      { key: 'album', label: 'Album', required: false, note: 'required for export' },
      { key: 'year', label: 'Year', required: false }
    ];
    
    this._mappingBody.innerHTML = fields.map(field => {
      const currentValue = this._currentMapping[field.key] || '';
      const requiredBadge = field.required ? '<span class="mapping-required">(required)</span>' : '';
      const noteBadge = field.note ? `<span class="mapping-note">(${field.note})</span>` : '';
      
      return `
        <tr>
          <td>
            <label for="mapping-${field.key}">
              ${field.label} ${requiredBadge}${noteBadge}
            </label>
          </td>
          <td>
            <select id="mapping-${field.key}" class="select-input" data-field="${field.key}">
              <option value="">-- Select column --</option>
              ${this._sourceHeaders.map(header => 
                `<option value="${this._escapeHtml(header)}" ${header === currentValue ? 'selected' : ''}>${this._escapeHtml(header)}</option>`
              ).join('')}
            </select>
          </td>
        </tr>
      `;
    }).join('');
    
    // Clear any previous error
    document.getElementById('mapping-error').hidden = true;
    
    // Open mapping modal
    Modal.open('modal-mapping');
  },

  /**
   * Cancel mapping and return to import dialog
   */
  cancelMapping() {
    this._parsedData = null;
    this._sourceHeaders = [];
    this._currentMapping = null;
    Modal.close();
  },

  /**
   * Complete the mapping and import data
   */
  completeMapping() {
    // Gather mapping from UI
    const mapping = {};
    const fields = ['offset', 'mediaType', 'title', 'artist', 'album', 'year'];
    
    fields.forEach(field => {
      const select = document.getElementById(`mapping-${field}`);
      if (select) {
        mapping[field] = select.value || null;
      }
    });
    
    // Validate minimum required fields are mapped (just title for import)
    const check = CSV.checkImportMappingComplete(mapping);
    
    if (!check.complete) {
      const errorEl = document.getElementById('mapping-error');
      errorEl.textContent = `Required fields not mapped: ${check.missing.join(', ')}`;
      errorEl.hidden = false;
      A11y.announceError('Please map the Title field before importing.');
      return;
    }
    
    // Convert to row objects
    const rows = CSV.toRowObjects(this._parsedData, mapping);
    
    // Import rows
    State.importRows(rows);
    
    // Clean up
    this._parsedData = null;
    this._sourceHeaders = [];
    this._currentMapping = null;
    
    // Close modal
    Modal.close();
    
    // Announce success with navigation instructions for screen reader users
    A11y.announceSuccess(`Imported ${rows.length} rows. Use arrow keys to navigate the grid, Enter or Space to edit cells. Review and correct any errors before export.`);
    
    // Focus the first cell of the grid so JAWS users can start navigating immediately
    setTimeout(() => {
      Grid.focusFirstCell();
    }, 300);
    
    // Validate imported data
    this._validateImportedData();
  },

  /**
   * Validate imported data and show errors
   */
  _validateImportedData() {
    const rows = State.getRows();
    const validation = Validation.validateAllRows(rows);
    
    if (!validation.valid) {
      // Format errors for display
      const formattedErrors = validation.errors.map(error => ({
        ...error,
        fieldId: `cell-${error.rowId}-${error.field}`
      }));
      
      A11y.updateErrorSummary(formattedErrors);
    }
  },

  /**
   * Escape HTML for safe rendering
   * @param {string} text
   * @returns {string}
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
