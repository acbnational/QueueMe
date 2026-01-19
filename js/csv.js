/**
 * QueueMe - CSV Module
 * Handles CSV parsing and generation
 */

const CSV = {
  // Header row for Live365 MultiTrack format
  HEADER: 'offset,media_type,title,artist,album,year',
  
  // Column names in order
  COLUMNS: ['offset', 'media_type', 'title', 'artist', 'album', 'year'],

  /**
   * Export rows to CSV format
   * @param {Array} rows - Array of row objects
   * @returns {string} CSV string
   */
  exportToString(rows) {
    // Sort rows by offset ascending
    const sorted = [...rows].sort((a, b) => {
      const msA = Utils.parseOffset(a.offset) || 0;
      const msB = Utils.parseOffset(b.offset) || 0;
      return msA - msB;
    });
    
    const lines = [this.HEADER];
    
    sorted.forEach(row => {
      const fields = [
        row.offset || '',
        (row.mediaType || '').toLowerCase(),
        this.escapeField(row.title || ''),
        this.escapeField(row.artist || ''),
        this.escapeField(row.album || ''),
        row.year || ''
      ];
      lines.push(fields.join(','));
    });
    
    return lines.join('\r\n');
  },

  /**
   * Escape a field value for CSV
   * Per RFC 4180: fields containing comma, quote, or newline must be quoted
   * Quotes within quoted fields are escaped by doubling
   * @param {string} value - Field value
   * @returns {string} Escaped value
   */
  escapeField(value) {
    if (!value) return '';
    
    // Check if escaping is needed
    if (/[,"\r\n]/.test(value)) {
      // Escape quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return value;
  },

  /**
   * Parse CSV string into rows
   * @param {string} text - CSV text
   * @returns {Object} {headers: Array, rows: Array}
   */
  parse(text) {
    const result = {
      headers: [],
      rows: []
    };
    
    if (!text || !text.trim()) {
      return result;
    }
    
    const lines = this.parseLines(text);
    
    if (lines.length === 0) {
      return result;
    }
    
    // First line is headers
    result.headers = lines[0];
    
    // Remaining lines are data rows
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].length > 0 && lines[i].some(cell => cell.trim() !== '')) {
        result.rows.push(lines[i]);
      }
    }
    
    return result;
  },

  /**
   * Parse CSV text into array of arrays (handling quoted fields)
   * @param {string} text - CSV text
   * @returns {Array} Array of arrays
   */
  parseLines(text) {
    const lines = [];
    let current = '';
    let inQuotes = false;
    let fields = [];
    
    // Normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (inQuotes) {
        if (char === '"') {
          // Check for escaped quote (double quote)
          if (text[i + 1] === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            // End of quoted field
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          // Start of quoted field
          inQuotes = true;
        } else if (char === ',') {
          // Field separator
          fields.push(current);
          current = '';
        } else if (char === '\n') {
          // End of line
          fields.push(current);
          if (fields.length > 0) {
            lines.push(fields);
          }
          fields = [];
          current = '';
        } else {
          current += char;
        }
      }
    }
    
    // Don't forget the last field/line
    if (current !== '' || fields.length > 0) {
      fields.push(current);
      lines.push(fields);
    }
    
    return lines;
  },

  /**
   * Download CSV as file
   * @param {string} csvContent - CSV string
   * @param {string} filename - Desired filename
   */
  download(csvContent, filename) {
    // Ensure .csv extension
    const finalFilename = Utils.ensureCsvExtension(Utils.sanitizeFilename(filename));
    
    // Create blob without BOM - Live365 doesn't handle BOM properly
    // (it interprets the BOM as part of the first column header)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Convert parsed CSV data to internal row format
   * @param {Object} parsedData - {headers, rows} from parse()
   * @param {Object} mapping - Column mapping {offset: 'source_col', ...}
   * @returns {Array} Array of row objects
   */
  toRowObjects(parsedData, mapping) {
    const { headers, rows } = parsedData;
    
    // Create header index map
    const headerIndex = {};
    headers.forEach((header, index) => {
      headerIndex[header.toLowerCase().trim()] = index;
    });
    
    // Map each row
    return rows.map(row => {
      const obj = {
        id: Utils.generateId(),
        offset: '',
        mediaType: 'music',
        title: '',
        artist: '',
        album: '',
        year: ''
      };
      
      // Apply mapping
      for (const [field, sourceCol] of Object.entries(mapping)) {
        if (sourceCol && sourceCol !== '') {
          const colIndex = headerIndex[sourceCol.toLowerCase().trim()];
          if (colIndex !== undefined && row[colIndex] !== undefined) {
            const value = row[colIndex].trim();
            
            if (field === 'mediaType') {
              // Normalize media type
              obj.mediaType = Validation.normalizeMediaType(value) || value;
            } else {
              obj[field] = value;
            }
          }
        }
      }
      
      return obj;
    });
  },

  /**
   * Attempt auto-mapping of columns
   * @param {Array} headers - Source column headers
   * @returns {Object} Suggested mapping
   */
  autoMapColumns(headers) {
    const mapping = {
      offset: null,
      mediaType: null,
      title: null,
      artist: null,
      album: null,
      year: null
    };
    
    // Exact matches (priority)
    const exactAliases = {
      offset: ['offset', 'time', 'timestamp', 'start', 'start_time', 'timecode', 'position', 'duration', 'length'],
      mediaType: ['media_type', 'mediatype', 'type', 'category', 'kind', 'content_type', 'media'],
      title: ['title', 'song', 'track', 'song_title', 'track_title', 'name', 'track_name', 'song_name'],
      artist: ['artist', 'performer', 'band', 'singer', 'by', 'artist_name', 'contributing artist', 'contributing_artist'],
      album: ['album', 'album_title', 'record', 'release', 'album_name', 'cd'],
      year: ['year', 'release_year', 'date', 'released', 'release_date', 'yr']
    };
    
    // Partial matches (fallback - matches if header contains any of these)
    const partialAliases = {
      offset: ['time', 'offset', 'duration'],
      mediaType: ['type', 'media', 'category'],
      title: ['title', 'song', 'track', 'name'],
      artist: ['artist', 'performer', 'singer'],
      album: ['album', 'record', 'release'],
      year: ['year', 'date']
    };
    
    const normalizedHeaders = headers.map(h => (h || '').toString().toLowerCase().trim());
    
    // First pass: exact matches
    for (const [field, aliasList] of Object.entries(exactAliases)) {
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (aliasList.includes(normalizedHeaders[i])) {
          mapping[field] = headers[i]; // Use original header name
          break;
        }
      }
    }
    
    // Second pass: partial matches for unmapped fields
    for (const [field, aliasList] of Object.entries(partialAliases)) {
      if (mapping[field]) continue; // Already mapped
      
      for (let i = 0; i < normalizedHeaders.length; i++) {
        // Skip already-mapped columns
        if (Object.values(mapping).includes(headers[i])) continue;
        
        for (const alias of aliasList) {
          if (normalizedHeaders[i].includes(alias)) {
            mapping[field] = headers[i];
            break;
          }
        }
        if (mapping[field]) break;
      }
    }
    
    return mapping;
  },

  /**
   * Check if mapping covers all required fields for export
   * @param {Object} mapping - Column mapping
   * @returns {Object} {complete: boolean, missing: Array}
   */
  checkMappingComplete(mapping) {
    const required = ['offset', 'mediaType', 'title', 'artist', 'album'];
    const missing = required.filter(field => !mapping[field]);
    
    return {
      complete: missing.length === 0,
      missing
    };
  },

  /**
   * Check if mapping covers minimum required fields for import
   * Only title is truly required - other fields can be added later
   * @param {Object} mapping - Column mapping
   * @returns {Object} {complete: boolean, missing: Array}
   */
  checkImportMappingComplete(mapping) {
    const required = ['title']; // Minimal requirement for import
    const missing = required.filter(field => !mapping[field]);
    
    return {
      complete: missing.length === 0,
      missing
    };
  }
};

// Freeze the CSV object
Object.freeze(CSV);
