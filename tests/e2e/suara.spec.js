import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const severeAccessibilityViolations = async (page) => {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('homepage explains the service and exposes a real consultation path', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/SUARA/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Kebijakan publik');
  await expect(page.getByRole('link', { name: /Lihat konsultasi terbuka/ })).toBeVisible();
  await expect(page.locator('#homeConsultationGrid article')).toHaveCount(3);
  expect(browserErrors).toEqual([]);
  expect(await severeAccessibilityViolations(page)).toEqual([]);
});

test('directory search and status filters narrow the consultation set', async ({ page }) => {
  await page.goto('/consultations.html');
  await expect(page.locator('#directoryGrid article')).toHaveCount(4);

  await page.locator('#directorySearch').fill('Blok M');
  await expect(page.locator('#directoryGrid article')).toHaveCount(1);
  await expect(page.locator('#directoryGrid')).toContainText('Blok M');

  await page.locator('#directorySearch').fill('kata-yang-tidak-ada');
  await expect(page.locator('#emptyResults')).toHaveClass(/show/);
});

test('a citizen can complete, submit, and track a structured response', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/consultation.html?id=blok-m-lez&tab=questions');
  expect(browserErrors).toEqual([]);
  await expect(page.getByRole('heading', { name: /Sampaikan dampak/ })).toBeVisible();

  await page.getByLabel('Bekerja atau bersekolah').check();
  await page.getByRole('button', { name: /Lanjutkan/ }).click();
  await page.getByLabel('Setuju', { exact: true }).check();
  await page.getByRole('button', { name: /Lanjutkan/ }).click();
  await page.getByLabel('Pekerja shift').check();
  await page.getByRole('button', { name: /Lanjutkan/ }).click();
  await page.locator('textarea[name="q4"]').fill('Pekerja malam dapat menanggung biaya perjalanan yang tidak proporsional.');
  await page.getByRole('button', { name: /Lanjutkan/ }).click();
  await page.locator('textarea[name="q5"]').fill('Tambahkan batas tarif harian dan pengecualian yang mudah diverifikasi.');
  await page.getByRole('button', { name: /Lanjutkan/ }).click();
  await page.locator('input[name="q6"]').fill('https://example.org/bukti');
  await page.getByRole('button', { name: /Tinjau tanggapan/ }).click();

  await expect(page.locator('#previewSummary')).toContainText('batas tarif harian');
  await page.locator('#publicDisplay').check();
  await page.locator('#displayName').fill('Warga Uji');
  await page.getByRole('button', { name: /Kirim tanggapan simulasi/ }).click();

  await expect(page.getByRole('heading', { name: /Masukan simulasi Anda telah dicatat/ })).toBeVisible();
  await expect(page.locator('#receiptCode')).toHaveText(/^SUA-\d{4}-/);

  await page.getByRole('link', { name: 'Lacak tanggapan' }).click();
  await expect(page.getByText('Tanggapan terkirim')).toBeVisible();
  await expect(page.getByText(/SUA-\d{4}-/)).toBeVisible();
});

test('the outcome makes accepted, rejected, and revised decisions inspectable', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/consultation.html?id=blok-m-lez&tab=outcome');
  expect(browserErrors).toEqual([]);
  await expect(page.getByRole('heading', { name: /Apa yang kami dengar/ })).toBeVisible();
  await expect(page.locator('#panel-outcome')).toContainText('Ditolak');
  await expect(page.locator('#panel-outcome')).toContainText('Pertimbangan instansi');
  await expect(page.locator('#panel-outcome')).toContainText('Perubahan pada rancangan');
  expect(await severeAccessibilityViolations(page)).toEqual([]);
});

test('mobile navigation opens and preserves the primary routes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only check');
  await page.goto('/');
  await page.getByRole('button', { name: /Buka menu/ }).click();
  await expect(page.getByRole('navigation', { name: /Navigasi utama/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Konsultasi Terbuka', exact: true })).toBeVisible();
});
