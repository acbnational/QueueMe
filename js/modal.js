/**
 * QueueMe - Modal Module
 * Handles modal dialogs
 */

const Modal = {
  // Currently open modal
  _currentModal: null,
  _previousFocus: null,
  _focusTrapCleanup: null,

  /**
   * Open a modal dialog
   * @param {string} modalId - Modal element ID
   * @param {Object} options - Options
   */
  open(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Store previous focus
    this._previousFocus = document.activeElement;
    
    // Close any open modal
    if (this._currentModal) {
      this.close();
    }
    
    // Show modal
    modal.showModal();
    this._currentModal = modal;
    
    // Set up focus trap
    this._focusTrapCleanup = A11y.trapFocus(modal);
    
    // Focus first input if available
    const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
    
    // Handle escape key
    modal.addEventListener('keydown', this._handleKeyDown);
    
    // Handle backdrop click
    modal.addEventListener('click', this._handleBackdropClick);
    
    // Callback
    if (options.onOpen) {
      options.onOpen(modal);
    }
  },

  /**
   * Close the current modal
   * @param {boolean} restoreFocus - Whether to restore previous focus
   */
  close(restoreFocus = true) {
    if (!this._currentModal) return;
    
    const modal = this._currentModal;
    
    // Clean up focus trap
    if (this._focusTrapCleanup) {
      this._focusTrapCleanup();
      this._focusTrapCleanup = null;
    }
    
    // Remove event listeners
    modal.removeEventListener('keydown', this._handleKeyDown);
    modal.removeEventListener('click', this._handleBackdropClick);
    
    // Close modal
    modal.close();
    this._currentModal = null;
    
    // Restore focus
    if (restoreFocus && this._previousFocus) {
      this._previousFocus.focus();
    }
    this._previousFocus = null;
  },

  /**
   * Handle keydown in modal
   * @param {KeyboardEvent} e
   * @private
   */
  _handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      Modal.close();
    }
  },

  /**
   * Handle click on backdrop
   * @param {MouseEvent} e
   * @private
   */
  _handleBackdropClick(e) {
    // Only close if clicking on the dialog element itself (backdrop)
    if (e.target === Modal._currentModal) {
      Modal.close();
    }
  },

  /**
   * Check if a modal is open
   * @returns {boolean}
   */
  isOpen() {
    return this._currentModal !== null;
  },

  /**
   * Get the current modal element
   * @returns {HTMLElement|null}
   */
  getCurrent() {
    return this._currentModal;
  },

  /**
   * Show confirmation modal
   * @param {string} message - Confirmation message
   * @param {string} confirmText - Confirm button text
   * @param {Function} onConfirm - Callback on confirm
   * @param {Object} options - Additional options
   */
  confirm(message, confirmText, onConfirm, options = {}) {
    const modal = document.getElementById('modal-confirm');
    const messageEl = document.getElementById('modal-confirm-message');
    const confirmBtn = document.getElementById('btn-confirm-action');
    const cancelBtn = document.getElementById('btn-confirm-cancel');
    
    if (!modal || !messageEl || !confirmBtn) return;
    
    // Set message
    messageEl.textContent = message;
    
    // Set confirm button text
    confirmBtn.textContent = confirmText || 'Confirm';
    
    // Set button style
    if (options.danger) {
      confirmBtn.className = 'btn btn-danger';
    } else {
      confirmBtn.className = 'btn btn-primary';
    }
    
    // Handle confirm
    const handleConfirm = () => {
      cleanup();
      this.close();
      if (onConfirm) onConfirm();
    };
    
    // Handle cancel
    const handleCancel = () => {
      cleanup();
      this.close();
    };
    
    // Cleanup function
    const cleanup = () => {
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    this.open('modal-confirm');
  }
};
