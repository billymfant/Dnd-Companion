import { createRequire } from 'module'
import { readFileSync, writeFileSync } from 'fs'
const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

// Usage: node scripts/extract-pdf.mjs <input.pdf> <output.txt>
// Defaults dump the PHB to scripts/phb.txt for rules lookups.
const input = process.argv[2] || 'DD-Player-Handbook.pdf'
const output = process.argv[3] || 'scripts/phb.txt'

const buf = readFileSync(input)
const parser = new PDFParse({ data: new Uint8Array(buf) })
const result = await parser.getText()
writeFileSync(output, result.text)
console.log('wrote', output, '— pages:', result.total ?? result.pages?.length ?? '?', 'chars:', result.text.length)
