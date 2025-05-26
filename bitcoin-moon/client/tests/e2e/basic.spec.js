const { test, expect } = require('@playwright/test');

test('Главная страница загружается и содержит #root', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
});
