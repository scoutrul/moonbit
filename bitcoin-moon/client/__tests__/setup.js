import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Расширяем матчеры vitest, добавляя jest-dom матчеры
expect.extend(matchers);

// Очищаем после каждого теста
afterEach(() => {
  cleanup();
}); 