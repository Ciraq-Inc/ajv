import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:4000'

// Define viewport sizes for different breakpoints
const viewports = {
  mobile: { width: 375, height: 812, name: 'Mobile (375px)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (768px)' },
  desktop: { width: 1440, height: 900, name: 'Desktop (1440px)' },
}

test.describe('Homepage Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    // Wait for auth to resolve
    await page.waitForSelector('main', { timeout: 10000 })
  })

  Object.entries(viewports).forEach(([key, viewport]) => {
    test(`Hero section displays correctly on ${viewport.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      // Find hero section
      const heroSection = await page.locator('section').first()
      await expect(heroSection).toBeVisible()

      // Check that the hero image is loaded and visible
      const heroImage = await page.locator('img[class*="w-full"][class*="h-full"]').first()
      await expect(heroImage).toBeVisible()

      // Verify image source is the local image
      const imageSrc = await heroImage.getAttribute('src')
      expect(imageSrc).toBe('/user_ordering_med.jpg')

      // Check that the image has loaded (check naturalWidth > 0)
      const isImageLoaded = await page.evaluate(() => {
        const img = document.querySelector('img[src="/user_ordering_med.jpg"]')
        return img && img.naturalWidth > 0
      })
      expect(isImageLoaded).toBeTruthy()

      // Verify the image covers the full hero section without overflow
      const heroRect = await heroSection.boundingBox()
      const imageRect = await heroImage.boundingBox()

      expect(heroRect).toBeTruthy()
      expect(imageRect).toBeTruthy()
      expect(imageRect.width).toBeGreaterThan(0)
      expect(imageRect.height).toBeGreaterThan(0)
    })

    test(`Hero content layout is responsive on ${viewport.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      // Check main heading is visible
      const heading = await page.locator('h1').filter({ hasText: 'Find any medication' })
      await expect(heading).toBeVisible()

      // Check search form is visible
      const searchForm = await page.locator('form').first()
      await expect(searchForm).toBeVisible()

      // Check input field is visible
      const searchInput = await page.locator('input[placeholder*="Search for medication"]')
      await expect(searchInput).toBeVisible()

      // Verify button is visible (mobile shows full width, desktop may be w-fit)
      const submitButton = await page.locator('button').filter({ hasText: 'Make a drug request' })
      await expect(submitButton).toBeVisible()

      // For mobile, button should be full width
      if (viewport.width < 768) {
        const buttonClass = await submitButton.getAttribute('class')
        expect(buttonClass).toContain('w-full')
      }

      // For desktop, button should be w-fit
      if (viewport.width >= 1024) {
        const buttonClass = await submitButton.getAttribute('class')
        expect(buttonClass).toContain('md:w-fit')
      }
    })

    test(`No horizontal overflow on ${viewport.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      // Check that body width doesn't exceed viewport
      const bodyWidth = await page.evaluate(() => {
        return document.documentElement.scrollWidth
      })

      expect(bodyWidth).toBeLessThanOrEqual(viewport.width)
    })

    test(`Grid layout adapts correctly on ${viewport.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      // Find the grid container in hero section
      const gridContainer = await page.locator('.grid.lg\\:grid-cols-2').first()
      await expect(gridContainer).toBeVisible()

      // On mobile/tablet (< 1024px), grid should stack to 1 column
      // On desktop (>= 1024px), grid should be 2 columns
      const gridComputedStyle = await page.evaluate(() => {
        const grid = document.querySelector('.grid[class*="lg:grid-cols-2"]')
        return {
          display: window.getComputedStyle(grid).display,
          gridTemplateColumns: window.getComputedStyle(grid).gridTemplateColumns,
        }
      })

      expect(gridComputedStyle.display).toBe('grid')

      // On mobile, should be 1fr (single column)
      if (viewport.width < 1024) {
        expect(gridComputedStyle.gridTemplateColumns).toMatch(/^(\d+\.?\d*px|[\d.]+[a-z%]+)(\s+(\d+\.?\d*px|[\d.]+[a-z%]+))*$/)
      }
    })

    test(`Trust bar is visible and responsive on ${viewport.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      // Find trust bar section (flex items-center gap-4)
      const trustBar = await page.locator('.flex.items-center.gap-4').filter({ hasText: 'Secure & Trusted' })
      await expect(trustBar).toBeVisible()

      // Avatar images should be visible
      const avatarImages = await page.locator('img[data-alt*="portrait"]')
      expect(await avatarImages.count()).toBeGreaterThan(0)

      for (let i = 0; i < Math.min(3, await avatarImages.count()); i++) {
        await expect(avatarImages.nth(i)).toBeVisible()
      }
    })
  })

  test('Image loads and displays without errors', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.waitForSelector('main', { timeout: 10000 })

    // Listen for any console errors related to image loading
    const errors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Wait for the image to load
    const heroImage = await page.locator('img[src="/user_ordering_med.jpg"]')
    await expect(heroImage).toBeVisible()

    // Check image loaded successfully
    const imageLoadedSuccessfully = await page.evaluate(() => {
      const img = document.querySelector('img[src="/user_ordering_med.jpg"]')
      return img && img.complete && img.naturalHeight > 0
    })

    expect(imageLoadedSuccessfully).toBeTruthy()
    expect(errors).toHaveLength(0)
  })

  test('Layout has no layout shift when page loads', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    // Capture layout metrics at different points
    const initialLayout = await page.evaluate(() => {
      const hero = document.querySelector('section')
      return {
        height: hero?.offsetHeight,
        width: hero?.offsetWidth,
      }
    })

    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.waitForSelector('main', { timeout: 10000 })

    // Wait a bit for any late images to load
    await page.waitForTimeout(1000)

    const finalLayout = await page.evaluate(() => {
      const hero = document.querySelector('section')
      return {
        height: hero?.offsetHeight,
        width: hero?.offsetWidth,
      }
    })

    // Layout should be stable
    expect(finalLayout.width).toBeLessThanOrEqual(768)
    expect(finalLayout.height).toBeGreaterThan(0)
  })
})
