/**
 * One-off: write a Git blob object to .git/objects so "git add" can succeed
 * when git.exe is blocked from writing (e.g. antivirus). Run from frontend dir:
 *   node scripts/write-git-object.mjs
 */
import { createHash } from 'crypto'
import { deflateSync } from 'zlib'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const filePath = join(root, 'src', 'pages', 'Terminal.tsx')
const objectsDir = join(root, '.git', 'objects')

function makeBlob(content) {
  const header = `blob ${content.length}\0`
  const blob = Buffer.concat([Buffer.from(header, 'utf8'), content])
  const hash = createHash('sha1').update(blob).digest('hex')
  const compressed = deflateSync(blob, { level: 9 })
  return { hash, compressed }
}

// Git on Windows with core.autocrlf=true converts LF to CRLF when adding
const raw = readFileSync(filePath)
const normalized = Buffer.from(raw.toString('utf8').replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'), 'utf8')
const { hash: targetHash, compressed } = makeBlob(normalized)
const objPath = join(objectsDir, targetHash.slice(0, 2), targetHash.slice(2))

const objDir = dirname(objPath)
if (!existsSync(objDir)) mkdirSync(objDir, { recursive: true })
writeFileSync(objPath, compressed)
console.log('Wrote', objPath)
console.log('Run: git add .')
process.exit(0)
