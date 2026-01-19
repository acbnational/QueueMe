/**
 * QueueMe - Main Application
 * Application initialization and global event handling
 */

const App = {
  /**
   * Initialize the application
   */
  init() {
    // Initialize modules
    A11y.init();
    Form.init();
    Grid.init();
    Import.init();
    
    // Set up header button handlers
    this._setupHeaderButtons();
    
    // Set up keyboard shortcuts
    this._setupKeyboardShortcuts();
    
    // Set up clear all button
    this._setupClearAllButton();
    
    // Subscribe to state changes
    State.subscribe((key) => {
      if (key === 'fileName') {
        this._updateFileNameDisplay();
      }
    });
    
    // Show new session modal on load
    this._showNewSessionModal();
  },

  /**
   * Set up header button handlers
   */
  _setupHeaderButtons() {
    // New button
    document.getElementById('btn-new').addEventListener('click', () => {
      this._handleNewSession();
    });
    
    // Import button
    document.getElementById('btn-import').addEventListener('click', () => {
      Import.openDialog();
    });
    
    // Export button
    document.getElementById('btn-export').addEventListener('click', () => {
      this._handleExport();
    });
  },

  /**
   * Set up keyboard shortcuts
   */
  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when in input/textarea or modal is open
      const isInInput = e.target.tagName === 'INPUT' || 
                        e.target.tagName === 'TEXTAREA' || 
                        e.target.tagName === 'SELECT';
      
      // Ctrl+S: Export
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this._handleExport();
      }
      
      // Ctrl+N: New session
      if (e.ctrlKey && e.key === 'n' && !isInInput) {
        e.preventDefault();
        this._handleNewSession();
      }
      
      // Ctrl+I: Import
      if (e.ctrlKey && e.key === 'i' && !isInInput) {
        e.preventDefault();
        Import.openDialog();
      }
    });
  },

  /**
   * Set up clear all button
   */
  _setupClearAllButton() {
    document.getElementById('btn-clear-all').addEventListener('click', () => {
      if (!State.hasRows()) return;
      
      Modal.confirm(
        'Clear all rows? This cannot be undone.',
        'Clear All',
        () => {
          State.clearAllRows();
          A11y.clearErrorSummary();
          A11y.announceSuccess('All rows cleared');
          Form.focusFirstField();
        },
        { danger: true }
      );
    });
  },

  /**
   * Show new session modal
   */
  _showNewSessionModal() {
    const modal = document.getElementById('modal-new-session');
    const form = document.getElementById('new-session-form');
    const input = document.getElementById('new-file-name');
    const cancelBtn = document.getElementById('btn-cancel-new');
    
    // Set default filename with date
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${Utils.pad(today.getMonth() + 1)}-${Utils.pad(today.getDate())}`;
    input.value = `cue-sheet-${dateStr}`;
    
    // Handle form submission
    const handleSubmit = (e) => {
      e.preventDefault();
      const fileName = input.value.trim();
      
      if (!fileName) {
        A11y.announceError('Please enter a file name');
        input.focus();
        return;
      }
      
      State.setFileName(fileName);
      Modal.close();
      
      // Focus on first form field
      setTimeout(() => {
        Form.focusFirstField();
        A11y.announceSuccess(`New cue sheet "${fileName}" created. Start adding songs.`);
      }, 100);
    };
    
    // Handle cancel (for when there's existing data)
    const handleCancel = () => {
      Modal.close();
    };
    
    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', handleCancel);
    
    // Show modal
    Modal.open('modal-new-session', {
      onOpen: () => {
        input.focus();
        input.select();
      }
    });
  },

  /**
   * Handle new session button click
   */
  _handleNewSession() {
    if (State.hasUnsavedChanges()) {
      Modal.confirm(
        'Start a new cue sheet? Any unsaved data will be lost.',
        'Start New',
        () => {
          State.reset();
          Form.reset();
          A11y.clearErrorSummary();
          this._showNewSessionModal();
        },
        { danger: true }
      );
    } else {
      State.reset();
      Form.reset();
      A11y.clearErrorSummary();
      this._showNewSessionModal();
    }
  },

  /**
   * Handle export button click
   */
  _handleExport() {
    // Check if we have rows
    if (!State.hasRows()) {
      A11y.announceError('No data to export. Add rows first.');
      return;
    }
    
    // Validate all rows
    const rows = State.getRows();
    const validation = Validation.validateAllRows(rows);
    
    if (!validation.valid) {
      // Show errors
      const formattedErrors = validation.errors.map(error => ({
        ...error,
        fieldId: `cell-${error.rowId}-${error.field}`
      }));
      
      A11y.updateErrorSummary(formattedErrors);
      A11y.announceError(`Cannot export: ${validation.errors.length} error(s) found. Correct errors before exporting.`);
      
      // Focus first error
      if (formattedErrors.length > 0) {
        const firstError = formattedErrors[0];
        A11y.focusField(firstError.fieldId);
      }
      
      return;
    }
    
    // Generate and download CSV
    const csvContent = CSV.exportToString(rows);
    const fileName = State.getFileName() || 'cue-sheet';
    
    CSV.download(csvContent, fileName);
    
    // Mark as saved
    State.markSaved();
    
    // Clear error summary
    A11y.clearErrorSummary();
    
    // Announce success
    A11y.announceSuccess(`Exported ${rows.length} rows to ${Utils.ensureCsvExtension(fileName)}`);
  },

  /**
   * Update file name display
   */
  _updateFileNameDisplay() {
    const display = document.getElementById('file-name-display');
    const fileName = State.getFileName();
    
    if (display) {
      display.textContent = fileName ? Utils.ensureCsvExtension(fileName) : 'No file';
    }
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
