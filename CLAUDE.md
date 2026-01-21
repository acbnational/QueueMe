# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QueueMe is a browser-based, accessible web tool for creating CSV cue sheets compatible with Live365 MultiTrack. It runs entirely client-side with no backend, no accounts, and no persistent storage.

## Development

### Running Locally

Serve the files with any static file server:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .
```

Then open `http://localhost:8000` in your browser.

### Running Tests

Open the browser console and run:
```javascript
Tests.runAll()
```

Tests are defined in `tests/unit.test.js` and cover validation, CSV parsing/generation, and utility functions.

## Architecture

### Module Structure

The application uses a modular vanilla JavaScript architecture with global objects that communicate through a central state manager:

- **State** (`js/state.js`): Central state management with subscriber pattern. Holds rows, filename, editing state. All modules subscribe to state changes.
- **Validation** (`js/validation.js`): Validation rules for Live365 CSV format (offset format, media types, required fields).
- **CSV** (`js/csv.js`): CSV parsing, escaping, export generation, and column auto-mapping for imports.
- **Grid** (`js/grid.js`): Data grid component with full keyboard navigation (arrow keys, Enter to edit, Tab between cells).
- **Form** (`js/form.js`): Quick Add form handling with time builder for offset input.
- **Modal** (`js/modal.js`): Modal dialog management with focus trapping.
- **A11y** (`js/a11y.js`): Accessibility utilities - ARIA live regions, error summaries, focus management.
- **Import** (`js/import.js`): File import handling (CSV/XLSX) with column mapping UI.
- **App** (`js/app.js`): Application entry point, global keyboard shortcuts, session management.
- **Utils** (`js/utils.js`): Shared utilities (offset parsing/formatting, ID generation, etc.).

### Data Flow

1. User actions trigger state changes via `State.addRow()`, `State.updateRow()`, etc.
2. State notifies subscribers via `State.subscribe(callback)`
3. Subscribers (Grid, Form, App) re-render or update UI accordingly
4. Validation runs on form submit and before export

### Live365 CSV Format

The generated CSV follows this format:
```csv
offset,media_type,title,artist,album,year
00:00:00.000,music,Song Title,Artist Name,Album Name,2024
```

- **offset**: `HH:MM:SS.mmm` format (required)
- **media_type**: one of `music`, `talk`, `id`, `promo`, `ad` (required)
- **title**: required
- **artist**: required for music/talk types
- **album**: optional
- **year**: optional, 4 digits (1900-2100)

## Accessibility

This is a keyboard-first, screen reader-friendly application. Key accessibility patterns:

- ARIA live regions for dynamic announcements (`#live-region-polite`, `#live-region-assertive`)
- Error summary region with links to problematic fields
- Grid uses `role="grid"` with proper keyboard navigation
- All form inputs have associated labels and error descriptions
- Focus is carefully managed during modal dialogs and grid editing
- The grid is wrapped in `role="application"` to ensure screen readers like JAWS use forms/application mode

## Dependencies

- **SheetJS** (`vendor/xlsx.mini.min.js`): Optional, for XLSX import. CSV import works without it.
