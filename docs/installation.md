# Instalacao

## Requisitos
- Node.js `>=18`
- PostgreSQL em execucao

## Pacotes

```bash
npm install pg-query-sdk pg
```

`pg-query-sdk` usa `pg` como peer dependency.

## Configuracao inicial

```ts
import { Database, PostgresDialect } from 'pg-query-sdk'

const db = new Database({
  connectionString: process.env.DATABASE_URL,
  dialect: new PostgresDialect(),
  defaultQueryTimeoutMs: 5000,
  redactQueryParams: true,
  queryLogger: {
    onQueryError(meta) {
      console.error('DB error', meta.query, meta.durationMs)
    }
  }
})
```

## CommonJS

```js
const { Database, PostgresDialect } = require('pg-query-sdk')

const db = new Database({
  connectionString: process.env.DATABASE_URL,
  dialect: new PostgresDialect(),
})
```

## Verificacao rapida

```ts
const rows = await db.table('users').limit(1).execute()
console.log(rows)
await db.close()
```

## Erros comuns
- `Error: connect ECONNREFUSED`: PostgreSQL nao esta acessivel.
- `password authentication failed`: credenciais incorretas.
- `database does not exist`: nome do banco incorreto na URL.

Proximo: [Query Builder](./usage-query-builder.md)

