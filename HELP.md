# QueueMe Help Guide

QueueMe is a browser-based tool for creating CSV cue sheets compatible with Live365 MultiTrack. Everything runs in your browser—no accounts, no uploads, no tracking.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Adding Cue Entries](#adding-cue-entries)
- [Editing Entries in the Grid](#editing-entries-in-the-grid)
- [Importing Data](#importing-data)
- [Exporting Your Cue Sheet](#exporting-your-cue-sheet)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Field Reference](#field-reference)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

When you open QueueMe, you'll be prompted to name your cue sheet. The default name includes today's date (e.g., `cue-sheet-2024-03-15`), but you can change it to anything you like. This name will be used when you export your CSV file.

### Privacy Note

All data stays in your browser. Nothing is uploaded to any server. If you close or refresh the page without exporting, your work will be lost—so remember to export when you're done.

---

## Adding Cue Entries

Use the **Quick Add** form to add entries one at a time.

### Required Fields

| Field | Description |
|-------|-------------|
| **Offset** | When the track starts, in `HH:MM:SS.mmm` format (hours, minutes, seconds, milliseconds) |
| **Media Type** | One of: `music`, `talk`, `id`, `promo`, `ad` |
| **Title** | The track title |
| **Artist** | Required for `music` and `talk` types only |

### Optional Fields

| Field | Description |
|-------|-------------|
| **Album** | Album name |
| **Year** | Release year (4 digits, 1900–2100) |

### Using the Time Builder

The Offset field has a time builder with separate boxes for hours, minutes, seconds, and milliseconds:

- Use **Tab** to move between time components
- Use **Arrow Up/Down** to increment or decrement values
- Values auto-format when you leave the field (e.g., `5` becomes `05`)

After adding an entry, the form clears and focus returns to the Offset field so you can quickly add the next track.

---

## Editing Entries in the Grid

Once you've added entries, they appear in the data grid. You can edit any cell directly.

### Mouse

- **Click** a cell to select it
- **Double-click** to start editing
- Click the **× button** on a row to delete it

### Keyboard Navigation

| Key | Action |
|-----|--------|
| **Arrow keys** | Move between cells |
| **Enter**, **F2**, or **Space** | Edit the selected cell |
| **Escape** | Cancel editing (reverts changes) |
| **Tab** | Save and move to next cell |
| **Shift+Tab** | Save and move to previous cell |
| **Delete** | Delete the current row |
| **Insert** | Insert a new row above |
| **Home** | Go to first cell in row |
| **End** | Go to last cell in row |
| **Ctrl+Home** | Go to first cell in grid |
| **Ctrl+End** | Go to last cell in grid |

### Editing the Offset Cell

When editing an offset, the time builder appears. Use Tab to move between hours, minutes, seconds, and milliseconds, then press Tab again or Enter to save.

---

## Importing Data

You can import existing data from CSV or Excel (XLSX) files.

### How to Import

1. Press **Ctrl+I** or click the **Import** button
2. Drag and drop a file onto the import area, or click to browse
3. QueueMe will show a column mapping screen
4. Match your file's columns to the required fields (Title is required; others are optional)
5. Click **Complete Import**

### Auto-Detection

QueueMe automatically recognizes common column names:

- **Offset**: time, timestamp, start, duration, position
- **Media Type**: type, category, kind, media
- **Title**: song, track, name, song_title
- **Artist**: performer, band, singer
- **Album**: record, release
- **Year**: release_year, date

If your columns aren't detected, use the dropdowns to map them manually.

### Excel Time Values

If your spreadsheet has times in Excel's decimal format (like `0.04167` for 1 hour), QueueMe converts them automatically.

---

## Exporting Your Cue Sheet

When you're ready to use your cue sheet with Live365:

1. Press **Ctrl+S** or click the **Export** button
2. QueueMe validates all entries
3. If there are errors, they'll be listed—fix them before exporting
4. If validation passes, a CSV file downloads automatically

### Export Details

- Filename: Your cue sheet name + `.csv`
- Rows are automatically sorted by offset time
- Format is compatible with Live365 MultiTrack

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+N** | Start a new cue sheet |
| **Ctrl+I** | Import a file |
| **Ctrl+S** | Export to CSV |

---

## Field Reference

### Offset Format

`HH:MM:SS.mmm`

- **HH**: Hours (00–99)
- **MM**: Minutes (00–59)
- **SS**: Seconds (00–59)
- **mmm**: Milliseconds (000–999)

Examples: `00:00:00.000`, `01:30:45.500`, `00:03:22.100`

### Media Types

| Type | Description |
|------|-------------|
| `music` | Music tracks (artist required) |
| `talk` | Spoken content (artist required) |
| `id` | Station ID |
| `promo` | Promotional content |
| `ad` | Advertisement |

### Validation Rules

- **Offset**: Required, must be valid format, no duplicates allowed
- **Media Type**: Required, must be one of the five types above
- **Title**: Required, maximum 500 characters
- **Artist**: Required for music/talk, maximum 500 characters
- **Album**: Optional, maximum 500 characters
- **Year**: Optional, must be 4 digits between 1900–2100

---

## Troubleshooting

### "Duplicate offset" error

Each entry must have a unique offset time. Two tracks can't start at exactly the same moment. Change one of the offsets by at least 1 millisecond.

### Export button doesn't work

There are validation errors in your cue sheet. Check the error summary that appears and fix each issue. Common problems:

- Missing title or artist
- Invalid offset format
- Year not exactly 4 digits

### Imported data looks wrong

Check your column mapping. If columns weren't auto-detected correctly, manually select the right mapping for each field in the import dialog.

### Excel times imported incorrectly

Make sure your time column is formatted consistently. QueueMe handles Excel's decimal time format, but mixed formats in the same column may cause issues.

### Lost my work

QueueMe doesn't auto-save. If you closed or refreshed the browser, the data is gone. Export frequently to save your progress.

### Screen reader not reading grid correctly

QueueMe is optimized for JAWS and other screen readers. If you're having trouble:

- Make sure your screen reader is in forms/application mode when in the grid
- Use the keyboard shortcuts listed above for navigation
- Listen for announcements when you move between cells or make changes

---

## Need More Help?

Report issues or request features at: https://github.com/anthropics/claude-code/issues
