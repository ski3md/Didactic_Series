const { chromium } = require('playwright');

const BASE_URL = process.env.DIDACTIC_BASE_URL || 'http://127.0.0.1:5173/Didactic_Series/';
const PLACEHOLDER_TEXT = [
  'No image has been assigned to this slide.',
  'No image has been assigned to this entity.',
  'Image unavailable',
];

const auditPage = async (page, label) => {
  await page.waitForLoadState('load');
  await page
    .waitForFunction(
      () =>
        Array.from(document.images)
          .filter((img) => {
            const rect = img.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          })
          .every((img) => img.complete || img.naturalWidth > 0),
      null,
      { timeout: 7000 }
    )
    .catch(() => undefined);
  const bodyText = await page.locator('body').innerText();
  const placeholderHits = PLACEHOLDER_TEXT.filter((text) => bodyText.includes(text));
  const images = await page.locator('img').evaluateAll((nodes) =>
    nodes.map((img) => ({
      alt: img.getAttribute('alt') || '',
      src: img.currentSrc || img.getAttribute('src') || '',
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      renderedWidth: img.getBoundingClientRect().width,
      renderedHeight: img.getBoundingClientRect().height,
    }))
  );
  const failedImages = images.filter(
    (image) =>
      image.renderedWidth > 0 &&
      image.renderedHeight > 0 &&
      image.complete &&
      (image.naturalWidth === 0 || image.naturalHeight === 0)
  );

  return {
    label,
    url: page.url(),
    imageCount: images.length,
    placeholderHits,
    failedImages: failedImages.slice(0, 25),
    failedImageCount: failedImages.length,
  };
};

const clickUnique = async (page, locator, description) => {
  const count = await locator.count();
  if (count !== 1) {
    throw new Error(`${description} resolved to ${count} elements.`);
  }
  await locator.click();
  await page.waitForLoadState('load');
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const reports = [];

  await page.goto(BASE_URL, { waitUntil: 'load' });
  reports.push(await auditPage(page, 'Home'));

  const lecturesButton = page.getByRole('button', { name: 'View all lectures' });
  if ((await lecturesButton.count()) === 1) {
    await lecturesButton.click();
    await page.waitForLoadState('load');
  }

  reports.push(await auditPage(page, 'Lecture library'));

  const lectureNames = await page.locator('button').evaluateAll((buttons) =>
    buttons
      .map((button) => button.innerText.replace(/\s+/g, ' ').trim())
      .filter((text) => text.endsWith('Start lecture'))
  );

  for (const lectureName of lectureNames) {
    await clickUnique(page, page.getByRole('button', { name: lectureName }), `Lecture card ${lectureName}`);
    reports.push(await auditPage(page, lectureName.replace(/\s*Start lecture$/, '')));
    await clickUnique(page, page.getByRole('button', { name: 'Back to lecture list' }), 'Back to lecture list');
  }

  await clickUnique(page, page.getByRole('button', { name: 'Reference Library' }), 'Reference Library nav');
  reports.push(await auditPage(page, 'Reference Library'));

  await browser.close();

  const failures = reports.filter((report) => report.placeholderHits.length > 0 || report.failedImages.length > 0);
  const summary = {
    baseUrl: BASE_URL,
    pagesAudited: reports.length,
    totalImages: reports.reduce((sum, report) => sum + report.imageCount, 0),
    pagesWithPlaceholders: reports.filter((report) => report.placeholderHits.length > 0).length,
    failedImages: reports.reduce((sum, report) => sum + report.failedImageCount, 0),
    failures,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
};

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
