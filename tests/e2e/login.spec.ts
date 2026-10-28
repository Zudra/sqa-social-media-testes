import { test, expect } from '@playwright/test';
import { botaoDoHeader, cadastrarViaApi, entrarPelaTela } from '../support/acoes';
import { novoUsuario } from '../support/dados';

test.describe('E2E - Login e logout', () => {
  test('faz login com credenciais válidas, vai para a home e depois sai da conta', async ({ page, request }) => {
    const usuario = novoUsuario('e2e.login');
    await cadastrarViaApi(request, usuario);

    await entrarPelaTela(page, usuario);

    await expect(page).toHaveURL('/');
    await expect(botaoDoHeader(page, 'Posts Curtidos')).toBeVisible();

    await botaoDoHeader(page, 'Sair').click();

    await expect(botaoDoHeader(page, 'Entrar')).toBeVisible();
    await expect(botaoDoHeader(page, 'Criar Conta')).toBeVisible();
    await expect(botaoDoHeader(page, 'Sair')).toBeHidden();
  });

  test('mostra "Credenciais inválidas" e continua deslogado quando a senha está errada', async ({ page, request }) => {
    const usuario = novoUsuario('e2e.login');
    await cadastrarViaApi(request, usuario);

    await entrarPelaTela(page, { ...usuario, password: 'OutraSenha1@' });

    await expect(page.getByText('Credenciais inválidas')).toBeVisible();
    await expect(page).toHaveURL('/signin');
    await expect(botaoDoHeader(page, 'Entrar')).toBeVisible();
  });

  test.fail('[BUG] mantém o usuário logado depois de recarregar a página', async ({ page, request }) => {
    const usuario = novoUsuario('e2e.reload');
    await cadastrarViaApi(request, usuario);

    await entrarPelaTela(page, usuario);
    await expect(botaoDoHeader(page, 'Sair')).toBeVisible();

    await page.reload();

    // saveUser grava o usuário na chave "user", mas getUser lê "sqa_social_user",
    // então a sessão se perde no F5.
    await expect(botaoDoHeader(page, 'Sair')).toBeVisible();
  });
});
