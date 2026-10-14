import { defineConfig, devices } from '@playwright/test';
import { API_URL, FRONT_URL } from './support/ambiente';

/**
 * Configuração dos testes E2E e de API do SQA Social Media.
 * Os testes esperam a API e o client já em execução.
 * Documentação: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /* Cada teste cria os próprios usuários, então podem rodar em paralelo */
  fullyParallel: true,
  /* Falha no CI se algum test.only for esquecido no código */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  /* 'list' mostra o resultado no terminal; o HTML fica salvo em playwright-report/ */
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'api',
      testDir: './api',
      use: { baseURL: API_URL },
    },
    {
      name: 'e2e',
      testDir: './e2e',
      use: { ...devices['Desktop Chrome'], baseURL: FRONT_URL },
    },
  ],
});
