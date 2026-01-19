# QueueMe

**Live365 MultiTrack CSV Generator**

QueueMe is an accessible, keyboard-first web tool for creating CSV cue sheets compatible with Live365 MultiTrack. It runs entirely in your browser with no backend, no accounts, and no cloud storage.

## Features

- **Quick Add Form**: Time builder with separate inputs for hours, minutes, seconds, and milliseconds
- **Editable Grid**: Spreadsheet-style view with full keyboard navigation
- **Import Support**: Import existing CSV or XLSX files with intelligent column mapping
- **Validation**: Real-time validation with accessible error messages
- **Export**: Generate properly formatted CSV files for Live365 MultiTrack

## Privacy

**Your data stays in your browser.** QueueMe:
- Does not upload files to any server
- Does not store data in cookies, localStorage, or any persistent storage
- Processes all files entirely in memory in your browser
- Has no analytics or tracking

## Live365 CSV Format

QueueMe generates CSV files with the following format:

```csv
offset,media_type,title,artist,album,year
00:00:00.000,music,Song Title,Artist Name,Album Name,2024
00:03:45.500,music,Another Song,Another Artist,Another Album,2023
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| offset | Yes | Timestamp in HH:MM:SS.mmm format |
| media_type | Yes | One of: music, talk, id, promo, ad |
| title | Yes | Song/content title |
| artist | Yes | Artist/performer name |
| album | Yes | Album/release name |
| year | No | 4-digit year (1900-2100) |

## Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Export CSV |
| Ctrl+N | New session |
| Ctrl+I | Import file |

### Quick Add Form

| Key | Action |
|-----|--------|
| Tab | Move to next field |
| Enter | Add row |
| Arrow Up/Down | Increment/decrement time values |

### Data Grid

| Key | Action |
|-----|--------|
| Arrow keys | Navigate cells |
| Enter / F2 | Edit cell |
| Enter (editing) | Save edit |
| Escape | Cancel edit |
| Delete | Delete row |
| Home | First cell in row |
| End | Last cell in row |
| Ctrl+Home | First cell in grid |
| Ctrl+End | Last cell in grid |
| Tab | Save and move to next cell |

## Getting Started

### Option 1: GitHub Pages

1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Access your site at `https://yourusername.github.io/queueMe`

### Option 2: Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/queueMe.git
   cd queueMe
   ```

2. For XLSX support, download the SheetJS library:
   ```bash
   curl -o vendor/xlsx.mini.min.js https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.mini.min.js
   ```

3. Serve the files with any static file server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (with npx)
   npx serve .
   ```

4. Open `http://localhost:8000` in your browser

## Accessibility

QueueMe is designed with accessibility in mind:

- Full keyboard navigation
- Screen reader friendly with proper ARIA labels
- Visible focus indicators
- Error summaries with links to problematic fields
- ARIA live regions for dynamic announcements
- No keyboard traps
- Proper heading hierarchy
- Skip link for main content

## Browser Support

QueueMe works in modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- **SheetJS** (optional): For XLSX file import. Apache 2.0 License.
  - Without SheetJS, CSV import still works.
  - Download from: https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.mini.min.js

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please ensure:

1. All changes maintain accessibility compliance
2. New features work without JavaScript errors
3. The app continues to work on GitHub Pages (no server-side code)

## Support

For issues or feature requests, please open a GitHub issue.
