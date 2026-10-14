import { test, expect } from '@playwright/test';
import { botaoDoHeader, cadastrarViaApi, entrarPelaTela } from '../support/acoes';
import { novoUsuario } from '../support/dados';

/* var(--secondary) do client: #10b981 */
const VERDE = 'rgb(16, 185, 129)';

test.describe('E2E - Curtidas', () => {
  test('deslogado, clicar em "Curtir" exibe um alert pedindo autenticação', async ({ page }) => {
    await page.goto('/');
    const primeiroPost = page.getByRole('listitem').first();
    await expect(primeiroPost.getByRole('heading')).not.toBeEmpty();

    // O alert trava a página até ser respondido, por isso o handler é registrado antes do clique
    const alerta = { tipo: '', mensagem: '' };
    page.once('dialog', async (dialogo) => {
      alerta.tipo = dialogo.type();
      alerta.mensagem = dialogo.message();
      await dialogo.accept();
    });

    await primeiroPost.getByRole('button', { name: 'Curtir' }).click();

    await expect.poll(() => alerta.mensagem).toBe('Você precisa estar autenticado para curtir posts!');
    expect(alerta.tipo).toBe('alert');
    await expect(primeiroPost.getByRole('button', { name: 'Curtir' })).toBeVisible();
  });

  test('logado, curte um post, encontra o post em "Posts Curtidos" e descurte', async ({ page, request }) => {
    const usuario = novoUsuario('e2e.curtida');
    await cadastrarViaApi(request, usuario);
    await entrarPelaTela(page, usuario);
    await expect(botaoDoHeader(page, 'Sair')).toBeVisible();

    const post = page.getByRole('listitem').first();
    const titulo = await post.getByRole('heading').innerText();

    const respostaCurtida = page.waitForResponse(
      (r) => r.url().includes('/like') && r.request().method() === 'POST',
    );
    await post.getByRole('button', { name: 'Curtir' }).click();
    expect((await respostaCurtida).status()).toBe(200);

    // Feedback visual do requisito 5: coração vermelho e fundo verde
    const botaoCurtido = post.getByRole('button', { name: 'Curtido' });
    await expect(botaoCurtido).toContainText('❤️');
    await expect(botaoCurtido).toHaveCSS('background-color', VERDE);

    // Em modo dev o StrictMode do React executa o useEffect duas vezes e a página busca
    // os curtidos duas vezes. Se descurtir antes da segunda resposta, ela traz o post de volta.
    let buscasCurtidos = 0;
    const segundaBuscaCurtidos = page.waitForResponse(
      (r) => r.url().includes('/posts/liked') && ++buscasCurtidos === 2,
    );
    await botaoDoHeader(page, 'Posts Curtidos').click();
    await expect(page).toHaveURL('/auth/liked');
    await segundaBuscaCurtidos;

    const curtidos = page.getByRole('listitem');
    await expect(curtidos).toHaveCount(1);
    await expect(curtidos.first().getByRole('heading')).toHaveText(titulo);

    await curtidos.first().getByRole('button', { name: 'Curtido' }).click();

    await expect(curtidos).toHaveCount(0);
    await expect(page.getByText('Você ainda não curtiu nenhum post.')).toBeVisible();
  });
});
