# Introducao

O `pg-query-sdk` e uma biblioteca TypeScript/Node.js para acesso a dados em PostgreSQL com foco em:
- API fluente
- seguranca por queries parametrizadas
- separacao clara entre construcao de query e execucao

## Componentes
- `Database`: ponto de entrada para builders, transacoes e repositorios
- `QueryBuilder`: construcao de SQL com encadeamento
- `ConditionBuilder`: regras de `WHERE` e `HAVING`
- `QueryExecutor`: execucao de SQL raw
- `TransactionManager`: controle transacional
- `Repository<T>`: base para camada de dados

## Fluxo recomendado
1. Inicialize `Database` com `connectionString`.
2. Use `db.table('minha_tabela')` para montar queries.
3. Use `db.transaction(...)` quando operacoes precisarem ser atomicas.
4. Encapsule regras de acesso em repositories.

## Exemplo minimo

```ts
import { Database, PostgresDialect } from 'pg-query-sdk'

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/app_db',
  dialect: new PostgresDialect(),
})

const row = await db.table('users').where({ id: 1 }).first()
console.log(row)
```

Proximo: [Instalacao](./installation.md)

