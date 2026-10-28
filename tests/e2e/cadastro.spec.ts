import { test, expect, Page } from '@playwright/test';
import { botaoDoHeader, campo } from '../support/acoes';
import { novoUsuario, Usuario } from '../support/dados';

async function preencherCadastro(page: Page, usuario: Usuario) {
  await campo(page, 'Email').fill(usuario.email);
  await campo(page, 'Senha').fill(usuario.password);
  await campo(page, 'Confirmar Senha').fill(usuario.password);
  await page.locator('form').getByRole('button', { name: 'Criar Conta' }).click();
}

test.describe('E2E - Cadastro', () => {
  test('cadastra um novo usuário, autentica e redireciona para a home', async ({ page }) => {
    const usuario = novoUsuario('e2e.cadastro');

    await page.goto('/');
    await botaoDoHeader(page, 'Criar Conta').click();
    await expect(page).toHaveURL('/signup');

    await preencherCadastro(page, usuario);

    await expect(page).toHaveURL('/');
    await expect(botaoDoHeader(page, 'Posts Curtidos')).toBeVisible();
    await expect(botaoDoHeader(page, 'Sair')).toBeVisible();
    await expect(botaoDoHeader(page, 'Entrar')).toBeHidden();
  });

  test('mostra o critério que falta e não cadastra quando a senha é fraca', async ({ page }) => {
    const usuario = { ...novoUsuario('e2e.cadastro'), password: 'senhasemmaiuscula1@' };

    await page.goto('/signup');
    await preencherCadastro(page, usuario);

    await expect(page.getByText('A senha deve conter: uma letra maiúscula', { exact: true })).toBeVisible();
    await expect(page).toHaveURL('/signup');
    await expect(botaoDoHeader(page, 'Entrar')).toBeVisible();
  });

  test.fail('[BUG] aceita senha forte com exatamente 8 caracteres', async ({ page }) => {
    const usuario = { ...novoUsuario('e2e.oito'), password: 'Abcdef1@' };

    await page.goto('/signup');
    await preencherCadastro(page, usuario);

    // Requisito 1 pede mínimo de 8 caracteres, mas o client usa "length <= 8"
    // e mostra "A senha deve conter: mínimo de 8 caracteres".
    await expect(page).toHaveURL('/');
    await expect(botaoDoHeader(page, 'Sair')).toBeVisible();
  });
});
