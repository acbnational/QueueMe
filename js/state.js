/**
 * QueueMe - State Management
 * Central state management for the application
 */

const State = {
  // Application state
  _state: {
    fileName: '',
    rows: [],
    editingCell: null,
    selectedRowId: null,
    importData: null,
    hasUnsavedChanges: false
  },

  // State change listeners
  _listeners: [],

  /**
   * Get current state (read-only copy)
   * @returns {Object}
   */
  get() {
    return { ...this._state };
  },

  /**
   * Get current filename
   * @returns {string}
   */
  getFileName() {
    return this._state.fileName;
  },

  /**
   * Set filename
   * @param {string} name
   */
  setFileName(name) {
    this._state.fileName = Utils.sanitizeFilename(name);
    this._notify('fileName');
  },

  /**
   * Get all rows
   * @returns {Array}
   */
  getRows() {
    return [...this._state.rows];
  },

  /**
   * Get row by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getRow(id) {
    const row = this._state.rows.find(r => r.id === id);
    return row ? { ...row } : null;
  },

  /**
   * Get row index by ID
   * @param {string} id
   * @returns {number}
   */
  getRowIndex(id) {
    return this._state.rows.findIndex(r => r.id === id);
  },

  /**
   * Add a new row
   * @param {Object} rowData - Row data without ID
   * @returns {Object} The added row with ID
   */
  addRow(rowData) {
    const row = {
      id: Utils.generateId(),
      offset: rowData.offset || '',
      mediaType: rowData.mediaType || 'music',
      title: rowData.title || '',
      artist: rowData.artist || '',
      album: rowData.album || '',
      year: rowData.year || ''
    };
    
    this._state.rows.push(row);
    this._state.hasUnsavedChanges = true;
    this._notify('rows');
    
    return { ...row };
  },

  /**
   * Insert a new row before a specific row
   * @param {string} beforeId - ID of the row to insert before
   * @param {Object} rowData - Row data without ID
   * @returns {Object} The inserted row with ID
   */
  insertRowBefore(beforeId, rowData) {
    const row = {
      id: Utils.generateId(),
      offset: rowData.offset || '',
      mediaType: rowData.mediaType || 'talk',
      title: rowData.title || '',
      artist: rowData.artist || '',
      album: rowData.album || '',
      year: rowData.year || ''
    };
    
    const index = this._state.rows.findIndex(r => r.id === beforeId);
    if (index === -1) {
      // If not found, add to end
      this._state.rows.push(row);
    } else {
      // Insert before the specified row
      this._state.rows.splice(index, 0, row);
    }
    
    this._state.hasUnsavedChanges = true;
    this._notify('rows');
    
    return { ...row };
  },

  /**
   * Update a row
   * @param {string} id - Row ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success
   */
  updateRow(id, updates) {
    const index = this._state.rows.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this._state.rows[index] = {
      ...this._state.rows[index],
      ...updates
    };
    
    this._state.hasUnsavedChanges = true;
    this._notify('rows');
    
    return true;
  },

  /**
   * Delete a row
   * @param {string} id - Row ID
   * @returns {boolean} Success
   */
  deleteRow(id) {
    const index = this._state.rows.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this._state.rows.splice(index, 1);
    this._state.hasUnsavedChanges = true;
    this._notify('rows');
    
    return true;
  },

  /**
   * Clear all rows
   */
  clearAllRows() {
    this._state.rows = [];
    this._state.hasUnsavedChanges = false;
    this._notify('rows');
  },

  /**
   * Import multiple rows
   * @param {Array} rows - Array of row objects
   */
  importRows(rows) {
    // Ensure each row has an ID
    const rowsWithIds = rows.map(row => ({
      id: row.id || Utils.generateId(),
      offset: row.offset || '',
      mediaType: row.mediaType || 'music',
      title: row.title || '',
      artist: row.artist || '',
      album: row.album || '',
      year: row.year || ''
    }));
    
    this._state.rows = rowsWithIds;
    this._state.hasUnsavedChanges = true;
    this._notify('rows');
  },

  /**
   * Set editing cell
   * @param {string|null} rowId
   * @param {string|null} field
   */
  setEditingCell(rowId, field) {
    this._state.editingCell = rowId && field ? { rowId, field } : null;
    this._notify('editingCell');
  },

  /**
   * Get editing cell
   * @returns {Object|null}
   */
  getEditingCell() {
    return this._state.editingCell;
  },

  /**
   * Set selected row
   * @param {string|null} rowId
   */
  setSelectedRow(rowId) {
    this._state.selectedRowId = rowId;
    this._notify('selectedRow');
  },

  /**
   * Get selected row ID
   * @returns {string|null}
   */
  getSelectedRowId() {
    return this._state.selectedRowId;
  },

  /**
   * Store import data temporarily
   * @param {Object} data - Parsed import data
   */
  setImportData(data) {
    this._state.importData = data;
  },

  /**
   * Get import data
   * @returns {Object|null}
   */
  getImportData() {
    return this._state.importData;
  },

  /**
   * Clear import data
   */
  clearImportData() {
    this._state.importData = null;
  },

  /**
   * Check if there are unsaved changes
   * @returns {boolean}
   */
  hasUnsavedChanges() {
    return this._state.hasUnsavedChanges && this._state.rows.length > 0;
  },

  /**
   * Mark changes as saved
   */
  markSaved() {
    this._state.hasUnsavedChanges = false;
  },

  /**
   * Reset state for new session
   */
  reset() {
    this._state = {
      fileName: '',
      rows: [],
      editingCell: null,
      selectedRowId: null,
      importData: null,
      hasUnsavedChanges: false
    };
    this._notify('reset');
  },

  /**
   * Get row count
   * @returns {number}
   */
  getRowCount() {
    return this._state.rows.length;
  },

  /**
   * Check if rows exist
   * @returns {boolean}
   */
  hasRows() {
    return this._state.rows.length > 0;
  },

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function(changedKey)
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  },

  /**
   * Notify listeners of state change
   * @param {string} key - Changed state key
   * @private
   */
  _notify(key) {
    this._listeners.forEach(callback => {
      try {
        callback(key);
      } catch (e) {
        console.error('State listener error:', e);
      }
    });
  }
};

// Don't freeze State since it needs to mutate _state
