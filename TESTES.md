# Atividade 2 - Prática de testes 1

Testes automatizados para o projeto SQA Social Media (Spring Boot + Next.js), feitos a partir dos requisitos da atividade.

- **Backend:** 6 testes (2 JUnit puro, 2 MockMvc, 2 Mockito). **1 falha de propósito** e captura um bug.
- **Frontend:** 6 testes (2 funções puras, 2 componentes, 2 integração). **1 falha de propósito** e captura um bug.

Os testes que capturam bugs têm o prefixo **`[BUG]`** no nome. Os outros são testes de regressão e devem passar.

## Como rodar os testes

Pré-requisitos: **Java 17+** e **Node.js 18+**. Os testes **não** precisam de MySQL nem da API rodando: o backend usa H2 em memória (`api/src/test/resources/application.properties`) e o frontend mocka a camada HTTP.

### Backend

```bash
cd api
./mvnw test          # Linux / macOS / WSL
mvnw.cmd test        # Windows
```

Resultado esperado:

```
[ERROR] AuthControllerTests.deveRetornar409ComMensagemEmailJaCadastradoQuandoEmailJaExiste:71
        JSON path "$.message" expected:<E-mail já cadastrado> but was:<E-mail já está em uso>
[ERROR] Tests run: 6, Failures: 1, Errors: 0, Skipped: 0
[INFO] BUILD FAILURE
```

O `BUILD FAILURE` é esperado, porque o teste do bug falha.

Rodar só uma classe: `./mvnw test -Dtest=AuthControllerTests`

### Frontend

```bash
cd client
npm install
npm test
```

Resultado esperado:

```
FAIL tests/utils/password.test.ts
  ● Utils - Password › function isPasswordValid › [BUG] deve retornar true para senha forte com exatamente 8 caracteres
    Expected: true
    Received: false

Tests:       1 failed, 5 passed, 6 total
```

Rodar só um arquivo: `npx jest tests/utils/password.test.ts`

## Testes criados

### Backend (`api/src/test/java/com/demoapp/demo/`)

| Tipo | Arquivo | Teste | Requisito | Resultado |
|---|---|---|---|---|
| JUnit puro | `service/UserServiceTests.java` | Aceita senha forte (8+ caracteres, maiúscula, minúscula, número e especial) e rejeita quando falta um critério | 1 | ✅ passa |
| JUnit puro | `service/UserServiceTests.java` | Aceita e-mail com usuário, @ e domínio; rejeita sem @ ou nulo | 1 | ✅ passa |
| MockMvc | `controller/AuthControllerTests.java` | `POST /auth/signin` com senha incorreta → 401 + "Credenciais inválidas" | 2 | ✅ passa |
| MockMvc | `controller/AuthControllerTests.java` | **[BUG]** `POST /auth/signup` com e-mail existente → 409 + "E-mail já cadastrado" | 1 | ❌ **falha (bug)** |
| Mockito | `service/PostServiceTests.java` | Curtir post não curtido salva a reação e retorna `liked = true` | 5 | ✅ passa |
| Mockito | `service/PostServiceTests.java` | Curtir post já curtido remove a reação e retorna `liked = false` | 5 | ✅ passa |

- **JUnit puro:** instancia `new UserService(null)`, sem Spring, sem MockMvc e sem Mockito.
- **MockMvc:** `@SpringBootTest` + `@AutoConfigureMockMvc` com H2. O `@BeforeEach` limpa a tabela e cadastra um usuário.
- **Mockito:** `@ExtendWith(MockitoExtension.class)` com `UserPostReactionRepository` mockado e `ArgumentCaptor` para verificar a reação salva.

### Frontend (`client/tests/`)

| Tipo | Arquivo | Teste | Requisito | Resultado |
|---|---|---|---|---|
| Função pura | `utils/password.test.ts` | **[BUG]** `isPasswordValid("Abcdef1@")` (8 caracteres) deve ser `true` | 1 | ❌ **falha (bug)** |
| Função pura | `utils/password.test.ts` | `getPasswordValidationMessage` retorna a mensagem do critério específico que falta | 1 | ✅ passa |
| Componente | `components/PostCard.test.tsx` | Exibe título/corpo; logado, ao clicar em "Curtir" chama `onLike` e mostra "Curtido", ❤️ e fundo verde | 5 | ✅ passa |
| Componente | `components/Header.test.tsx` | Deslogado mostra "Entrar" e "Criar conta"; clicar no título leva para `/` | 4 | ✅ passa |
| Integração | `app/Home.test.tsx` | Home + Header + PostCard + AuthContext: exibe o feed da API e, deslogado, "Curtir" dispara o alert | 5 | ✅ passa |
| Integração | `app/SignIn.test.tsx` | SignIn + Input + Button + Header + AuthContext: login correto chama a API, Header passa a mostrar "Posts Curtidos"/"Sair" e redireciona para `/` | 2, 4 | ✅ passa |

- **Componentes:** renderizados isolados. No `Header`, o `useAuth` e o `useRouter` são mockados.
- **Integração:** só `src/service/api` (axios) é mockado, com o mesmo padrão dos testes originais do professor. Páginas, componentes, `AuthContext` e services rodam de verdade.

## Bugs capturados pelos testes

### Bug 1 (backend): mensagem errada para e-mail já cadastrado

