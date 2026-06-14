import { createRequire } from 'module'
import { readFileSync, writeFileSync } from 'fs'
const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

const buf = readFileSync('F:/APPS/D&D Companion/DD-Player-Handbook.pdf')
const parser = new PDFParse({ data: new Uint8Array(buf) })
const result = await parser.getText()
writeFileSync('F:/APPS/dnd-companion/scripts/phb.txt', result.text)
console.log('pages:', result.total ?? result.pages?.length ?? '?', 'chars:', result.text.length)
