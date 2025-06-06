import { test, expect } from '@playwright/test';

test.describe('Bitcoin Price Display', () => {
  test('should display current bitcoin price', async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');

    // Ждем загрузки компонента с ценой
    const priceContainer = await page.waitForSelector('[data-testid="bitcoin-price"]');
    expect(priceContainer).toBeTruthy();

    // Проверяем, что цена отображается
    const priceText = await priceContainer.textContent();
    expect(priceText).toMatch(/\d+/); // Должно содержать цифры

    // Проверяем, что есть индикатор изменения цены
    const changeIndicator = await page.waitForSelector('[data-testid="price-change"]');
    expect(changeIndicator).toBeTruthy();

    // Проверяем, что время обновления отображается
    const lastUpdated = await page.waitForSelector('[data-testid="last-updated"]');
    expect(lastUpdated).toBeTruthy();
  });

  test('should update price periodically', async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');

    // Ждем загрузки компонента с ценой
    const priceContainer = await page.waitForSelector('[data-testid="bitcoin-price"]');
    const initialPrice = await priceContainer.textContent();

    // Ждем 65 секунд (обновление происходит каждую минуту)
    await page.waitForTimeout(65000);

    // Получаем новую цену
    const updatedPrice = await priceContainer.textContent();

    // Проверяем, что цена обновилась
    expect(updatedPrice).not.toBe(initialPrice);
  });

  test('should handle loading state', async ({ page }) => {
    // Переходим на главную страницу
    await page.goto('/');

    // Проверяем наличие индикатора загрузки
    const loadingIndicator = await page.waitForSelector('[data-testid="loading-skeleton"]');
    expect(loadingIndicator).toBeTruthy();

    // Ждем появления цены (это означает, что загрузка завершена)
    await page.waitForSelector('[data-testid="bitcoin-price"]');

    // Проверяем, что индикатор загрузки исчез
    const isLoadingVisible = await loadingIndicator.isVisible();
    expect(isLoadingVisible).toBeFalsy();
  });

  test('should handle error state', async ({ page }) => {
    // Имитируем ошибку сети
    await page.route('**/api/bitcoin/current', (route) => route.abort());

    // Переходим на главную страницу
    await page.goto('/');

    // Проверяем, что отображается сообщение об ошибке
    const errorMessage = await page.waitForSelector('[data-testid="error-message"]');
    expect(errorMessage).toBeTruthy();
    expect(await errorMessage.textContent()).toContain('Не удалось загрузить данные о цене');
  });
});