- **Requisito 1:** "O sistema deve exibir a mensagem de erro **'E-mail já cadastrado'** caso o e-mail informado já exista."
- **Comportamento atual:** a API responde `409` com `"E-mail já está em uso"` (`AuthController.java`, método `signup`). O frontend exibe essa mensagem direto para o usuário.
- **Como foi encontrado:** a API foi executada e o mesmo cadastro foi enviado duas vezes:
  ```bash
  curl -H "Content-Type: application/json" -d '{"email":"murilo@teste.com","password":"Abcdef1!"}' http://localhost:8080/auth/signup
  # 2ª vez → {"message":"E-mail já está em uso","status":409}
  ```
- **Teste:** `AuthControllerTests.deveRetornar409ComMensagemEmailJaCadastradoQuandoEmailJaExiste`
- **Correção:** trocar a mensagem para `"E-mail já cadastrado"`. Com essa troca, os 6 testes do backend passam (verificado).

### Bug 2 (frontend): senha com exatamente 8 caracteres é rejeitada

- **Requisito 1:** "A senha deve atender aos seguintes critérios: **mínimo 8 caracteres** (...)"
- **Comportamento atual:** `client/src/utils/password.ts` usa `password.length <= 8`, que na prática exige 9 caracteres. Ao cadastrar com `Abcdef1@` (8 caracteres, maiúscula, minúscula, número e especial), a tela mostra *"A senha deve conter: mínimo de 8 caracteres"*.
- **Como foi encontrado:** a regra de validação do cadastro foi comparada com o requisito. Em `password.ts` aparece o `<= 8` (erro de limite, *off-by-one*) nas duas funções. A execução confirmou: `getPasswordValidationMessage("Abcdef1@")` retorna `"A senha deve conter: mínimo de 8 caracteres"`.
- **Como reproduzir na tela:** em `/signup`, preencha um e-mail válido e `Abcdef1@` nos dois campos de senha e clique em "Criar Conta". A mensagem de mínimo de 8 caracteres aparece.
- **Teste:** `tests/utils/password.test.ts` › `[BUG] deve retornar true para senha forte com exatamente 8 caracteres`
- **Correção:** trocar `<= 8` por `< 8` nas duas funções. Com essa troca, os 6 testes do frontend passam (verificado).

## Outros bugs encontrados (sem teste automatizado)

Estes desvios em relação aos requisitos também foram encontrados e podem ser usados na apresentação ou virar novos testes.

**Backend**

1. **Login com senha errada e "fraca" não retorna "Credenciais inválidas".** O `signin` valida a força da senha antes de conferir as credenciais. `{"email":"murilo@teste.com","password":"123"}` retorna `422 "Senha inválida"` em vez de `401 "Credenciais inválidas"` (requisito 2).
2. **E-mail inválido é aceito.** `UserService.isEmailValid` só verifica se existe `@`. O cadastro com `"a@"` retorna `200` e cria o usuário (requisito 1: "e-mail válido").
3. **Caracteres especiais limitados.** A regex do backend só aceita `@$!%*?&`. `Abcdef1#` é rejeitada com "Senha inválida", mas o frontend aceita.
4. **Cadastro sem senha dá erro 500.** `Pattern.matches` com `password = null` lança `NullPointerException`.
5. **A senha é devolvida no JSON** de `signup` e `signin` (`User` é serializado inteiro). É um problema de segurança, mesmo não estando nos requisitos.

**Frontend**

1. **`!` não é considerado caractere especial.** A regex de `password.ts` não inclui `!`. `Senha123!` é rejeitada com *"A senha deve conter: um caractere especial"*.
2. **Senha com `.` é rejeitada sem mensagem.** `isPasswordValid` não aceita `.`, mas `getPasswordValidationMessage` aceita. Com `Abcdefgh1.` o formulário não envia e nenhuma mensagem aparece (requisito 1: "mensagem relativa ao erro específico").
3. **Sessão perdida ao recarregar a página.** Em `src/lib/localStorage.ts`, `saveUser` grava na chave `"user"`, mas `getUser`/`removeUser` usam `"sqa_social_user"`. Depois de um F5 o usuário fica deslogado, e acessar `/auth/liked` pela URL redireciona para o login.
4. **Mensagem de sucesso da redefinição de senha diferente do requisito.** Aparece "Email enviado com sucesso para alterar a senha! Redirecionando..." em um bloco fixo na página, e não um toast com "E-mail enviado com sucesso" (requisito 3).
5. **Botão "Criar Conta" com C maiúsculo** no Header, enquanto o requisito 4 diz "Criar conta" (divergência pequena).

## Como rodar a aplicação (para demonstrar os bugs)

```bash
# 1. MySQL via Docker
docker run -d --name sqa-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=social_media -p 3306:3306 mysql:8.4

# 2. API (http://localhost:8080), sem precisar editar o application.properties
cd api
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:mysql://localhost:3306/social_media --spring.datasource.username=root --spring.datasource.password=root"

# 3. Frontend (http://localhost:3000), em outro terminal
cd client
echo "NEXT_PUBLIC_BASE_URL=http://localhost:8080" > .env
npm install
npm run dev
```

## Alterações fora dos testes

- `client/package-lock.json`: sincronizado com o `package.json`. O lock original fazia o `npm ci` falhar (`picomatch`).
- `api/mvnw`: marcado como executável para rodar `./mvnw` no Linux/macOS.
- Nenhum código da aplicação foi alterado. Os bugs continuam presentes de propósito.
