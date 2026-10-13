// CSV for spreadsheet download. Values are quoted when they need to be, and a text cell that starts
// with = + - @ (or a tab / carriage return) gets a leading apostrophe so Excel and Sheets show it
// instead of running it as a formula. Numbers are written as they are, so a negative amount stays one.

export interface CsvColumn {
  key: string
  header: string
}

const FORMULA_START = /^[=+\-@\t\r]/

const cell = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (typeof value !== 'number' && FORMULA_START.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const toCsv = (rows: Array<Record<string, unknown>>, columns: CsvColumn[]): string => {
  const lines = [columns.map((c) => cell(c.header)).join(',')]
  for (const row of rows) lines.push(columns.map((c) => cell(row[c.key])).join(','))
  return `${lines.join('\r\n')}\r\n`
}

export const downloadCsv = (filename: string, csv: string): void => {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
