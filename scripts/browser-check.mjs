import { chromium } from '../.tools/browser/node_modules/playwright/index.mjs'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'

await mkdir('test-results', { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', error => errors.push(error.message))
const base = process.env.TEST_SITE_URL || 'http://127.0.0.1:3000'
async function capture(name) {
  assert(!/\p{Script=Han}/u.test(await page.locator('body').innerText()), 'Unexpected Chinese copy on the page')
  assert.equal(await page.locator('html').getAttribute('lang'), 'en')
  assert(await page.locator('.activity-card').evaluateAll(cards => cards.every(card => {
    const title = card.querySelector('h3')
    return title && title.getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom
  })), 'An activity title is clipped by its card')
  await page.locator('img').evaluateAll(async images => {
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map(image => image.decode().catch(() => {})))
  })
  assert(await page.locator('img').evaluateAll(images => images.every(image => image.naturalWidth > 0)), 'Some images did not load')
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true, animations: 'disabled' })
}
try {
  assert.equal((await page.goto(base))?.status(), 200)
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  await capture('home-desktop')
  assert.equal(await page.locator('.category-tile').count(), 5)
  assert.equal(await page.locator('.activity-card').count(), 3)
  await page.locator('header .main-nav').getByRole('link', { name: 'Volunteering', exact: true }).click()
  await page.waitForURL('**/activities/volunteering')
  await page.getByRole('heading', { name: /Volunteering/ }).waitFor()
  assert.equal(await page.locator('.activity-card').count(), 3)
  await page.getByRole('combobox', { name: 'Sort activities' }).selectOption('newest')
  assert.match(await page.locator('.activity-card h3').first().innerText(), /Giving Our Park/)
  await capture('list-desktop')
  await page.locator('.activity-card').first().click()
  await page.waitForURL('**/activity/community-cleanup')
  await page.locator('.prose h2').first().waitFor()
  assert.equal(await page.locator('.prose h2').count(), 3)
  await capture('detail-desktop')
  assert.equal((await page.reload())?.status(), 200, 'Detail page refresh failed')
  for (const category of ['summer-school', 'academics', 'publications', 'hobbies']) {
    assert.equal((await page.goto(`${base}/activities/${category}`))?.status(), 200)
    await page.locator('.activity-card').first().waitFor()
    assert.equal(await page.locator('.activity-card').count(), 1)
  }
  assert.equal((await page.goto(`${base}/activity/does-not-exist`))?.status(), 404)
  await page.getByRole('button', { name: /Back to home/ }).click()
  await page.waitForURL(`${base}/`)
  assert.equal((await page.goto(`${base}/activities/does-not-exist`))?.status(), 404)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(base)
  await capture('home-mobile')
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Homepage has horizontal overflow')
  await page.getByRole('button', { name: /Menu/ }).click()
  await page.locator('header .main-nav').getByRole('link', { name: 'Volunteering', exact: true }).click()
  await page.waitForURL('**/activities/volunteering')
  assert.equal(await page.getByRole('button', { name: /Menu/ }).getAttribute('aria-expanded'), 'false')
  await capture('list-mobile')
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Activity list has horizontal overflow')
  await page.locator('.activity-card').first().click()
  await page.locator('.prose h2').first().waitFor()
  await capture('detail-mobile')
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Detail page has horizontal overflow')
  assert.deepEqual(errors, [], 'Browser JavaScript errors occurred')
  console.log('PASS: desktop/mobile navigation, five categories, sorting, detail refresh, missing routes, overflow, browser errors.')
} finally { await browser.close() }
