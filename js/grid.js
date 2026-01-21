/**
 * QueueMe - Grid Module
 * Handles the data grid component with keyboard navigation
 */

const Grid = {
  // DOM references
  _container: null,
  _table: null,
  _tbody: null,
  _emptyState: null,
  
  // Grid state
  _focusedCell: { row: 0, col: 0 },
  _isEditing: false,
  _editOriginalValue: null,
  
  // Column definitions
  COLUMNS: [
    { key: 'offset', label: 'Offset', editable: true, type: 'text' },
    { key: 'mediaType', label: 'Media Type', editable: true, type: 'select', options: Validation.VALID_MEDIA_TYPES },
    { key: 'title', label: 'Title', editable: true, type: 'text' },
    { key: 'artist', label: 'Artist', editable: true, type: 'text' },
    { key: 'album', label: 'Album', editable: true, type: 'text' },
    { key: 'year', label: 'Year', editable: true, type: 'text' }
  ],

  /**
   * Initialize the grid
   */
  init() {
    this._container = document.getElementById('grid-container');
    this._table = document.getElementById('data-grid');
    this._tbody = document.getElementById('grid-body');
    this._emptyState = document.getElementById('empty-state');
    
    // Set up keyboard navigation
    this._table.addEventListener('keydown', this._handleKeyDown.bind(this));
    
    // Set up click handling
    this._tbody.addEventListener('click', this._handleClick.bind(this));
    
    // Set up focus handling
    this._tbody.addEventListener('focusin', this._handleFocusIn.bind(this));
    
    // Subscribe to state changes
    State.subscribe((key) => {
      if (key === 'rows' || key === 'reset') {
        this.render();
      }
    });
  },

  /**
   * Render the grid
   */
  render() {
    const rows = State.getRows();
    
    // Toggle visibility
    if (rows.length === 0) {
      this._container.hidden = true;
      this._emptyState.hidden = false;
      A11y.updateRowCount(0);
      return;
    }
    
    this._container.hidden = false;
    this._emptyState.hidden = true;
    A11y.updateRowCount(rows.length);
    
    // Build rows HTML
    // Each cell contains a button element to ensure JAWS can focus and interact properly
    this._tbody.innerHTML = rows.map((row, rowIndex) => {
      const rowErrors = Validation.getFieldErrors(row, rows);
      const hasErrors = Object.keys(rowErrors).length > 0;
      
      return `
        <tr role="row" data-row-id="${row.id}" class="${hasErrors ? 'row-error' : ''}" aria-rowindex="${rowIndex + 2}">
          <td role="gridcell" class="col-row-num" aria-colindex="1">${rowIndex + 1}</td>
          ${this.COLUMNS.map((col, colIndex) => {
            const value = row[col.key] || '';
            const hasError = rowErrors[col.key];
            const cellId = `cell-${row.id}-${col.key}`;
            const headerId = `col-${col.key}`;
            // Use a focusable span with role="button" inside each cell for reliable JAWS focus
            return `
              <td role="gridcell"
                  id="${cellId}"
                  class="grid-cell ${hasError ? 'cell-error' : ''}"
                  data-row-index="${rowIndex}"
                  data-col-index="${colIndex}"
                  data-field="${col.key}"
                  aria-colindex="${colIndex + 2}"
                  headers="${headerId}"
                  ${hasError ? 'aria-describedby="' + cellId + '-error"' : ''}>
                <span class="cell-content"
                      tabindex="${rowIndex === 0 && colIndex === 0 ? '0' : '-1'}"
                      ${hasError ? 'aria-invalid="true"' : ''}
                      ${(!value || hasError) ? 'aria-label="' + this._escapeHtml(value || 'empty') + (hasError ? '. Error: ' + hasError : '') + '"' : ''}>
                  ${this._escapeHtml(value) || '<span class="cell-empty" aria-hidden="true">—</span>'}
                </span>
                ${hasError ? '<span id="' + cellId + '-error" class="visually-hidden">' + hasError + '</span>' : ''}
              </td>
            `;
          }).join('')}
          <td role="gridcell" class="col-actions" aria-colindex="${this.COLUMNS.length + 2}">
            <div class="row-actions">
              <button type="button" 
                      class="btn-delete-row" 
                      data-row-id="${row.id}"
                      aria-label="Delete row ${rowIndex + 1}: ${row.title || 'untitled'}"
                      title="Delete row">
                ×
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    // Set up delete button handlers
    this._tbody.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rowId = btn.dataset.rowId;
        this._confirmDelete(rowId);
      });
    });
    
    // Update export button state
    this._updateExportButton();
  },

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    // Find the focusable cell content (the inner span with role="button")
    const cellContent = e.target.closest('.cell-content');
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;
    
    const rowIndex = parseInt(cell.dataset.rowIndex, 10);
    const colIndex = parseInt(cell.dataset.colIndex, 10);
    const field = cell.dataset.field;
    const rows = State.getRows();
    
    // If editing, handle differently
    if (this._isEditing) {
      this._handleEditKeyDown(e, cell, rowIndex, colIndex);
      return;
    }
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this._moveFocus(rowIndex - 1, colIndex);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        this._moveFocus(rowIndex + 1, colIndex);
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        this._moveFocus(rowIndex, colIndex - 1);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        this._moveFocus(rowIndex, colIndex + 1);
        break;
        
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          this._moveFocus(0, 0);
        } else {
          this._moveFocus(rowIndex, 0);
        }
        break;
        
      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          this._moveFocus(rows.length - 1, this.COLUMNS.length - 1);
        } else {
          this._moveFocus(rowIndex, this.COLUMNS.length - 1);
        }
        break;
        
      case 'Enter':
      case 'F2':
        e.preventDefault();
        this._startEdit(cell, rowIndex, colIndex, field);
        break;
        
      case 'Delete':
        e.preventDefault();
        const row = rows[rowIndex];
        if (row) {
          this._confirmDelete(row.id);
        }
        break;
        
      case 'Insert':
        // Insert a new row above the current row
        e.preventDefault();
        this._insertRowAbove(rowIndex);
        break;
        
      case ' ':
        // Space also starts edit for accessibility
        e.preventDefault();
        this._startEdit(cell, rowIndex, colIndex, field);
        break;
    }
  },

  /**
   * Handle keyboard in edit mode
   * @param {KeyboardEvent} e
   * @param {HTMLElement} cell
   * @param {number} rowIndex
   * @param {number} colIndex
   */
  _handleEditKeyDown(e, cell, rowIndex, colIndex) {
    const field = cell.dataset.field;
    const timeBuilder = cell.querySelector('.grid-time-builder');
    
    // Special handling for time builder (offset field)
    if (field === 'offset' && timeBuilder) {
      const timeInputs = Array.from(timeBuilder.querySelectorAll('.grid-time-input'));
      const currentInput = e.target;
      const currentIndex = timeInputs.indexOf(currentInput);
      
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          this._saveEdit(cell, rowIndex, colIndex);
          break;
          
        case 'Escape':
          e.preventDefault();
          this._cancelEdit(cell);
          break;
          
        case 'Tab':
          // Allow Tab to move between time fields within the builder
          if (e.shiftKey) {
            // Shift+Tab: move to previous time field or exit
            if (currentIndex > 0) {
              e.preventDefault();
              timeInputs[currentIndex - 1].focus();
              timeInputs[currentIndex - 1].select();
            } else {
              // On first field, save and move to previous cell
              e.preventDefault();
              this._saveEdit(cell, rowIndex, colIndex);
              this._moveFocus(rowIndex, colIndex - 1);
            }
          } else {
            // Tab: move to next time field or save and move to next cell
            if (currentIndex < timeInputs.length - 1) {
              e.preventDefault();
              timeInputs[currentIndex + 1].focus();
              timeInputs[currentIndex + 1].select();
            } else {
              // On last field (ms), save and move to next cell
              e.preventDefault();
              this._saveEdit(cell, rowIndex, colIndex);
              this._moveFocus(rowIndex, colIndex + 1);
            }
          }
          break;
      }
      return;
    }
    
    // Standard input/select handling
    const input = cell.querySelector('input, select');
    if (!input) return;
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        this._saveEdit(cell, rowIndex, colIndex);
        
        // If on last column, add new row
        const rows = State.getRows();
        if (colIndex === this.COLUMNS.length - 1 && rowIndex === rows.length - 1) {
          // Focus will move to form for new entry
          Form.focusFirstField();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this._cancelEdit(cell);
        break;
        
      case 'Tab':
        e.preventDefault();
        this._saveEdit(cell, rowIndex, colIndex);
        if (e.shiftKey) {
          this._moveFocus(rowIndex, colIndex - 1);
        } else {
          this._moveFocus(rowIndex, colIndex + 1);
        }
        break;
    }
  },

  /**
   * Handle click on cell
   * @param {MouseEvent} e
   */
  _handleClick(e) {
    const cellContent = e.target.closest('.cell-content');
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;
    
    const rowIndex = parseInt(cell.dataset.rowIndex, 10);
    const colIndex = parseInt(cell.dataset.colIndex, 10);
    const field = cell.dataset.field;
    
    if (!this._isEditing) {
      // Focus the cell content span
      this._moveFocus(rowIndex, colIndex);
    }
    
    // Double-click to edit, or single click on the cell-content button
    if (e.detail === 2 || (cellContent && e.detail === 1)) {
      this._startEdit(cell, rowIndex, colIndex, field);
    }
  },

  /**
   * Handle focus entering a cell
   * @param {FocusEvent} e
   */
  _handleFocusIn(e) {
    const cell = e.target.closest('.grid-cell');
    if (cell) {
      this._focusedCell = {
        row: parseInt(cell.dataset.rowIndex, 10),
        col: parseInt(cell.dataset.colIndex, 10)
      };
    }
  },

  /**
   * Move focus to a cell
   * @param {number} rowIndex
   * @param {number} colIndex
   */
  _moveFocus(rowIndex, colIndex) {
    const rows = State.getRows();
    
    // Clamp to valid range
    rowIndex = Utils.clamp(rowIndex, 0, rows.length - 1);
    colIndex = Utils.clamp(colIndex, 0, this.COLUMNS.length - 1);
    
    const cell = this._tbody.querySelector(
      `[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`
    );
    
    if (cell) {
      // Update tabindex on all cell-content spans
      this._tbody.querySelectorAll('.cell-content[tabindex="0"]').forEach(c => {
        c.tabIndex = -1;
      });
      
      // Focus the inner span (cell-content) for reliable JAWS interaction
      const cellContent = cell.querySelector('.cell-content');
      if (cellContent) {
        cellContent.tabIndex = 0;
        cellContent.focus();
      }
      
      this._focusedCell = { row: rowIndex, col: colIndex };
    }
  },

  /**
   * Start editing a cell
   * @param {HTMLElement} cell
   * @param {number} rowIndex
   * @param {number} colIndex
   * @param {string} field
   */
  _startEdit(cell, rowIndex, colIndex, field) {
    if (this._isEditing) return;
    
    const rows = State.getRows();
    const row = rows[rowIndex];
    if (!row) return;
    
    const column = this.COLUMNS[colIndex];
    const currentValue = row[field] || '';
    
    this._isEditing = true;
    this._editOriginalValue = currentValue;
    cell.classList.add('editing');
    
    // Create input element
    let inputHtml;
    const inputId = `edit-${row.id}-${field}`;
    
    if (field === 'offset') {
      // Parse current offset value into components
      const match = currentValue.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
      const hours = match ? match[1] : '00';
      const minutes = match ? match[2] : '00';
      const seconds = match ? match[3] : '00';
      const ms = match ? match[4] : '000';
      
      // Create time builder interface
      inputHtml = `
        <fieldset class="grid-time-builder" role="group" aria-label="Edit offset time">
          <div class="grid-time-inputs">
            <label for="${inputId}-hours" class="visually-hidden">Hours</label>
            <input type="number" id="${inputId}-hours" class="grid-time-input" 
                   min="0" max="99" value="${hours}" aria-label="Hours"
                   data-time-component="hours">
            <span aria-hidden="true">:</span>
            <label for="${inputId}-minutes" class="visually-hidden">Minutes</label>
            <input type="number" id="${inputId}-minutes" class="grid-time-input" 
                   min="0" max="59" value="${minutes}" aria-label="Minutes"
                   data-time-component="minutes">
            <span aria-hidden="true">:</span>
            <label for="${inputId}-seconds" class="visually-hidden">Seconds</label>
            <input type="number" id="${inputId}-seconds" class="grid-time-input" 
                   min="0" max="59" value="${seconds}" aria-label="Seconds"
                   data-time-component="seconds">
            <span aria-hidden="true">.</span>
            <label for="${inputId}-ms" class="visually-hidden">Milliseconds</label>
            <input type="number" id="${inputId}-ms" class="grid-time-input grid-time-input-ms" 
                   min="0" max="999" value="${ms}" aria-label="Milliseconds"
                   data-time-component="ms">
          </div>
          <span class="visually-hidden">Use Tab to move between time fields. Press Enter to save, Escape to cancel.</span>
        </fieldset>
      `;
      
      cell.innerHTML = inputHtml;
      
      // Set up time input handlers
      const timeInputs = cell.querySelectorAll('.grid-time-input');
      timeInputs.forEach(input => {
        input.addEventListener('keydown', this._handleTimeInputKeyDown.bind(this));
        input.addEventListener('blur', this._handleTimeInputBlur.bind(this));
      });
      
      // Focus the hours input
      const hoursInput = cell.querySelector(`#${inputId}-hours`);
      hoursInput.focus();
      hoursInput.select();
      
      // Announce to screen readers
      A11y.announce(`Editing offset time. Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}, Milliseconds: ${ms}. Use Tab to move between fields, Enter to save, Escape to cancel.`, 'polite');
    } else if (column.type === 'select') {
      inputHtml = `
        <label for="${inputId}" class="visually-hidden">Edit ${column.label}</label>
        <select id="${inputId}" class="grid-cell-select" aria-describedby="${inputId}-help">
          ${column.options.map(opt => 
            `<option value="${opt}" ${opt === currentValue ? 'selected' : ''}>${opt}</option>`
          ).join('')}
        </select>
        <span id="${inputId}-help" class="visually-hidden">Press Enter to save, Escape to cancel</span>
      `;
      
      cell.innerHTML = inputHtml;
      
      const input = cell.querySelector('select');
      input.focus();
      
      // Announce to screen readers
      A11y.announce(`Editing ${column.label}. Current value: ${currentValue || 'empty'}. Press Enter to save, Escape to cancel.`, 'polite');
    } else {
      inputHtml = `
        <label for="${inputId}" class="visually-hidden">Edit ${column.label}</label>
        <input type="text" 
               id="${inputId}"
               class="grid-cell-input" 
               value="${this._escapeHtml(currentValue)}"
               aria-describedby="${inputId}-help">
        <span id="${inputId}-help" class="visually-hidden">Press Enter to save, Escape to cancel</span>
      `;
      
      cell.innerHTML = inputHtml;
      
      const input = cell.querySelector('input');
      input.focus();
      input.select();
      
      // Announce to screen readers
      A11y.announce(`Editing ${column.label}. Current value: ${currentValue || 'empty'}. Press Enter to save, Escape to cancel.`, 'polite');
    }
  },

  /**
   * Handle keydown in time builder inputs
   * @param {KeyboardEvent} e
   */
  _handleTimeInputKeyDown(e) {
    const input = e.target;
    const component = input.dataset.timeComponent;
    let value = parseInt(input.value, 10) || 0;
    
    let max, padLen;
    switch (component) {
      case 'hours':
        max = 99;
        padLen = 2;
        break;
      case 'minutes':
      case 'seconds':
        max = 59;
        padLen = 2;
        break;
      case 'ms':
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
   * Handle blur on time builder inputs (format values)
   * @param {FocusEvent} e
   */
  _handleTimeInputBlur(e) {
    const input = e.target;
    const component = input.dataset.timeComponent;
    let value = parseInt(input.value, 10) || 0;
    
    switch (component) {
      case 'hours':
        value = Validation.validateTimeComponent(value, 'hours');
        input.value = Utils.pad(value, 2);
        break;
      case 'minutes':
        value = Validation.validateTimeComponent(value, 'minutes');
        input.value = Utils.pad(value, 2);
        break;
      case 'seconds':
        value = Validation.validateTimeComponent(value, 'seconds');
        input.value = Utils.pad(value, 2);
        break;
      case 'ms':
        value = Validation.validateTimeComponent(value, 'milliseconds');
        input.value = Utils.pad(value, 3);
        break;
    }
  },

  /**
   * Save edit and exit edit mode
   * @param {HTMLElement} cell
   * @param {number} rowIndex
   * @param {number} colIndex
   */
  _saveEdit(cell, rowIndex, colIndex) {
    if (!this._isEditing) return;
    
    const rows = State.getRows();
    const row = rows[rowIndex];
    const field = cell.dataset.field;
    let newValue;
    
    // Handle time builder for offset field
    if (field === 'offset') {
      const timeBuilder = cell.querySelector('.grid-time-builder');
      if (timeBuilder) {
        const hours = parseInt(timeBuilder.querySelector('[data-time-component="hours"]').value, 10) || 0;
        const minutes = parseInt(timeBuilder.querySelector('[data-time-component="minutes"]').value, 10) || 0;
        const seconds = parseInt(timeBuilder.querySelector('[data-time-component="seconds"]').value, 10) || 0;
        const ms = parseInt(timeBuilder.querySelector('[data-time-component="ms"]').value, 10) || 0;
        newValue = Utils.buildOffset(hours, minutes, seconds, ms);
      } else {
        const input = cell.querySelector('input');
        newValue = input ? input.value.trim() : '';
      }
    } else {
      const input = cell.querySelector('input, select');
      if (!input) return;
      newValue = input.value.trim();
    }
    
    // Update state
    State.updateRow(row.id, { [field]: newValue });
    
    // Exit edit mode
    this._isEditing = false;
    this._editOriginalValue = null;
    
    // Re-render will happen via state subscription
    
    // Restore focus after render
    setTimeout(() => {
      this._moveFocus(rowIndex, colIndex);
      A11y.announce('Edit saved', 'polite');
    }, 50);
  },

  /**
   * Cancel edit and restore original value
   * @param {HTMLElement} cell
   */
  _cancelEdit(cell) {
    if (!this._isEditing) return;
    
    const rowIndex = parseInt(cell.dataset.rowIndex, 10);
    const colIndex = parseInt(cell.dataset.colIndex, 10);
    
    // Restore original value (via re-render)
    this._isEditing = false;
    this._editOriginalValue = null;
    
    // Re-render
    this.render();
    
    // Restore focus
    setTimeout(() => {
      this._moveFocus(rowIndex, colIndex);
      A11y.announce('Edit cancelled', 'polite');
    }, 50);
  },

  /**
   * Confirm row deletion
   * @param {string} rowId
   */
  _confirmDelete(rowId) {
    const row = State.getRow(rowId);
    if (!row) return;
    
    const rowIndex = State.getRowIndex(rowId);
    const title = row.title || 'this row';
    
    Modal.confirm(
      `Delete "${title}" (Row ${rowIndex + 1})?`,
      'Delete',
      () => {
        State.deleteRow(rowId);
        A11y.announce('Row deleted', 'polite');
        
        // Focus appropriate cell after deletion
        const rows = State.getRows();
        if (rows.length > 0) {
          const newRowIndex = Math.min(rowIndex, rows.length - 1);
          setTimeout(() => this._moveFocus(newRowIndex, 0), 50);
        }
      },
      { danger: true }
    );
  },

  /**
   * Update export button state
   */
  _updateExportButton() {
    const exportBtn = document.getElementById('btn-export');
    const clearBtn = document.getElementById('btn-clear-all');
    const hasRows = State.hasRows();
    
    if (exportBtn) {
      exportBtn.disabled = !hasRows;
    }
    if (clearBtn) {
      clearBtn.disabled = !hasRows;
    }
  },

  /**
   * Insert a new row above the current row
   * @param {number} rowIndex - Current row index
   */
  _insertRowAbove(rowIndex) {
    const rows = State.getRows();
    const currentRow = rows[rowIndex];
    
    if (!currentRow) return;
    
    // Create a new row with "talk" as default media type (for talk segments)
    const newRow = State.insertRowBefore(currentRow.id, {
      offset: '',
      mediaType: 'talk',
      title: '',
      artist: '',
      album: '',
      year: ''
    });
    
    // Announce to screen readers
    A11y.announce(`New row inserted above row ${rowIndex + 1}. Now editing offset.`, 'polite');
    
    // After render, focus the new row's first editable cell and start editing
    setTimeout(() => {
      this._moveFocus(rowIndex, 0);
      // Start editing the offset cell
      const cell = this._tbody.querySelector(
        `[data-row-index="${rowIndex}"][data-col-index="0"]`
      );
      if (cell) {
        this._startEdit(cell, rowIndex, 0, 'offset');
      }
    }, 100);
  },

  /**
   * Focus the first cell in the grid
   */
  focusFirstCell() {
    if (State.hasRows()) {
      this._moveFocus(0, 0);
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
