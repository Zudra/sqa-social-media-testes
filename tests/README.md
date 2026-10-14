# Testes E2E e de API (Playwright)

Testes de caixa-preta do SQA Social Media rodando contra o sistema em execução:

- **E2E** (`e2e/`): simulam um usuário real no navegador (Chromium) usando o client.
- **API** (`api/`): chamam os endpoints HTTP da API diretamente, sem passar pelo client.

São **8 testes E2E** e **11 testes de API**. Os testes que capturam bugs têm o prefixo **`[BUG]`** no nome e **falham de propósito**. Os outros são testes de regressão e devem passar.

## Como o projeto foi criado

O projeto foi iniciado do zero dentro da pasta `tests/` com o instalador oficial do Playwright:

```bash
mkdir tests && cd tests
npm init playwright@latest
```

Opções escolhidas no instalador: **TypeScript**, apenas o navegador **Chromium** e **sem** os arquivos de exemplo. Depois disso, o `playwright.config.ts` foi ajustado para ter dois projetos:

| Projeto | Pasta | `baseURL` | Navegador |
|---|---|---|---|
| `api` | `api/` | URL da API (`API_URL`) | nenhum, só requisições HTTP |
| `e2e` | `e2e/` | URL do client (`FRONT_URL`) | Desktop Chrome |

Assim os testes de API não abrem navegador e os testes E2E usam caminhos relativos (`page.goto('/')`).

## Como rodar

