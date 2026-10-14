import { APIRequestContext, expect, Page } from '@playwright/test';
import { API_URL } from './ambiente';
import { Usuario } from './dados';

/* Cadastra o usuário direto na API. Usado como pré-condição dos testes E2E
   que não são sobre o cadastro em si. */
export async function cadastrarViaApi(request: APIRequestContext, usuario: Usuario) {
  const resposta = await request.post(`${API_URL}/auth/signup`, { data: usuario });
  expect(resposta.status()).toBe(200);
  return (await resposta.json()) as { id: number; email: string };
}

/* Os inputs não têm o label associado (falta htmlFor), então o campo é
   localizado pelo input que vem logo depois do texto do label. */
export function campo(page: Page, rotulo: string) {
  return page.getByText(rotulo, { exact: true }).locator('xpath=following-sibling::input');
}

export function botaoDoHeader(page: Page, nome: string) {
  return page.getByRole('banner').getByRole('button', { name: nome, exact: true });
}

/* Faz login pela interface, partindo da home, como um usuário faria */
export async function entrarPelaTela(page: Page, usuario: Usuario) {
  await page.goto('/');
  await botaoDoHeader(page, 'Entrar').click();
  await expect(page).toHaveURL('/signin');

  await campo(page, 'Email').fill(usuario.email);
  await campo(page, 'Senha').fill(usuario.password);
  await page.locator('form').getByRole('button', { name: 'Entrar' }).click();
}
