import { test, expect } from '@playwright/test';
import { novoUsuario } from '../support/dados';
import { DUMMYJSON_URL } from '../support/ambiente';

test.describe('API - POSTS', () => {
  test('GET /posts retorna a página pedida com título, corpo, "liked" e reações', async ({ request }) => {
    const resposta = await request.get('/posts', { params: { limit: 5, skip: 5 } });

    expect(resposta.status()).toBe(200);
    const corpo = await resposta.json();
    expect(corpo).toMatchObject({ limit: 5, skip: 5 });
    expect(corpo.posts).toHaveLength(5);
    expect(corpo.posts[0].id).toBe(6);
    for (const post of corpo.posts) {
      expect(post).toEqual({
        id: expect.any(Number),
        title: expect.any(String),
        body: expect.any(String),
        liked: false,
        reactions: { likes: expect.any(Number), dislikes: expect.any(Number) },
      });
    }
  });

  test('GET /posts repassa as curtidas e descurtidas do objeto "reactions" do DummyJSON', async ({ request }) => {
    const dummy = await (
      await request.get(`${DUMMYJSON_URL}/posts`, { params: { limit: 10, skip: 0 } })
    ).json();

    const resposta = await request.get('/posts', { params: { limit: 10, skip: 0 } });

    expect(resposta.status()).toBe(200);
    const corpo = await resposta.json();
    expect(corpo.posts.map((p: { id: number; reactions: object }) => ({ id: p.id, reactions: p.reactions }))).toEqual(
      dummy.posts.map((p: { id: number; reactions: object }) => ({ id: p.id, reactions: p.reactions })),
    );
  });

  test('POST /posts/{id}/like curte e descurte o post para o usuário', async ({ request }) => {
    const usuario = await (await request.post('/auth/signup', { data: novoUsuario('like') })).json();
    const userId = usuario.id;

    const curtir = await request.post('/posts/3/like', { params: { userId } });
    expect(curtir.status()).toBe(200);
    expect(await curtir.json()).toEqual({ postId: 3, liked: true });

    const feed = await (await request.get('/posts', { params: { limit: 3, skip: 0, userId } })).json();
    expect(feed.posts.map((p: { liked: boolean }) => p.liked)).toEqual([false, false, true]);

    const curtidos = await (await request.get('/posts/liked', { params: { userId } })).json();
    expect(curtidos.total).toBe(1);
    expect(curtidos.posts[0]).toMatchObject({ id: 3, liked: true });

    const descurtir = await request.post('/posts/3/like', { params: { userId } });
    expect(await descurtir.json()).toEqual({ postId: 3, liked: false });

    const curtidosDepois = await (await request.get('/posts/liked', { params: { userId } })).json();
    expect(curtidosDepois.total).toBe(0);
  });

  test('GET /posts/liked retorna 400 quando o userId não é informado', async ({ request }) => {
    const resposta = await request.get('/posts/liked');

    expect(resposta.status()).toBe(400);
  });
});