Pré-requisitos: **Node.js 18+** e o sistema rodando (MySQL, API e client). Os passos para subir a aplicação estão em [TESTES.md](../TESTES.md#como-rodar-a-aplicação-para-demonstrar-os-bugs).

Por padrão os testes esperam:

- Client em `http://localhost:3000`
- API em `http://localhost:8080`

```bash
cd tests
npm install
npx playwright install chromium

npm test            # todos os testes
npm run test:e2e    # só os testes E2E
npm run test:api    # só os testes de API
npm run report      # abre o relatório HTML da última execução
```

Se o client ou a API estiverem em outra porta, basta informar a URL:

```bash
FRONT_URL=http://localhost:3001 npm test
API_URL=http://localhost:8081 npm run test:api
```

Outros modos úteis:

```bash
npx playwright test --headed                  # mostra o navegador
npm run test:ui                               # modo UI, passo a passo
npx playwright test --grep-invert "\[BUG\]"   # só os testes de regressão
```

Resultado esperado:

```
  3 failed
    [api] › api/auth.spec.ts › API - POST /auth/signup › [BUG] retorna a mensagem "E-mail já cadastrado" quando o e-mail já existe
    [e2e] › e2e/cadastro.spec.ts › E2E - Cadastro › [BUG] aceita senha forte com exatamente 8 caracteres
    [e2e] › e2e/login.spec.ts › E2E - Login e logout › [BUG] mantém o usuário logado depois de recarregar a página
  16 passed
```

Quando um teste falha, o Playwright salva screenshot e trace em `test-results/`. O trace pode ser aberto com `npx playwright show-trace <arquivo>.zip` ou pelo `npm run report`.

## Estrutura

```text
tests/
├── api/
│   ├── auth.spec.ts        # /auth/signup, /auth/signin, /auth/reset-password
│   └── posts.spec.ts       # /posts, /posts/{id}/like, /posts/liked
├── e2e/
│   ├── cadastro.spec.ts    # fluxo de criar conta
│   ├── login.spec.ts       # fluxo de login e logout
│   └── curtidas.spec.ts    # curtir com e sem autenticação, posts curtidos
├── support/
│   ├── ambiente.ts         # URLs do client e da API (FRONT_URL / API_URL)
│   ├── dados.ts            # gera usuários com e-mail único
│   └── acoes.ts            # cadastro via API, login pela tela e localizadores
├── package.json
└── playwright.config.ts
```

## Testes E2E

| Arquivo | Teste | Requisito | Resultado |
|---|---|---|---|
| `cadastro.spec.ts` | Home → "Criar Conta" → preenche o formulário → volta para `/` logado ("Posts Curtidos" e "Sair" no header) | 1, 4 | ✅ passa |
| `cadastro.spec.ts` | Senha sem letra maiúscula mostra "A senha deve conter: uma letra maiúscula" e não sai de `/signup` | 1 | ✅ passa |
| `cadastro.spec.ts` | **[BUG]** Senha forte com exatamente 8 caracteres (`Abcdef1@`) deve cadastrar | 1 | ❌ **falha (bug)** |
| `login.spec.ts` | Home → "Entrar" → login correto → volta para `/` logado → "Sair" → header volta a mostrar "Entrar" e "Criar Conta" | 2, 4 | ✅ passa |
| `login.spec.ts` | Senha errada mostra "Credenciais inválidas" e o usuário continua deslogado em `/signin` | 2 | ✅ passa |
| `login.spec.ts` | **[BUG]** Usuário logado continua logado depois de recarregar a página (F5) | 2, 6 | ❌ **falha (bug)** |
| `curtidas.spec.ts` | Deslogado, clicar em "Curtir" abre um `alert` com "Você precisa estar autenticado para curtir posts!" | 5 | ✅ passa |
| `curtidas.spec.ts` | Logado, curte o primeiro post (❤️, "Curtido" e fundo verde) → "Posts Curtidos" mostra só esse post → descurte e a lista fica vazia | 5, 6 | ✅ passa |

## Testes de API

| Arquivo | Teste | Resultado |
|---|---|---|
| `auth.spec.ts` | `POST /auth/signup` com e-mail válido e senha forte → `200` com `id` e `email` | ✅ passa |
| `auth.spec.ts` | `POST /auth/signup` com e-mail duplicado → `409` | ✅ passa |
| `auth.spec.ts` | **[BUG]** `POST /auth/signup` com e-mail duplicado → mensagem "E-mail já cadastrado" | ❌ **falha (bug)** |
| `auth.spec.ts` | `POST /auth/signup` com senha sem caractere especial → `422` "Senha inválida" | ✅ passa |
| `auth.spec.ts` | `POST /auth/signin` com credenciais corretas → `200` com o mesmo `id` do cadastro | ✅ passa |
| `auth.spec.ts` | `POST /auth/signin` com senha incorreta → `401` "Credenciais inválidas" | ✅ passa |
| `auth.spec.ts` | `POST /auth/reset-password` com e-mail cadastrado → `200` | ✅ passa |
| `auth.spec.ts` | `POST /auth/reset-password` com e-mail não cadastrado → `404` "Usuário não encontrado" | ✅ passa |
| `posts.spec.ts` | `GET /posts?limit=5&skip=5` → 5 posts a partir do id 6, cada um com `id`, `title`, `body` e `liked = false` | ✅ passa |
| `posts.spec.ts` | `POST /posts/3/like` curte (`liked = true`), o post aparece curtido em `GET /posts` e em `GET /posts/liked`; a segunda chamada descurte (`liked = false`) | ✅ passa |
| `posts.spec.ts` | `GET /posts/liked` sem `userId` → `400` | ✅ passa |

## Bugs capturados

### Bug 1 (API): mensagem errada para e-mail já cadastrado

- **Requisito 1:** a mensagem deve ser "E-mail já cadastrado".
- **Comportamento atual:** a API responde `409` com "E-mail já está em uso" (`AuthController.signup`).
- **Teste:** `api/auth.spec.ts` › `[BUG] retorna a mensagem "E-mail já cadastrado" quando o e-mail já existe`
- É o mesmo bug encontrado na Atividade 2 com MockMvc, agora confirmado de fora, contra a API rodando.

### Bug 2 (client): senha com exatamente 8 caracteres é rejeitada

- **Requisito 1:** a senha deve ter no mínimo 8 caracteres.
- **Comportamento atual:** com `Abcdef1@` a tela mostra "A senha deve conter: mínimo de 8 caracteres" e não envia o cadastro. `client/src/utils/password.ts` usa `password.length <= 8`.
- **Teste:** `e2e/cadastro.spec.ts` › `[BUG] aceita senha forte com exatamente 8 caracteres`
- A API aceita essa senha, então o bug está só no client.

### Bug 3 (client): a sessão se perde ao recarregar a página

- **Comportamento atual:** depois do login, um F5 desloga o usuário. Em `client/src/lib/localStorage.ts`, `saveUser` grava na chave `"user"`, mas `getUser` e `removeUser` usam `"sqa_social_user"`.
- **Consequência:** acessar `/auth/liked` digitando a URL sempre redireciona para o login, mesmo logado (requisito 6).
- **Teste:** `e2e/login.spec.ts` › `[BUG] mantém o usuário logado depois de recarregar a página`
- Esse bug aparece com o sistema rodando no navegador. Os testes da Atividade 2 não pegavam porque nenhum deles recarrega a página.

## Decisões

- **Dados isolados:** cada teste cria o próprio usuário com e-mail único (`support/dados.ts`). Não é preciso limpar o banco, e os testes podem rodar em paralelo e repetidos.
- **Pré-condição pela API:** nos testes E2E de login e curtidas, o usuário é cadastrado direto na API (`cadastrarViaApi`). Assim o teste foca no fluxo que está sendo testado, e o cadastro pela tela tem o seu próprio teste.
- **Navegação pelo header:** por causa do Bug 3, os fluxos logados navegam clicando nos botões do header, e não com `page.goto`, que recarregaria a página e perderia a sessão.
- **Localizadores:** os testes usam papéis e textos visíveis (`getByRole`, `getByText`), como o usuário enxerga a tela. Os `<label>` do client não estão ligados aos inputs (falta `htmlFor`), então o helper `campo()` localiza o input que vem logo depois do texto do label.
- **Alert nativo:** o handler de `dialog` é registrado antes do clique, porque o `alert` trava a página até ser respondido.
- **Esperas:** nenhum `waitForTimeout`. As asserções do Playwright esperam o estado esperado, e a curtida espera a resposta do `POST /posts/{id}/like` antes de seguir.
