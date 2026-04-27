import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:4000'
const selector = process.argv[3] || 'body'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

try {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

  try {
    await page.waitForSelector(selector, { timeout: 10000 })
  } catch {
    // The caller may only care about the first response and title.
  }

  const title = await page.title()

  console.log(JSON.stringify({
    url: page.url(),
    status: response ? response.status() : null,
    title,
    selector
  }, null, 2))
} finally {
  await browser.close()
}
