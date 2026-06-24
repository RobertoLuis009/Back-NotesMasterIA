# NotesMaster — Back-end

API REST do NotesMaster: gerencia usuários e notas com autenticação via Auth0 (JWT RS256). Construído com NestJS 11, Prisma 7 e PostgreSQL.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | NestJS 11 |
| Linguagem | TypeScript 5 |
| ORM | Prisma 7 |
| Banco de dados | PostgreSQL |
| Autenticação | Auth0 — JWT RS256 via `passport-jwt` + `jwks-rsa` |
| Documentação | Swagger (`@nestjs/swagger`) |
| Validação | `class-validator` + `class-transformer` |

---

## Pré-requisitos

- Node.js 22+
- PostgreSQL rodando e acessível
- Aplicação e API configuradas no Auth0

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/notesmaster

# Auth0
AUTH0_DOMAIN=seu-tenant.auth0.com
AUTH0_CLIENT_ID=        # audience da API registrada no Auth0

# CORS
FRONTEND_URL=http://localhost:3000

# Porta (opcional, default: 3001)
PORT=3001
```

---

## Como rodar

```bash
npm install

# Gerar o Prisma Client e aplicar migrations
npx prisma generate
npx prisma migrate dev

npm run start:dev     # http://localhost:3001/api
```

```bash
npm run build         # build de produção
npm run start:prod    # serve o build
npm run test          # testes unitários
npm run test:e2e      # testes e2e
npm run lint          # ESLint + Prettier
```

### Docker

```bash
docker build -t notesmaster-back .
docker run -p 3001:3001 --env-file .env notesmaster-back
```

---

## Endpoints

Todos os endpoints exigem `Authorization: Bearer <idToken>` (JWT emitido pelo Auth0).

### Usuários — `/api/users`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/users/me` | Retorna o usuário autenticado |
| `POST` | `/api/users/me` | Cria o usuário se não existir (upsert) |

> O front-end chama `POST /api/users/me` no login para sincronizar o usuário Auth0 com o banco local.

### Notas — `/api/notes`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/notes` | Cria uma nova nota |
| `PATCH` | `/api/notes/:id` | Atualiza título e/ou conteúdo da nota |

> Notas são sempre vinculadas ao `userId` do token — um usuário nunca acessa notas de outro.

### Documentação interativa

```
http://localhost:3001/api/docs
```

---

## Estrutura de arquivos

```
src/
  main.ts                      # Bootstrap: ValidationPipe, CORS, Swagger, porta
  app.module.ts                # Módulo raiz — importa todos os módulos

  auth/
    auth.module.ts             # Registra JwtStrategy no Passport
    jwt.strategy.ts            # Valida JWT via JWKS do Auth0 (RS256)
    jwt-auth.guard.ts          # Guard aplicado em todos os controllers

  users/
    users.module.ts
    users.controller.ts        # GET /users/me · POST /users/me
    users.service.ts           # findByAuth0Id · findOrCreate (idempotente)
    dto/
      user-response.dto.ts

  notes/
    notes.module.ts
    notes.controller.ts        # POST /notes · PATCH /notes/:id
    notes.service.ts           # create · update (verifica ownership)
    dto/
      create-note.dto.ts
      update-note.dto.ts
      note-response.dto.ts

  prisma/
    prisma.module.ts           # Módulo global do PrismaService
    prisma.service.ts          # Instância do PrismaClient

prisma/
  schema.prisma                # Modelos User e Note
```

---

## Modelo de dados

```prisma
model User {
  id        Int      @id @default(autoincrement())
  auth0Id   String   @unique
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  notes     Note[]
}

model Note {
  id         Int      @id @default(autoincrement())
  title      String
  content    String   @db.Text
  isFavorite Boolean  @default(false)
  userId     Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id])
}
```

---

## Fluxo de autenticação

1. Front-end envia `Authorization: Bearer <idToken>` em cada requisição
2. `JwtAuthGuard` intercepta e aciona o `JwtStrategy`
3. `JwtStrategy` busca a chave pública no JWKS do Auth0 (`/.well-known/jwks.json`) e valida o token RS256
4. O payload decodificado (`sub`, `email`, `name`) fica disponível em `req.user`
5. Controllers extraem o `sub` (Auth0 ID) e passam para os services

---

## Git Flow

| Branch | Propósito |
|---|---|
| `main` | Código de produção |
| `develop` | Integração de features |
| `feature/*` | Novas funcionalidades |
| `release/*` | Preparação de versão |
| `hotfix/*` | Correções urgentes em produção |

```bash
# Iniciar uma feature
git checkout -b feature/nome develop

# Finalizar
git checkout develop
git merge --no-ff feature/nome
git push origin develop
```
