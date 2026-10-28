# SQA Social Media

Projeto educacional com uma API Spring Boot e um frontend Next.js.

## Visão Geral

- `api/`: backend Java 17 com Spring Boot, autenticação, usuários, posts e curtidas.
- `client/`: frontend Next.js/React que consome a API.
- `tests/`: testes E2E e de API com Playwright, executados contra o sistema rodando.

Principais rotas da aplicação:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8080`

## Como Rodar

Pré-requisitos:

- Java 17+
- Node.js 18+
- npm
- MySQL configurado para o ambiente de desenvolvimento

API:

```bash
cd api
./mvnw spring-boot:run
```

Frontend:

```bash
cd client
npm install
npm run dev
```

O frontend usa `NEXT_PUBLIC_BASE_URL` para definir a URL da API. Exemplo de `.env` em `client/`:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:8080
```

## Testes (Atividade 2)

Veja **[TESTES.md](TESTES.md)**: como rodar, quais testes foram criados e os bugs encontrados.

```bash
cd api && ./mvnw test      # backend: 6 testes, 1 bug conhecido (@Disabled)
cd client && npm test      # frontend: 6 testes, 1 bug conhecido (test.failing)
```

## Testes E2E e de API (Playwright)

Veja **[tests/README.md](tests/README.md)**: como o projeto foi criado, como rodar, quais testes existem e os bugs capturados. Precisa da API e do client rodando.

```bash
cd tests
npm install
npx playwright install chromium
npm test                   # 8 E2E + 11 de API, 3 bugs conhecidos (test.fail)
```

## Integração Contínua (GitHub Actions)

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda **toda a suíte de testes** sempre que um Pull Request para a `main` é aberto ou atualizado. Também pode ser disparado manualmente pela aba **Actions** (`workflow_dispatch`).

| Job | O que faz |
|---|---|
| `API - JUnit, MockMvc e Mockito` | Configura o Java 17 e roda `./mvnw test` em `api/` (banco H2 em memória). |
| `Client - Jest e Testing Library` | Configura o Node.js 22, roda `npm ci` e `npm test` em `client/`. |
| `E2E e API - Playwright` | Sobe um MySQL 8.4 como *service container*, faz o build e inicia a API (`:8080`), inicia o client em modo dev (`:3000`) e pré-compila as páginas, instala o Chromium e roda `npm test` em `tests/`. |

O job do Playwright só começa se os dois jobs de testes unitários passarem. Ao final, o relatório do Playwright, os relatórios do Surefire e os logs da API e do client ficam disponíveis como *artifacts* da execução.

Os testes `[BUG]` estão marcados como falha conhecida (`@Disabled`, `test.failing` e `test.fail`), então a pipeline fica verde enquanto os bugs documentados continuarem iguais e todos os testes de regressão passarem.

## Documentações

- [Testes e bugs encontrados](TESTES.md)
- [Testes E2E e de API](tests/README.md)
- [README da API](api/README.md)
- [README do Frontend](client/README.md)
- [DummyJSON API Docs](https://dummyjson.com/docs)
