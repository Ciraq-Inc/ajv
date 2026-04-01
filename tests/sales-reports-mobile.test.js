import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4000';
const SALES_REPORTS_URL = `${BASE_URL}/dataconsumer/sales-reports`;

async function goToSalesReports(page) {
  await page.goto(SALES_REPORTS_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

// ─── Mobile (375px) ───────────────────────────────────────────────────────────

test.describe('Sales Reports – Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await goToSalesReports(page);
  });

  test('no horizontal overflow', async ({ page }) => {
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const vp = page.viewportSize();
    expect(scrollWidth).toBeLessThanOrEqual(vp.width + 5);
  });

  test('hamburger button is visible', async ({ page }) => {
    const hamburger = page.locator('.hamburger-btn');
    await expect(hamburger).toBeVisible();
  });

  test('sidebar is off-screen by default', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    const box = await sidebar.boundingBox();
    // position:fixed with translateX(-100%) — x should be negative
    expect(box.x).toBeLessThan(0);
  });

  test('hamburger opens sidebar with overlay', async ({ page }) => {
    await page.click('.hamburger-btn');
    await page.waitForTimeout(400);

    const sidebar = page.locator('.sidebar');
    const box = await sidebar.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);

    const overlay = page.locator('.mobile-overlay');
    await expect(overlay).toBeVisible();
  });

  test('clicking overlay closes sidebar', async ({ page }) => {
    await page.click('.hamburger-btn');
    await page.waitForTimeout(400);
    await page.click('.mobile-overlay');
    await page.waitForTimeout(400);

    const sidebar = page.locator('.sidebar');
    const box = await sidebar.boundingBox();
    expect(box.x).toBeLessThan(0);
  });

  test('all action buttons visible within viewport', async ({ page }) => {
    const vp = page.viewportSize();

    for (const label of ['Refresh', 'WhatsApp', 'Export']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      await expect(btn).toBeVisible();
      const box = await btn.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 5);
    }
  });

  test('all 4 quarter cards are visible', async ({ page }) => {
    await page.waitForSelector('text=Q1', { timeout: 10000 });
    for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
      await expect(page.locator(`text=${q}`).first()).toBeVisible();
    }
  });

  test('quarter cards do not overflow viewport', async ({ page }) => {
    await page.waitForSelector('text=Q1', { timeout: 10000 });
    const vp = page.viewportSize();
    const cards = page.locator('label').filter({ hasText: /Q[1-4]/ });
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 5);
    }
  });

  test('year select is full-width on mobile', async ({ page }) => {
    const vp = page.viewportSize();
    const yearSelect = page.locator('select').first();
    const box = await yearSelect.boundingBox();
    expect(box.width).toBeGreaterThan(vp.width * 0.5);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 5);
  });

  test('table section is reachable by scrolling', async ({ page }) => {
    await page.evaluate(() => {
      const mc = document.querySelector('.main-content');
      if (mc) mc.scrollTop = 800;
    });
    await page.waitForTimeout(300);
    const tableWrapper = page.locator('.overflow-x-auto').first();
    await expect(tableWrapper).toBeVisible();
  });
});

// ─── Tablet (768px) ───────────────────────────────────────────────────────────

test.describe('Sales Reports – Tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeEach(async ({ page }) => {
    await goToSalesReports(page);
  });

  test('no horizontal overflow', async ({ page }) => {
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const vp = page.viewportSize();
    expect(scrollWidth).toBeLessThanOrEqual(vp.width + 5);
  });

  test('all 4 quarter cards are visible', async ({ page }) => {
    await page.waitForSelector('text=Q1', { timeout: 10000 });
    for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
      await expect(page.locator(`text=${q}`).first()).toBeVisible();
    }
  });
});

// ─── Desktop (1280px) ─────────────────────────────────────────────────────────

test.describe('Sales Reports – Desktop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await goToSalesReports(page);
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    const box = await sidebar.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.width).toBeGreaterThan(0);
  });

  test('hamburger button is hidden on desktop', async ({ page }) => {
    const hamburger = page.locator('.hamburger-btn');
    // display:none → boundingBox returns null
    const box = await hamburger.boundingBox();
    expect(box).toBeNull();
  });

  test('all 4 quarter cards are visible', async ({ page }) => {
    await page.waitForSelector('text=Q1', { timeout: 10000 });
    for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
      await expect(page.locator(`text=${q}`).first()).toBeVisible();
    }
  });

  test('action buttons are all on the same row', async ({ page }) => {
    const boxes = [];
    for (const label of ['Refresh', 'WhatsApp', 'Export']) {
      const btn = page.locator(`button:has-text("${label}")`).first();
      boxes.push(await btn.boundingBox());
    }
    const firstY = boxes[0].y;
    for (const box of boxes) {
      expect(Math.abs(box.y - firstY)).toBeLessThan(10);
    }
  });

  test('no horizontal overflow', async ({ page }) => {
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const vp = page.viewportSize();
    expect(scrollWidth).toBeLessThanOrEqual(vp.width + 5);
  });
});
