/**
 * QueueMe - Unit Tests
 * Run these tests in browser console or with a test runner
 */

const Tests = {
  passed: 0,
  failed: 0,
  
  /**
   * Assert equality
   */
  assertEqual(actual, expected, testName) {
    if (actual === expected) {
      console.log(`✓ ${testName}`);
      this.passed++;
    } else {
      console.error(`✗ ${testName}: Expected "${expected}", got "${actual}"`);
      this.failed++;
    }
  },
  
  /**
   * Assert truthy
   */
  assertTrue(value, testName) {
    if (value) {
      console.log(`✓ ${testName}`);
      this.passed++;
    } else {
      console.error(`✗ ${testName}: Expected truthy value`);
      this.failed++;
    }
  },
  
  /**
   * Assert falsy
   */
  assertFalse(value, testName) {
    if (!value) {
      console.log(`✓ ${testName}`);
      this.passed++;
    } else {
      console.error(`✗ ${testName}: Expected falsy value`);
      this.failed++;
    }
  },
  
  /**
   * Assert array length
   */
  assertLength(arr, expected, testName) {
    if (arr.length === expected) {
      console.log(`✓ ${testName}`);
      this.passed++;
    } else {
      console.error(`✗ ${testName}: Expected length ${expected}, got ${arr.length}`);
      this.failed++;
    }
  },

  /**
   * Run all tests
   */
  runAll() {
    console.log('=== Running QueueMe Tests ===\n');
    
    this.testUtils();
    this.testValidation();
    this.testCSV();
    
    console.log(`\n=== Test Results: ${this.passed} passed, ${this.failed} failed ===`);
    return this.failed === 0;
  },

  /**
   * Test Utils module
   */
  testUtils() {
    console.log('\n--- Utils Tests ---');
    
    // Test pad
    this.assertEqual(Utils.pad(5, 2), '05', 'pad: single digit');
    this.assertEqual(Utils.pad(12, 2), '12', 'pad: two digits');
    this.assertEqual(Utils.pad(5, 3), '005', 'pad: three digits');
    
    // Test parseOffset
    this.assertEqual(Utils.parseOffset('00:00:00.000'), 0, 'parseOffset: zero');
    this.assertEqual(Utils.parseOffset('00:00:01.000'), 1000, 'parseOffset: one second');
    this.assertEqual(Utils.parseOffset('00:01:00.000'), 60000, 'parseOffset: one minute');
    this.assertEqual(Utils.parseOffset('01:00:00.000'), 3600000, 'parseOffset: one hour');
    this.assertEqual(Utils.parseOffset('01:23:45.678'), 5025678, 'parseOffset: complex');
    this.assertEqual(Utils.parseOffset('invalid'), null, 'parseOffset: invalid format');
    this.assertEqual(Utils.parseOffset('00:00:00'), null, 'parseOffset: missing milliseconds');
    
    // Test formatOffset
    this.assertEqual(Utils.formatOffset(0), '00:00:00.000', 'formatOffset: zero');
    this.assertEqual(Utils.formatOffset(1000), '00:00:01.000', 'formatOffset: one second');
    this.assertEqual(Utils.formatOffset(5025678), '01:23:45.678', 'formatOffset: complex');
    
    // Test buildOffset
    this.assertEqual(Utils.buildOffset(0, 0, 0, 0), '00:00:00.000', 'buildOffset: zero');
    this.assertEqual(Utils.buildOffset(1, 23, 45, 678), '01:23:45.678', 'buildOffset: complex');
    
    // Test clamp
    this.assertEqual(Utils.clamp(5, 0, 10), 5, 'clamp: within range');
    this.assertEqual(Utils.clamp(-5, 0, 10), 0, 'clamp: below min');
    this.assertEqual(Utils.clamp(15, 0, 10), 10, 'clamp: above max');
    
    // Test isEmpty
    this.assertTrue(Utils.isEmpty(null), 'isEmpty: null');
    this.assertTrue(Utils.isEmpty(undefined), 'isEmpty: undefined');
    this.assertTrue(Utils.isEmpty(''), 'isEmpty: empty string');
    this.assertTrue(Utils.isEmpty('   '), 'isEmpty: whitespace');
    this.assertFalse(Utils.isEmpty('hello'), 'isEmpty: non-empty string');
    
    // Test sanitizeFilename
    this.assertEqual(Utils.sanitizeFilename('my file.csv'), 'my-file.csv', 'sanitizeFilename: spaces');
    this.assertEqual(Utils.sanitizeFilename('my<file>'), 'my-file-', 'sanitizeFilename: special chars');
    
    // Test ensureCsvExtension
    this.assertEqual(Utils.ensureCsvExtension('file'), 'file.csv', 'ensureCsvExtension: no extension');
    this.assertEqual(Utils.ensureCsvExtension('file.csv'), 'file.csv', 'ensureCsvExtension: has extension');
    this.assertEqual(Utils.ensureCsvExtension('file.CSV'), 'file.CSV', 'ensureCsvExtension: uppercase extension');
  },

  /**
   * Test Validation module
   */
  testValidation() {
    console.log('\n--- Validation Tests ---');
    
    // Test isValidOffsetFormat
    this.assertTrue(Validation.isValidOffsetFormat('00:00:00.000'), 'offset format: valid zero');
    this.assertTrue(Validation.isValidOffsetFormat('23:59:59.999'), 'offset format: valid max');
    this.assertFalse(Validation.isValidOffsetFormat('00:00:00'), 'offset format: missing ms');
    this.assertFalse(Validation.isValidOffsetFormat('0:0:0.0'), 'offset format: wrong padding');
    this.assertFalse(Validation.isValidOffsetFormat('00:60:00.000'), 'offset format: invalid minutes');
    this.assertFalse(Validation.isValidOffsetFormat('00:00:60.000'), 'offset format: invalid seconds');
    
    // Test validateMediaType
    this.assertLength(Validation.validateMediaType('music'), 0, 'media type: valid music');
    this.assertLength(Validation.validateMediaType('talk'), 0, 'media type: valid talk');
    this.assertLength(Validation.validateMediaType('id'), 0, 'media type: valid id');
    this.assertLength(Validation.validateMediaType('promo'), 0, 'media type: valid promo');
    this.assertLength(Validation.validateMediaType('ad'), 0, 'media type: valid ad');
    this.assertLength(Validation.validateMediaType('MUSIC'), 0, 'media type: valid uppercase');
    this.assertTrue(Validation.validateMediaType('song').length > 0, 'media type: invalid song');
    this.assertTrue(Validation.validateMediaType('').length > 0, 'media type: empty');
    
    // Test validateYear
    this.assertLength(Validation.validateYear(''), 0, 'year: empty (optional)');
    this.assertLength(Validation.validateYear('2024'), 0, 'year: valid');
    this.assertLength(Validation.validateYear('1900'), 0, 'year: min valid');
    this.assertLength(Validation.validateYear('2100'), 0, 'year: max valid');
    this.assertTrue(Validation.validateYear('202').length > 0, 'year: 3 digits');
    this.assertTrue(Validation.validateYear('20245').length > 0, 'year: 5 digits');
    this.assertTrue(Validation.validateYear('1899').length > 0, 'year: below range');
    this.assertTrue(Validation.validateYear('2101').length > 0, 'year: above range');
    this.assertTrue(Validation.validateYear('abcd').length > 0, 'year: non-numeric');
    
    // Test validateRequiredField
    this.assertTrue(Validation.validateRequiredField('', 'title', 'Title').length > 0, 'required field: empty');
    this.assertTrue(Validation.validateRequiredField('   ', 'title', 'Title').length > 0, 'required field: whitespace');
    this.assertLength(Validation.validateRequiredField('Hello', 'title', 'Title'), 0, 'required field: valid');
    
    // Test duplicate offset detection
    const rows = [
      { id: '1', offset: '00:00:00.000' },
      { id: '2', offset: '00:01:00.000' }
    ];
    this.assertEqual(Validation.findDuplicateOffset('00:00:00.000', '1', rows), null, 'duplicate: same row');
    this.assertTrue(Validation.findDuplicateOffset('00:00:00.000', '3', rows) !== null, 'duplicate: different row');
    this.assertEqual(Validation.findDuplicateOffset('00:02:00.000', '3', rows), null, 'duplicate: unique offset');
    
    // Test validateRow
    const validRow = {
      id: '1',
      offset: '00:00:00.000',
      mediaType: 'music',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      year: '2024'
    };
    this.assertLength(Validation.validateRow(validRow, []), 0, 'validateRow: valid complete row');
    
    const invalidRow = {
      id: '2',
      offset: '',
      mediaType: '',
      title: '',
      artist: '',
      album: '',
      year: ''
    };
    this.assertTrue(Validation.validateRow(invalidRow, []).length >= 5, 'validateRow: invalid row has multiple errors');
  },

  /**
   * Test CSV module
   */
  testCSV() {
    console.log('\n--- CSV Tests ---');
    
    // Test escapeField
    this.assertEqual(CSV.escapeField('hello'), 'hello', 'escape: simple text');
    this.assertEqual(CSV.escapeField('hello, world'), '"hello, world"', 'escape: comma');
    this.assertEqual(CSV.escapeField('say "hi"'), '"say ""hi"""', 'escape: quotes');
    this.assertEqual(CSV.escapeField('line1\nline2'), '"line1\nline2"', 'escape: newline');
    this.assertEqual(CSV.escapeField(''), '', 'escape: empty string');
    this.assertEqual(CSV.escapeField(null), '', 'escape: null');
    
    // Test parse
    const csvText = 'a,b,c\n1,2,3\n4,5,6';
    const parsed = CSV.parse(csvText);
    this.assertLength(parsed.headers, 3, 'parse: header count');
    this.assertEqual(parsed.headers[0], 'a', 'parse: first header');
    this.assertLength(parsed.rows, 2, 'parse: row count');
    this.assertEqual(parsed.rows[0][0], '1', 'parse: first cell');
    
    // Test parse with quotes
    const quotedCsv = 'name,desc\n"John Doe","Hello, World"';
    const parsedQuoted = CSV.parse(quotedCsv);
    this.assertEqual(parsedQuoted.rows[0][0], 'John Doe', 'parse quoted: unquoted value');
    this.assertEqual(parsedQuoted.rows[0][1], 'Hello, World', 'parse quoted: value with comma');
    
    // Test parse with escaped quotes
    const escapedCsv = 'text\n"Say ""Hello"""';
    const parsedEscaped = CSV.parse(escapedCsv);
    this.assertEqual(parsedEscaped.rows[0][0], 'Say "Hello"', 'parse escaped quotes');
    
    // Test exportToString
    const rows = [
      { id: '1', offset: '00:03:00.000', mediaType: 'music', title: 'Song B', artist: 'Artist B', album: 'Album B', year: '' },
      { id: '2', offset: '00:00:00.000', mediaType: 'talk', title: 'Intro', artist: 'Host', album: 'Show', year: '2024' }
    ];
    const exported = CSV.exportToString(rows);
    this.assertTrue(exported.startsWith('offset,media_type,title,artist,album,year'), 'export: has header');
    this.assertTrue(exported.indexOf('00:00:00.000') < exported.indexOf('00:03:00.000'), 'export: sorted by offset');
    
    // Test autoMapColumns
    const headers = ['Title', 'Artist Name', 'album_title', 'Type'];
    const mapping = CSV.autoMapColumns(headers);
    this.assertEqual(mapping.title, 'Title', 'autoMap: title');
    this.assertEqual(mapping.album, 'album_title', 'autoMap: album');
    this.assertEqual(mapping.mediaType, 'Type', 'autoMap: media type');
    
    // Test checkMappingComplete
    const incompleteMapping = { offset: 'Time', mediaType: 'Type', title: 'Title', artist: null, album: null, year: null };
    const check = CSV.checkMappingComplete(incompleteMapping);
    this.assertFalse(check.complete, 'mapping check: incomplete');
    this.assertTrue(check.missing.includes('artist'), 'mapping check: missing artist');
    this.assertTrue(check.missing.includes('album'), 'mapping check: missing album');
    
    const completeMapping = { offset: 'Time', mediaType: 'Type', title: 'Title', artist: 'By', album: 'Record', year: null };
    const check2 = CSV.checkMappingComplete(completeMapping);
    this.assertTrue(check2.complete, 'mapping check: complete');
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Tests;
}
