#!/usr/bin/env node
/**
 * Fail when a file gains a new lint error or its problem count rises.
 * The baseline is the recorded count. A decrease is allowed.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { relative } from 'node:path'

const baselinePath = 'eslint-baseline.json'
const write = process.argv.includes('--write')
const result = spawnSync('npx', ['eslint', '.', '--format', 'json'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
const raw = result.stdout || '[]'
let report = []
try {
  report = JSON.parse(raw)
} catch (err) {
  console.error('[lint-baseline] eslint did not return JSON')
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}

const counts = {}
let errors = 0
let warnings = 0
for (const file of report) {
  if (!file.messages?.length) continue
  const errorCount = file.messages.filter((row) => row.severity === 2).length
  const warningCount = file.messages.filter((row) => row.severity === 1).length
  if (errorCount + warningCount === 0) continue
  const filePath = relative(process.cwd(), file.filePath)
  counts[filePath] = { errors: errorCount, warnings: warningCount }
  errors += errorCount
  warnings += warningCount
}

if (write) {
  writeFileSync(baselinePath, JSON.stringify({ errors, warnings, files: counts }, null, 2))
  console.log(`[lint-baseline] wrote ${errors} errors and ${warnings} warnings`)
  process.exit(0)
}

if (!existsSync(baselinePath)) {
  console.error('[lint-baseline] missing eslint-baseline.json. Run with --write once.')
  process.exit(1)
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
const problems = []
for (const [file, count] of Object.entries(counts)) {
  const previous = baseline.files?.[file]
  if (!previous) {
    if (count.errors > 0) problems.push(`${file} is new and has ${count.errors} errors`)
    continue
  }
  if (count.errors > previous.errors) {
    problems.push(`${file} errors ${previous.errors} -> ${count.errors}`)
  }
  if (count.errors + count.warnings > previous.errors + previous.warnings) {
    problems.push(`${file} problems ${previous.errors + previous.warnings} -> ${count.errors + count.warnings}`)
  }
}
if (problems.length) {
  console.error('[lint-baseline] increased')
  for (const line of problems) console.error(line)
  process.exit(1)
}
console.log(`[lint-baseline] ${errors} errors, ${warnings} warnings, no increase`)
