# PG Query SDK

SDK para PostgreSQL com Query Builder fluente, transacoes e camada de repositorio.

## Indice
- [Visao Geral](./docs/introduction.md)
- [Instalacao](./docs/installation.md)
- [Query Builder](./docs/usage-query-builder.md)
- [Transacoes](./docs/usage-transactions.md)
- [Repositories (ORM basico)](./docs/usage-orm.md)
- [SQL Raw](./docs/usage-raw-queries.md)
- [Dialetos](./docs/dialects.md)
- [Seguranca](./docs/security.md)
- [API Reference](./docs/api-reference.md)
- [Contribuicao](./docs/contributing.md)

## Instalacao rapida

```bash
npm install pg-query-sdk pg
```

## Quick Start

```ts
import { Database, PostgresDialect } from 'pg-query-sdk'

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/app_db',
  dialect: new PostgresDialect(),
})

async function main() {
  const users = await db
    .table('users')
    .select(['id', 'name'])
    .where({ active: true })
    .orderBy('name', 'ASC')
    .limit(10)
    .execute()

  console.log(users)
}

main().catch(console.error)
```

## Principais recursos
- Query Builder para `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- Filtros com operadores (`=`, `>`, `<`, `IN`, `BETWEEN`, `ILIKE`, etc.)
- `JOIN`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT`, `OFFSET`
- `DISTINCT`, `UNION`, `UNION ALL`
- CTEs com `.with(...)`
- Transacoes com `db.transaction(...)`
- Repositorios com `Repository<T>`
- Hardening basico contra tokens SQL perigosos em metodos raw
- Logger de queries e timeout padrao por query

## Exemplo de JOIN com alias

```ts
const rows = await db
  .table('"Instance" ins')
  .join('"Contact" con', 'con."instanceId"', 'ins.id')
  .execute()
```

SQL gerado:

```sql
SELECT * FROM "Instance" "ins" INNER JOIN "Contact" "con" ON "con"."instanceId" = "ins"."id"
```

## Mudancas de uso importantes
- `db.close()` agora esta disponivel para encerrar pool explicitamente.
- `whereRaw/havingRaw` continuam disponiveis, e tambem existem aliases explicitos:
  - `unsafeWhereRaw(...)`
  - `unsafeHavingRaw(...)`
  - `unsafeOrderByRaw(...)`
  - `unsafeJoinRaw(...)`
- Identificadores agora sao normalizados com quoting seguro em mais pontos (`select`, `join`, `orderBy`, `groupBy`, filtros por objeto).
- Operacoes `insert/update/delete` nao aceitam tabela com alias/subquery.

## Compatibilidade
- Node.js `>=18`
- Driver `pg` como peer dependency

## Licenca
MIT

