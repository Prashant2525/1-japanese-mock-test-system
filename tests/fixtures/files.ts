/** Small, structurally valid test files for upload and media tests (no binary files in git). */

/** A 1×1 PNG. */
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** A one-page PDF with an xref table (Payload checks for the header, xref and %%EOF). */
export const PDF = Buffer.from(
  [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj',
    'xref',
    '0 4',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000052 00000 n ',
    '0000000101 00000 n ',
    'trailer<</Size 4/Root 1 0 R>>',
    'startxref',
    '165',
    '%%EOF',
    '',
  ].join('\n'),
  'latin1',
)

/** An MP3 with an ID3 header (enough for type checks; not playable audio). */
export const MP3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(64, 1)])
