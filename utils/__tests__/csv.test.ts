import { describe, expect, it } from 'vitest'
import { toCsv } from '../csv'

describe('toCsv', () => {
  it('writes a header row and one line per row, in column order', () => {
    const csv = toCsv(
      [{ name: 'Paracetamol', qty: 2 }, { name: 'Ibuprofen', qty: 5 }],
      [{ key: 'qty', header: 'Qty' }, { key: 'name', header: 'Product' }],
    )

    expect(csv).toBe('Qty,Product\r\n2,Paracetamol\r\n5,Ibuprofen\r\n')
  })

  it('quotes values containing commas, quotes or line breaks', () => {
    const csv = toCsv(
      [{ note: 'a, b' }, { note: 'say "hi"' }, { note: 'two\nlines' }],
      [{ key: 'note', header: 'Note' }],
    )

    expect(csv).toBe('Note\r\n"a, b"\r\n"say ""hi"""\r\n"two\nlines"\r\n')
  })

  it('leaves missing values blank', () => {
    const csv = toCsv([{ a: null, b: undefined }], [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }])

    expect(csv).toBe('A,B\r\n,\r\n')
  })

  it('stops a spreadsheet from running a cell that starts like a formula', () => {
    const csv = toCsv(
      [{ customer: '=HYPERLINK("http://evil.example")' }, { customer: '+1 555' }, { customer: '@cmd' }],
      [{ key: 'customer', header: 'Customer' }],
    )

    const lines = csv.trim().split('\r\n').slice(1)
    for (const line of lines) expect(line.replace(/^"/, '')).toMatch(/^'[=+@]/)
  })

  it('keeps a negative number a number', () => {
    const csv = toCsv([{ amount: -12.5 }], [{ key: 'amount', header: 'Amount' }])

    expect(csv).toBe('Amount\r\n-12.5\r\n')
  })
})
