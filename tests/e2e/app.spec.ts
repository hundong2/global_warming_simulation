import { test, expect, type Page } from '@playwright/test';
async function range(page: Page, id: string, value: number) {
  await page.locator(`#${id}`).evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}
async function ready(page: Page) {
  await page.goto('./');
  await expect(page.locator('#globe')).toHaveAttribute('data-frames', /[1-9]/);
  await expect(page.locator('#globe-error')).toBeHidden();
}
test('boots with rendered geography, no remote requests, errors, or horizontal overflow', async ({
  page,
}, info) => {
  const errors: string[] = [],
    remote: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (req) => {
    if (
      !req.url().startsWith('http://127.0.0.1:4193/') &&
      !req.url().startsWith('data:')
    )
      remote.push(req.url());
  });
  await ready(page);
  await expect(
    page.getByRole('heading', { name: '같은 지구, 다른 미래.' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath('lab.png'), fullPage: true });
  expect(errors).toEqual([]);
  expect(remote).toEqual([]);
});
test('presets and custom temperature update year-specific results; reset restores defaults', async ({
  page,
}) => {
  await ready(page);
  await range(page, 'year', 2100);
  await page.locator('[data-scenario="high"]').click();
  await expect(page.locator('#sea-value')).toContainText('0.63–1.01');
  await range(page, 'target', 1.5);
  await expect(page.locator('#custom-label')).toHaveText('사용자 실험');
  await expect(page.locator('#ice-value')).toContainText('26.0');
  await page.getByRole('button', { name: '모든 실험 설정 초기화' }).click();
  await expect(page.locator('#year-value')).toHaveText('2050');
  await expect(page.locator('[data-scenario="middle"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
test('ocean ENSO modes and globe camera can be changed', async ({
  page,
}, info) => {
  await ready(page);
  await page.locator('#enso').selectOption('nino');
  await page.getByRole('button', { name: '태평양', exact: true }).click();
  const canvas = page.locator('#globe canvas');
  const before = await canvas.screenshot();
  await page.locator('#enso').selectOption('nina');
  await expect(page.locator('#legend-title')).toContainText('수온 편차');
  await expect(page.locator('#legend-low')).toHaveText('−2°C');
  await expect
    .poll(async () => Buffer.compare(before, await canvas.screenshot()))
    .not.toBe(0);
  await page.getByRole('button', { name: '지구본 확대' }).click();
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  await page.screenshot({ path: info.outputPath('enso.png'), fullPage: true });
});
test('all four layers expose their explanation and ice/sea visuals', async ({
  page,
}, info) => {
  await ready(page);
  for (const layer of ['sea', 'ice', 'cyclone', 'temperature']) {
    await page.locator(`[data-layer="${layer}"]`).click();
    await expect(page.locator(`[data-layer="${layer}"]`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('#layer-title')).not.toBeEmpty();
  }
  await page.locator('[data-layer="ice"]').click();
  await range(page, 'year', 2100);
  await expect(page.locator('.glacier-compare')).toBeVisible();
  await page.screenshot({ path: info.outputPath('ice.png'), fullPage: true });
  await page.locator('[data-layer="sea"]').click();
  await expect(page.locator('.coast')).toBeVisible();
});
test('cyclone experiment responds to shear and latitude without inventing probabilities', async ({
  page,
}, info) => {
  await ready(page);
  await page.locator('[data-layer="cyclone"]').click();
  await expect(page.locator('#cyclone-lab')).toBeVisible();
  await range(page, 'shear', 30);
  await expect(page.locator('#cyclone-score')).toContainText('0 / 100점');
  await range(page, 'shear', 0);
  await range(page, 'latitude', 0);
  await expect(page.locator('#cyclone-explanation')).toContainText(
    '회전 조건 부족',
  );
  await range(page, 'latitude', 15);
  await expect(page.locator('#cyclone-score')).not.toContainText(' 0 /');
  await page.screenshot({
    path: info.outputPath('cyclone.png'),
    fullPage: true,
  });
});
test('playback advances, pause freezes, dialogs stop time, and end stops at 2100', async ({
  page,
}) => {
  await ready(page);
  await page.locator('#speed').selectOption('5');
  await page.getByRole('button', { name: '시간 재생', exact: true }).click();
  await expect
    .poll(async () => Number(await page.locator('#year-value').textContent()))
    .toBeGreaterThan(2050);
  await page.getByRole('button', { name: '시간 일시정지' }).click();
  const year = await page.locator('#year-value').textContent();
  await page.waitForTimeout(450);
  await expect(page.locator('#year-value')).toHaveText(year!);
  await page.getByRole('button', { name: '시간 재생', exact: true }).click();
  await page.locator('#sources-open').click();
  await expect(page.locator('#play')).toHaveAttribute(
    'aria-label',
    '시간 재생',
  );
  await page.keyboard.press('Escape');
  await range(page, 'year', 2099);
  await page.getByRole('button', { name: '시간 재생', exact: true }).click();
  await expect(page.locator('#year-value')).toHaveText('2100');
  await expect(page.locator('#play')).toHaveAttribute(
    'aria-label',
    '시간 재생',
  );
});
test('impacts distinguish frequency from incidence and adaptation only reduces risk scores', async ({
  page,
}, info) => {
  await ready(page);
  const warming = await page.locator('#warming').textContent();
  await page.getByRole('button', { name: '기후와 우리', exact: true }).click();
  await expect(page.locator('#view-impacts')).toBeVisible();
  const before = await page.locator('#flood-value').textContent();
  await range(page, 'adaptation', 100);
  expect(await page.locator('#flood-value').textContent()).not.toBe(before);
  await expect(page.locator('#warming')).toHaveText(warming!);
  await expect(page.locator('#health-chart .health-row')).toHaveCount(4);
  await expect(page.locator('#comparison-table tr')).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath('impacts.png'),
    fullPage: true,
  });
});
test('action checklist persists, resets, and does not alter climate settings', async ({
  page,
}, info) => {
  await ready(page);
  await page
    .getByRole('button', { name: '함께하는 실천', exact: true })
    .click();
  await page.locator('[data-action="energy"]').check();
  await expect(page.locator('#action-count')).toHaveText('1 / 6');
  await page.reload();
  await page
    .getByRole('button', { name: '함께하는 실천', exact: true })
    .click();
  await expect(page.locator('[data-action="energy"]')).toBeChecked();
  await page.screenshot({
    path: info.outputPath('actions.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: '실천 계획 초기화' }).click();
  await expect(page.locator('#action-count')).toHaveText('0 / 6');
  await expect(page.locator('#year-value')).toHaveText('2050');
});
test('share link restores all settings and export carries assumptions and sources', async ({
  page,
}) => {
  await ready(page);
  await range(page, 'target', 3.6);
  await range(page, 'year', 2084);
  await page.locator('#enso').selectOption('nina');
  await page.locator('#share').click();
  const link = await page.locator('#share-url').inputValue();
  await page.goto(link);
  await expect(page.locator('#year-value')).toHaveText('2084');
  await expect(page.locator('#target-value')).toHaveText('+3.6');
  await expect(page.locator('#enso')).toHaveValue('nina');
  await page.locator('#sources-open').click();
  const download = page.waitForEvent('download');
  await page.locator('#export').click();
  const result = await download;
  expect(result.suggestedFilename()).toBe('climate-lab-2084.json');
  const stream = await result.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const snapshot = JSON.parse(Buffer.concat(chunks).toString());
  expect(snapshot.settings.year).toBe(2084);
  expect(snapshot.assumptions).toContain('not incidence');
  expect(snapshot.sources).toHaveLength(8);
});
test('paused rendering sleeps, explicit rotation renders, and hidden views stop it', async ({
  page,
}) => {
  await ready(page);
  await page.waitForTimeout(250);
  const frames = await page.locator('#globe').getAttribute('data-frames');
  await page.waitForTimeout(300);
  await expect(page.locator('#globe')).toHaveAttribute('data-frames', frames!);
  await page.locator('#rotate').check();
  await expect
    .poll(async () =>
      Number(await page.locator('#globe').getAttribute('data-frames')),
    )
    .toBeGreaterThan(Number(frames));
  await page
    .getByRole('button', { name: '함께하는 실천', exact: true })
    .click();
  await page.waitForTimeout(150);
  const hiddenFrames = await page.locator('#globe').getAttribute('data-frames');
  await page.waitForTimeout(300);
  await expect(page.locator('#globe')).toHaveAttribute(
    'data-frames',
    hiddenFrames!,
  );
});
test('geography failure preserves controls and retry recovers', async ({
  page,
}) => {
  await page.route('**/data/countries.geojson', (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('#globe-error')).toBeVisible();
  await range(page, 'target', 4);
  await expect(page.locator('#target-value')).toHaveText('+4.0');
  await page.unroute('**/data/countries.geojson');
  await page.getByRole('button', { name: '3D 화면 다시 시작' }).click();
  await expect(page.locator('#globe-error')).toBeHidden();
  await expect(page.locator('#globe')).toHaveAttribute('data-frames', /[1-9]/);
});
test('WebGL context loss is explained and restoration keeps the experiment', async ({
  page,
}) => {
  await ready(page);
  await range(page, 'year', 2080);
  await page.locator('#globe canvas').evaluate((canvas) => {
    const context = (canvas as HTMLCanvasElement).getContext('webgl2')!;
    const ext = context.getExtension('WEBGL_lose_context')!;
    (window as unknown as { restoreGraphics: () => void }).restoreGraphics =
      () => ext.restoreContext();
    ext.loseContext();
  });
  await expect(page.locator('#globe-error')).toBeVisible();
  await page.evaluate(() =>
    (window as unknown as { restoreGraphics: () => void }).restoreGraphics(),
  );
  await expect(page.locator('#globe-error')).toBeHidden();
  await expect(page.locator('#year-value')).toHaveText('2080');
});
