# QueueMe - Product Requirements Document

**Version:** 1.0  
**Date:** January 19, 2026  
**Author:** GitHub Copilot  
**Status:** Draft

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Users & Primary Use Cases](#2-target-users--primary-use-cases)
3. [Assumptions](#3-assumptions)
4. [Functional Requirements](#4-functional-requirements)
5. [Accessibility Requirements](#5-accessibility-requirements)
6. [Keyboard Interaction Specification](#6-keyboard-interaction-specification)
7. [Import/Export Specifications](#7-importexport-specifications)
8. [Validation & Error Handling](#8-validation--error-handling)
9. [Privacy & Security Notes](#9-privacy--security-notes)
10. [Out of Scope](#10-out-of-scope)
11. [UX Outline](#11-ux-outline)
12. [Data Model](#12-data-model)
13. [Implementation Plan](#13-implementation-plan)
14. [Test Plan](#14-test-plan)
15. [References](#15-references)

---

## 1. Problem Statement

Live365 MultiTrack broadcasters need to create cue sheets (queue sheets) in CSV format to document what content plays at what time in their broadcasts. Currently, creating these CSV files requires:

- Manual CSV editing in spreadsheet software
- Careful adherence to exact format requirements (specific column headers, timestamp formats, valid media types)
- No validation until import into Live365, risking rejected uploads

**QueueMe** solves this by providing a purpose-built, accessible web tool that:
- Guides users through correct data entry with validation
- Generates properly formatted CSV files guaranteed to meet Live365 requirements
- Works entirely in the browser with no server dependencies
- Supports importing existing data from CSV/XLSX files

---

## 2. Target Users & Primary Use Cases

### Target Users

| User Type | Description |
|-----------|-------------|
| Live365 Broadcasters | Internet radio station operators who need to create cue sheets for broadcast logs |
| Music Programmers | Staff who prepare playlists and schedules for radio stations |
| Accessibility Users | Users who rely on keyboard navigation and screen readers |

### Primary Use Cases

1. **Create New Cue Sheet**: User starts fresh, enters song data row by row using the Quick Add form, exports to CSV
2. **Import & Edit Existing Data**: User imports an existing CSV/XLSX file (e.g., from a music library export), maps columns, edits in grid, exports to Live365 format
3. **Review & Correct**: User reviews entered data in grid view, corrects errors flagged by validation, exports clean CSV

---

## 3. Assumptions

The following assumptions are made in the absence of complete Live365 documentation:

1. **CSV Format**: Based on [Live365 MultiTrack documentation](https://help.live365.com/support/solutions/articles/43000697897-multitrack-cue-sheet-and-csv-file-requirements), the Live365 MultiTrack CSV format requires:
   - Header row: `offset,media_type,title,artist,album,year`
   - Offset format: `HH:MM:SS.mmm` (hours:minutes:seconds.milliseconds)
   - Required fields: `offset`, `media_type`, `title`, `artist` (artist required only for music/talk types)
   - Optional fields: `album`, `year`
   - Media types limited to: `music`, `talk`, `id`, `promo`, `ad` (lowercase, case-sensitive)
   - UTF-8 encoding
   - Standard CSV escaping (quotes, commas, newlines)
   - No multiple markers at the same timestamp

2. **Year Field**: Optional; when present must be 4-digit year between 1900-2100

3. **Offset Uniqueness**: Each row must have a unique offset timestamp

4. **Export Order**: Rows exported in ascending offset order (standard for cue sheets representing chronological playback)

5. **Browser Support**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

6. **XLSX Parsing**: SheetJS community edition (Apache 2.0 license) is acceptable for client-side XLSX parsing

---

## 4. Functional Requirements

### 4.1 Session Management

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| SM-1 | New session prompts for output file name | Modal or inline prompt appears on app load asking for file name |
| SM-2 | File name validation | Name must be non-empty; `.csv` appended if missing on export |
| SM-3 | Focus moves to Quick Add after naming | After pressing Enter on name input, focus moves to hours field in time builder |
| SM-4 | No persistent storage | App does not use localStorage, IndexedDB, or cookies for data |

### 4.2 Quick Add Form (Form-First Entry)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| QA-1 | Time Builder inputs | Four separate numeric inputs: Hours (00-99), Minutes (00-59), Seconds (00-59), Milliseconds (000-999) |
| QA-2 | Time Builder generates offset | Combines inputs into `HH:MM:SS.mmm` format |
| QA-3 | Media Type selector | Dropdown/select with exactly 5 options: music, talk, id, promo, ad |
| QA-4 | Title field | Text input, required, max 500 characters |
| QA-5 | Artist field | Text input, required for music/talk types, max 500 characters |
| QA-6 | Album field | Text input, optional, max 500 characters |
| QA-7 | Year field | Numeric input, optional, 4 digits, range 1900-2100 |
| QA-8 | Add Row button | Validates all fields, adds row to grid, clears form on success |
| QA-9 | Validation on Add | Blocks adding if validation fails; shows inline + summary errors |

### 4.3 Grid/Spreadsheet View

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| GV-1 | Display all rows | Shows all entered rows with columns: offset, media_type, title, artist, album, year |
| GV-2 | Row numbering | Visual row numbers for reference (not part of export) |
| GV-3 | Editable cells | All cells editable via keyboard interaction |
| GV-4 | Delete row | Each row has delete action (button or keyboard shortcut) |
| GV-5 | Row reordering | Not required (export sorts by offset automatically) |
| GV-6 | Empty state | Shows helpful message when no rows exist |

### 4.4 Import Functionality

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| IM-1 | File picker support | Button to open file picker for .csv and .xlsx files |
| IM-2 | Drag-and-drop support | Drop zone accepts .csv and .xlsx files |
| IM-3 | CSV parsing | Parses CSV with proper handling of quoted fields, commas, newlines |
| IM-4 | XLSX parsing | Uses SheetJS to parse first sheet of XLSX files |
| IM-5 | Auto-mapping | Attempts to match source columns to QueueMe fields by name (case-insensitive) |
| IM-6 | Manual mapping UI | If auto-mapping fails, shows accessible column mapping interface |
| IM-7 | Mapping validation | Prevents completing import if required fields unmapped |
| IM-8 | Data normalization | Converts imported data to internal format, flags invalid values |
| IM-9 | No file retention | Uploaded file contents not stored beyond in-memory session |

### 4.5 Export Functionality

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| EX-1 | Export button | Prominent export action available when rows exist |
| EX-2 | Pre-export validation | Validates all rows before export; blocks if errors exist |
| EX-3 | CSV generation | Generates CSV with exact header: `offset,media_type,title,artist,album,year` |
| EX-4 | UTF-8 encoding | File encoded as UTF-8 |
| EX-5 | Proper escaping | Fields containing commas, quotes, or newlines properly escaped |
| EX-6 | Lowercase media_type | Ensures all media_type values are lowercase in output |
| EX-7 | Sorted by offset | Rows sorted in ascending offset order |
| EX-8 | File download | Triggers browser download with user-specified filename |

---

## 5. Accessibility Requirements

Based on WCAG 2.1 AA guidelines (W3C WAI References cited below).

### 5.1 General Accessibility

| ID | Requirement | Testable Check |
|----|-------------|----------------|
| A-1 | Semantic HTML | Use proper heading hierarchy, landmarks, form labels |
| A-2 | Color contrast | Minimum 4.5:1 for normal text, 3:1 for large text |
| A-3 | Focus visible | All interactive elements have visible focus indicator (min 2px) |
| A-4 | No keyboard traps | Tab navigation never gets stuck; all modals escapable |
| A-5 | Skip links | Skip to main content link for keyboard users |

### 5.2 Form Accessibility

| ID | Requirement | Testable Check |
|----|-------------|----------------|
| AF-1 | All inputs labeled | Every input has associated `<label>` with `for` attribute |
| AF-2 | Required fields marked | Required inputs have `aria-required="true"` and visual indicator |
| AF-3 | Error association | Error messages linked via `aria-describedby` |
| AF-4 | Invalid state | Fields in error have `aria-invalid="true"` |

### 5.3 Error Handling (Per WCAG 3.3.1, 3.3.3)

| ID | Requirement | Testable Check |
|----|-------------|----------------|
| AE-1 | Inline errors | Error message appears adjacent to field in error |
| AE-2 | Error summary | Top-of-page region lists all current errors with links to fields |
| AE-3 | Live announcements | Error summary has `role="alert"` or `aria-live="assertive"` |
| AE-4 | Error descriptions | Messages identify field and describe how to fix |

### 5.4 Grid Accessibility

| ID | Requirement | Testable Check |
|----|-------------|----------------|
| AG-1 | Grid role | Table uses `role="grid"` with proper `gridcell` roles |
| AG-2 | Row/column headers | Headers marked with appropriate ARIA or semantic elements |
| AG-3 | Cell navigation | Arrow keys navigate between cells |
| AG-4 | Edit mode announced | Screen reader announces when entering/exiting edit mode |

---

## 6. Keyboard Interaction Specification

### 6.1 Global Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Any | Move focus to next focusable element |
| `Shift+Tab` | Any | Move focus to previous focusable element |
| `Escape` | Modal open | Close modal |
| `Ctrl+S` | Any | Trigger export (with confirmation if errors) |
| `Ctrl+N` | Any | New session (with confirmation if data exists) |
| `Ctrl+I` | Any | Open import dialog |

### 6.2 Quick Add Form

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | In form | Move to next input |
| `Enter` | On any input | Submit form (Add Row) |
| `Arrow Up/Down` | Hours/Minutes/Seconds/Milliseconds | Increment/decrement value |
| `Arrow Up/Down` | Media Type dropdown | Change selection |

### 6.3 Grid Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Arrow Up` | Grid (browse mode) | Move to cell above |
| `Arrow Down` | Grid (browse mode) | Move to cell below |
| `Arrow Left` | Grid (browse mode) | Move to cell left |
| `Arrow Right` | Grid (browse mode) | Move to cell right |
| `Home` | Grid (browse mode) | Move to first cell in row |
| `End` | Grid (browse mode) | Move to last cell in row |
| `Ctrl+Home` | Grid (browse mode) | Move to first cell in grid |
| `Ctrl+End` | Grid (browse mode) | Move to last cell in grid |
| `Enter` | Grid (browse mode) | Enter edit mode for current cell |
| `Enter` | Grid (edit mode) | Save edit and exit edit mode |
| `Enter` | Grid (edit mode, last cell of row) | Save edit and add new row |
| `Escape` | Grid (edit mode) | Cancel edit, revert to original value |
| `Delete` | Grid (browse mode, row selected) | Delete current row (with confirmation) |
| `F2` | Grid (browse mode) | Enter edit mode (alternative to Enter) |
| `Tab` | Grid (edit mode) | Save and move to next cell |

---

## 7. Import/Export Specifications

### 7.1 Import Flow

```
1. User triggers import (button or drag-drop)
2. File type detected (.csv or .xlsx)
3. File parsed in memory
4. Column headers extracted
5. Auto-mapping attempted:
   - Exact match (case-insensitive): "offset" → offset
   - Fuzzy match: "song title", "track" → title
   - Common aliases: "performer" → artist
6. If all required fields mapped → proceed to data import
7. If mapping incomplete → show Column Mapping UI
8. User completes mapping → data imported to grid
9. Validation runs on imported data
10. Errors flagged but import completes
11. Original file discarded from memory
```

### 7.2 Column Mapping UI

- Accessible table showing:
  - QueueMe Field (with required indicator)
  - Source Column dropdown (all source columns + "Not mapped")
- Validation feedback before "Complete Import" button
- Cancel button returns to previous state

### 7.3 Export Flow

```
1. User triggers export
2. Pre-flight validation runs
3. If errors exist:
   - Show error summary
   - Block export
   - Focus first error
4. If valid:
   - Sort rows by offset ascending
   - Generate CSV string with headers
   - Apply proper escaping
   - Trigger download with filename
```

### 7.4 CSV Escaping Rules

Per RFC 4180:
- Fields containing commas wrapped in double quotes
- Fields containing double quotes: quotes escaped by doubling (`"` → `""`)
- Fields containing newlines wrapped in double quotes
- All fields optionally quoted for safety

---

## 8. Validation & Error Handling

### 8.1 Field Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| offset | Required | "Offset is required" |
| offset | Format `HH:MM:SS.mmm` | "Offset must be in HH:MM:SS.mmm format (e.g., 00:03:45.000)" |
| offset | Unique | "Offset {value} is already used in row {n}" |
| media_type | Required | "Media type is required" |
| media_type | One of: music, talk, id, promo, ad | "Media type must be music, talk, id, promo, or ad" |
| title | Required | "Title is required" |
| title | Max 500 chars | "Title must be 500 characters or less" |
| artist | Required for music/talk types | "Artist is required" |
| artist | Max 500 chars | "Artist must be 500 characters or less" |
| album | Optional, max 500 chars | "Album must be 500 characters or less" |
| year | If present, 4 digits | "Year must be a 4-digit number" |
| year | If present, 1900-2100 | "Year must be between 1900 and 2100" |

### 8.2 Validation Timing

| Trigger | Scope |
|---------|-------|
| Add Row button | Current Quick Add form fields |
| Cell edit save | Edited cell only |
| Export button | All rows |
| Import complete | All imported rows |

### 8.3 Error Display Pattern

1. **Inline Error**: Red text below/beside field, field has red border, `aria-invalid="true"`
2. **Error Summary**: Fixed region at top of main content with:
   - Count of errors: "3 errors must be corrected before export"
   - List of errors as links to fields
   - `role="alert"` for screen reader announcement
3. **Live Region**: Separate `aria-live="polite"` region for status updates

---

## 9. Privacy & Security Notes

| Concern | Implementation |
|---------|----------------|
| No data transmission | All processing happens client-side; no network requests for data |
| No file retention | Uploaded files parsed in memory, original File object released immediately |
| No storage | No localStorage, sessionStorage, IndexedDB, or cookies used for data |
| No analytics | No tracking scripts, beacons, or analytics |
| No accounts | No user authentication or identification |
| Content Security | Recommend CSP headers when hosted on GitHub Pages |

**User Notice**: App should display brief privacy notice: "Your data stays in your browser. Files are processed locally and never uploaded."

---

## 10. Out of Scope

The following features are explicitly NOT included in this version:

1. Server-side sync or backup
2. User accounts or authentication
3. Persistent project save/load (JSON project files)
4. Analytics or usage tracking
5. Undo/redo history
6. Multi-file batch processing
7. Audio file metadata extraction
8. Live365 API integration
9. Mobile-optimized layout (desktop-first, responsive but not mobile-priority)
10. Offline PWA functionality
11. Print stylesheet
12. Dark mode (can be added later)

---

## 11. UX Outline

### 11.1 Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Skip to main content]                                          │
├─────────────────────────────────────────────────────────────────┤
│ HEADER                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ QueueMe Logo/Title    [New] [Import] [Export]               │ │
│ │ File: my-cue-sheet.csv                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ ERROR SUMMARY REGION (role="alert")                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [hidden when no errors]                                     │ │
│ │ 2 errors must be corrected:                                 │ │
│ │ • Row 3: Offset format invalid                              │ │
│ │ • Row 5: Media type required                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ MAIN CONTENT                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ QUICK ADD FORM                                              │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Offset: [HH]:[MM]:[SS].[mmm]  Media Type: [▼ music    ]│ │ │
│ │ │ Title: [________________________]                       │ │ │
│ │ │ Artist: [_______________________]                       │ │ │
│ │ │ Album: [________________________]  Year: [____]         │ │ │
│ │ │                                          [Add Row]      │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ DATA GRID                                                   │ │
│ │ ┌─────┬──────────┬───────────┬─────────┬─────────┬───────┐ │ │
│ │ │ #   │ Offset   │ Media Type│ Title   │ Artist  │ Album │ │ │
│ │ ├─────┼──────────┼───────────┼─────────┼─────────┼───────┤ │ │
│ │ │ 1   │ 00:00:00 │ music     │ Song 1  │ Artist1 │ Alb1  │ │ │
│ │ │ 2   │ 00:03:45 │ music     │ Song 2  │ Artist2 │ Alb2  │ │ │
│ │ └─────┴──────────┴───────────┴─────────┴─────────┴───────┘ │ │
│ │ [Empty state: "No songs added yet. Use Quick Add above."] │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER                                                          │
│ Privacy: Your data stays in your browser.                       │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Modal: New Session / File Name

```
┌────────────────────────────────────────┐
│ New Cue Sheet                          │
│                                        │
│ Enter file name for your cue sheet:   │
│ [my-show-2026-01-19____________] .csv  │
│                                        │
│             [Cancel]  [Create]         │
└────────────────────────────────────────┘
```

### 11.3 Modal: Import Column Mapping

```
┌────────────────────────────────────────────────────────────────┐
│ Map Columns                                                     │
│                                                                 │
│ Match your file's columns to QueueMe fields:                   │
│                                                                 │
│ QueueMe Field          Your File Column                        │
│ ─────────────────────────────────────────                      │
│ Offset (required)      [▼ Select column...  ]                  │
│ Media Type (required)  [▼ type              ]                  │
│ Title (required)       [▼ song_name         ]                  │
│ Artist (required)      [▼ performer         ]                  │
│ Album (required)       [▼ album_title       ]                  │
│ Year (optional)        [▼ release_year      ]                  │
│                                                                 │
│ ⚠ 1 required field not mapped: Offset                          │
│                                                                 │
│                    [Cancel]  [Complete Import]                  │
└────────────────────────────────────────────────────────────────┘
```

### 11.4 Focus Order

1. Skip link
2. Header actions: New, Import, Export
3. File name display (if editable)
4. Error summary links (if errors exist)
5. Quick Add form fields (Hours → Minutes → Seconds → Milliseconds → Media Type → Title → Artist → Album → Year → Add Row)
6. Data grid (navigable via arrow keys)
7. Footer

---

## 12. Data Model

### 12.1 Internal Row Representation

```typescript
interface CueRow {
  id: string;           // UUID for internal tracking
  offset: string;       // "HH:MM:SS.mmm" format
  mediaType: MediaType; // Enum value
  title: string;
  artist: string;
  album: string;
  year: string | null;  // null if not provided
  errors: FieldError[]; // Validation errors for this row
}

type MediaType = 'music' | 'talk' | 'id' | 'promo' | 'ad';

interface FieldError {
  field: keyof CueRow;
  message: string;
}

interface AppState {
  fileName: string;
  rows: CueRow[];
  editingCell: { rowId: string; field: string } | null;
  importMapping: ColumnMapping | null;
}

interface ColumnMapping {
  offset: string | null;
  mediaType: string | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  year: string | null;
}
```

### 12.2 Offset Parsing Utilities

```typescript
// Parse offset string to milliseconds (for comparison/sorting)
function parseOffset(offset: string): number | null {
  const match = offset.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) return null;
  const [, h, m, s, ms] = match.map(Number);
  return ((h * 60 + m) * 60 + s) * 1000 + ms;
}

// Format milliseconds to offset string
function formatOffset(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const milli = ms % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(milli, 3)}`;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}
```

### 12.3 CSV Export Mapping

| Internal Field | CSV Column | Transform |
|----------------|------------|-----------|
| offset | offset | None |
| mediaType | media_type | Ensure lowercase |
| title | title | CSV escape |
| artist | artist | CSV escape |
| album | album | CSV escape |
| year | year | Empty string if null |

---

## 13. Implementation Plan

### 13.1 File Structure

```
queueMe/
├── index.html              # Single HTML file with all markup
├── css/
│   └── styles.css          # All styles
├── js/
│   ├── app.js              # Main application entry point
│   ├── state.js            # State management
│   ├── validation.js       # Validation logic
│   ├── csv.js              # CSV parsing and generation
│   ├── xlsx.js             # XLSX import wrapper
│   ├── grid.js             # Grid component and keyboard nav
│   ├── form.js             # Quick Add form handling
│   ├── modal.js            # Modal management
│   └── a11y.js             # Accessibility utilities
├── vendor/
│   └── xlsx.mini.min.js    # SheetJS (minified, for XLSX support)
├── docs/
│   ├── PRD.md              # This document
│   └── README.md           # User documentation
└── tests/
    ├── validation.test.js  # Unit tests for validation
    ├── csv.test.js         # Unit tests for CSV handling
    └── a11y.test.html      # Manual accessibility test checklist
```

### 13.2 Key Modules

#### state.js - State Management
```javascript
// Pseudocode
const state = {
  fileName: '',
  rows: [],
  editingCell: null,
  errors: []
};

function addRow(rowData) {
  const errors = validateRow(rowData);
  if (errors.length > 0) {
    announceErrors(errors);
    return false;
  }
  state.rows.push({ ...rowData, id: generateId() });
  renderGrid();
  return true;
}

function updateCell(rowId, field, value) {
  const row = state.rows.find(r => r.id === rowId);
  row[field] = value;
  validateRow(row);
  renderGrid();
}

function deleteRow(rowId) {
  state.rows = state.rows.filter(r => r.id !== rowId);
  renderGrid();
}
```

#### validation.js - Validation Logic
```javascript
// Pseudocode
function validateRow(row, allRows) {
  const errors = [];
  
  // Offset validation
  if (!row.offset) {
    errors.push({ field: 'offset', message: 'Offset is required' });
  } else if (!isValidOffsetFormat(row.offset)) {
    errors.push({ field: 'offset', message: 'Offset must be in HH:MM:SS.mmm format' });
  } else if (isDuplicateOffset(row.offset, row.id, allRows)) {
    errors.push({ field: 'offset', message: `Offset ${row.offset} is already used` });
  }
  
  // Media type validation
  if (!row.mediaType) {
    errors.push({ field: 'mediaType', message: 'Media type is required' });
  } else if (!VALID_MEDIA_TYPES.includes(row.mediaType)) {
    errors.push({ field: 'mediaType', message: 'Invalid media type' });
  }
  
  // Required text fields
  if (!row.title?.trim()) errors.push({ field: 'title', message: 'Title is required' });
  if (!row.artist?.trim()) errors.push({ field: 'artist', message: 'Artist is required' });
  if (!row.album?.trim()) errors.push({ field: 'album', message: 'Album is required' });
  
  // Year validation (optional)
  if (row.year) {
    if (!/^\d{4}$/.test(row.year)) {
      errors.push({ field: 'year', message: 'Year must be 4 digits' });
    } else {
      const y = parseInt(row.year, 10);
      if (y < 1900 || y > 2100) {
        errors.push({ field: 'year', message: 'Year must be between 1900 and 2100' });
      }
    }
  }
  
  return errors;
}

function isValidOffsetFormat(offset) {
  return /^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(offset);
}

function isDuplicateOffset(offset, excludeId, allRows) {
  return allRows.some(r => r.id !== excludeId && r.offset === offset);
}
```

#### csv.js - CSV Handling
```javascript
// Pseudocode
function exportToCsv(rows, fileName) {
  // Sort by offset
  const sorted = [...rows].sort((a, b) => parseOffset(a.offset) - parseOffset(b.offset));
  
  const header = 'offset,media_type,title,artist,album,year';
  const lines = sorted.map(row => {
    return [
      row.offset,
      row.mediaType.toLowerCase(),
      escapeField(row.title),
      escapeField(row.artist),
      escapeField(row.album),
      row.year || ''
    ].join(',');
  });
  
  const csvContent = [header, ...lines].join('\r\n');
  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8');
}

function escapeField(value) {
  if (!value) return '';
  // Escape if contains comma, quote, or newline
  if (/[,"\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function parseCsv(text) {
  // Handle quoted fields, commas in values, etc.
  const rows = [];
  let current = '';
  let inQuotes = false;
  let fields = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i+1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else if (char === '\n' || (char === '\r' && text[i+1] === '\n')) {
        if (char === '\r') i++;
        fields.push(current);
        if (fields.length > 0) rows.push(fields);
        fields = [];
        current = '';
      } else {
        current += char;
      }
    }
  }
  if (current || fields.length > 0) {
    fields.push(current);
    rows.push(fields);
  }
  
  return rows;
}
```

#### Import Column Mapping
```javascript
// Pseudocode
function attemptAutoMapping(headers) {
  const mapping = {
    offset: null,
    mediaType: null,
    title: null,
    artist: null,
    album: null,
    year: null
  };
  
  const aliases = {
    offset: ['offset', 'time', 'timestamp', 'start', 'start_time'],
    mediaType: ['media_type', 'mediatype', 'type', 'category'],
    title: ['title', 'song', 'track', 'song_title', 'track_title', 'name'],
    artist: ['artist', 'performer', 'band', 'singer'],
    album: ['album', 'album_title', 'record', 'release'],
    year: ['year', 'release_year', 'date', 'released']
  };
  
  for (const [field, aliasList] of Object.entries(aliases)) {
    for (const header of headers) {
      const normalized = header.toLowerCase().trim();
      if (aliasList.includes(normalized)) {
        mapping[field] = header;
        break;
      }
    }
  }
  
  return mapping;
}

function showMappingUI(headers, initialMapping) {
  // Render modal with dropdowns for each field
  // On complete, validate required fields are mapped
  // Return final mapping or null if cancelled
}
```

### 13.3 Accessibility Implementation

```javascript
// a11y.js - Pseudocode

// Live region for announcements
function announce(message, priority = 'polite') {
  const region = document.getElementById(`live-region-${priority}`);
  region.textContent = '';
  setTimeout(() => { region.textContent = message; }, 100);
}

// Update error summary
function updateErrorSummary(errors) {
  const summary = document.getElementById('error-summary');
  if (errors.length === 0) {
    summary.hidden = true;
    return;
  }
  
  summary.hidden = false;
  summary.innerHTML = `
    <h2>${errors.length} error${errors.length > 1 ? 's' : ''} must be corrected</h2>
    <ul>
      ${errors.map(e => `
        <li><a href="#${e.fieldId}">${e.message}</a></li>
      `).join('')}
    </ul>
  `;
  
  announce(`${errors.length} errors found. Check error summary for details.`, 'assertive');
}

// Focus management
function focusField(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.focus();
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
```

---

## 14. Test Plan

### 14.1 Unit Tests

#### Validation Tests
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| V-1 | Valid offset format | "00:03:45.123" | Pass |
| V-2 | Invalid offset - missing milliseconds | "00:03:45" | Fail |
| V-3 | Invalid offset - wrong separator | "00:03:45:123" | Fail |
| V-4 | Duplicate offset detection | Two rows with "00:00:00.000" | Fail on second |
| V-5 | Valid media type | "music" | Pass |
| V-6 | Invalid media type | "song" | Fail |
| V-7 | Media type case normalization | "MUSIC" | Normalized to "music" |
| V-8 | Required field empty | title = "" | Fail |
| V-9 | Year valid | "2024" | Pass |
| V-10 | Year invalid - 3 digits | "202" | Fail |
| V-11 | Year invalid - out of range | "1800" | Fail |
| V-12 | Year empty (optional) | "" | Pass |

#### CSV Tests
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| C-1 | Basic CSV generation | Simple row data | Valid CSV string |
| C-2 | Escape comma in field | "Hello, World" | "\"Hello, World\"" |
| C-3 | Escape quote in field | "Say \"Hi\"" | "\"Say \"\"Hi\"\"\"" |
| C-4 | Escape newline in field | "Line1\nLine2" | "\"Line1\nLine2\"" |
| C-5 | Parse quoted CSV | "\"a,b\",c" | ["a,b", "c"] |
| C-6 | Parse escaped quotes | "\"a\"\"b\"" | ["a\"b"] |
| C-7 | UTF-8 characters preserved | "Café Naïve" | "Café Naïve" |
| C-8 | Sort by offset on export | Unsorted rows | Sorted ascending |

### 14.2 Accessibility Tests

| Test ID | Check | Method |
|---------|-------|--------|
| A11Y-1 | All images have alt text | Automated (axe) |
| A11Y-2 | All form inputs have labels | Automated (axe) |
| A11Y-3 | Color contrast meets 4.5:1 | Automated (axe) |
| A11Y-4 | Keyboard-only navigation | Manual |
| A11Y-5 | No keyboard traps | Manual |
| A11Y-6 | Focus visible on all interactive elements | Manual |
| A11Y-7 | Screen reader announces errors | Manual (NVDA/VoiceOver) |
| A11Y-8 | Error summary links work | Manual |
| A11Y-9 | Grid navigable with arrow keys | Manual |
| A11Y-10 | Modal focus trapped correctly | Manual |
| A11Y-11 | Skip link works | Manual |
| A11Y-12 | Landmarks present (main, header, etc.) | Automated (axe) |

### 14.3 Sample Test Cases

#### Test Case: Duplicate Offset Rejection
```
Given: Grid has row with offset "00:00:00.000"
When: User tries to add row with offset "00:00:00.000"
Then: 
  - Add is blocked
  - Inline error shows "Offset 00:00:00.000 is already used"
  - Error summary updated
  - Screen reader announces error
```

#### Test Case: Missing Required Field
```
Given: Quick Add form with Title field empty
When: User clicks Add Row
Then:
  - Add is blocked
  - Title field has red border and aria-invalid="true"
  - Inline error shows "Title is required"
  - Error summary shows error with link to Title field
  - Focus moves to Title field
```

#### Test Case: Import with Column Mapping
```
Given: User imports XLSX with columns ["song_name", "performer", "record", "type"]
When: Import process runs
Then:
  - Auto-mapping identifies: title=song_name, artist=performer, album=record, mediaType=type
  - offset not mapped → Mapping UI shown
  - User selects column for offset or acknowledges missing
  - Import completes with offset field flagged for manual entry
```

#### Test Case: Export with Errors
```
Given: Grid has 3 rows, row 2 has invalid offset format
When: User clicks Export
Then:
  - Export blocked
  - Error summary shows "1 error must be corrected before export"
  - Link to row 2 offset field provided
```

---

## 15. References

### Live365 MultiTrack CSV Format
- Based on user-provided requirements (official documentation could not be retrieved)
- Format: `offset,media_type,title,artist,album,year`
- Offset: `HH:MM:SS.mmm`
- Media types: `music`, `talk`, `id`, `promo`, `ad`

### WCAG 2.1 Accessibility Guidelines
- [WCAG 2.1 SC 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html) - Error messages must identify the field and describe the error
- [W3C WAI Forms Tutorial: User Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/) - Best practices for error summaries and inline errors
- Techniques referenced:
  - ARIA19: Using ARIA role=alert for error identification
  - ARIA21: Using aria-invalid to indicate error fields
  - G139: Creating mechanism to jump to errors

### Libraries
- [SheetJS Community Edition](https://sheetjs.com/) - Apache 2.0 License - Client-side XLSX parsing

### CSV Standard
- [RFC 4180: Common Format and MIME Type for CSV Files](https://tools.ietf.org/html/rfc4180)

---

## Appendix A: Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | GitHub Copilot | Initial draft |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Cue Sheet | A document listing media items with their playback timing |
| Offset | The timestamp at which a media item begins playback |
| MultiTrack | Live365's software for managing broadcast schedules |
| Queue Sheet | Alternative term for cue sheet used by Live365 |
