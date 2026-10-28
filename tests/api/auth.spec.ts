import { test, expect } from '@playwright/test';
import { novoUsuario } from '../support/dados';

test.describe('API - POST /auth/signup', () => {
  test('cria o usuário quando o e-mail é válido e a senha é forte', async ({ request }) => {
    const usuario = novoUsuario('signup');

    const resposta = await request.post('/auth/signup', { data: usuario });

    expect(resposta.status()).toBe(200);
    const corpo = await resposta.json();
    expect(corpo.id).toEqual(expect.any(Number));
    expect(corpo.email).toBe(usuario.email);
  });

  test('retorna 409 quando o e-mail já está cadastrado', async ({ request }) => {
    const usuario = novoUsuario('duplicado');
    await request.post('/auth/signup', { data: usuario });

    const resposta = await request.post('/auth/signup', { data: usuario });

    expect(resposta.status()).toBe(409);
    expect((await resposta.json()).status).toBe(409);
  });

  test.fail('[BUG] retorna a mensagem "E-mail já cadastrado" quando o e-mail já existe', async ({ request }) => {
    const usuario = novoUsuario('duplicado');
    await request.post('/auth/signup', { data: usuario });

    const resposta = await request.post('/auth/signup', { data: usuario });

    // Requisito 1. A API responde "E-mail já está em uso".
    expect((await resposta.json()).message).toBe('E-mail já cadastrado');
  });

  test('retorna 422 "Senha inválida" quando a senha não tem caractere especial', async ({ request }) => {
    const usuario = { ...novoUsuario('senhafraca'), password: 'Senha1234' };

    const resposta = await request.post('/auth/signup', { data: usuario });

    expect(resposta.status()).toBe(422);
    expect(await resposta.json()).toEqual({ message: 'Senha inválida', status: 422 });
  });
});

test.describe('API - POST /auth/signin', () => {
  test('autentica o usuário com e-mail e senha corretos', async ({ request }) => {
    const usuario = novoUsuario('signin');
    const cadastrado = await (await request.post('/auth/signup', { data: usuario })).json();

    const resposta = await request.post('/auth/signin', { data: usuario });

    expect(resposta.status()).toBe(200);
    const corpo = await resposta.json();
    expect(corpo.id).toBe(cadastrado.id);
    expect(corpo.email).toBe(usuario.email);
  });

  test('retorna 401 "Credenciais inválidas" quando a senha está incorreta', async ({ request }) => {
    const usuario = novoUsuario('signin');
    await request.post('/auth/signup', { data: usuario });

    const resposta = await request.post('/auth/signin', {
      data: { email: usuario.email, password: 'OutraSenha1@' },
    });

    expect(resposta.status()).toBe(401);
    expect(await resposta.json()).toEqual({ message: 'Credenciais inválidas', status: 401 });
  });
});

test.describe('API - POST /auth/reset-password', () => {
  test('aceita a solicitação para um e-mail cadastrado', async ({ request }) => {
    const usuario = novoUsuario('reset');
    await request.post('/auth/signup', { data: usuario });

    const resposta = await request.post('/auth/reset-password', { data: { email: usuario.email } });

    expect(resposta.status()).toBe(200);
  });

  test('retorna 404 "Usuário não encontrado" para e-mail não cadastrado', async ({ request }) => {
    const { email } = novoUsuario('naocadastrado');

    const resposta = await request.post('/auth/reset-password', { data: { email } });

    expect(resposta.status()).toBe(404);
    expect(await resposta.json()).toEqual({ message: 'Usuário não encontrado', status: 404 });
  });
});
