# Query Builder

Este guia cobre os metodos do `QueryBuilder` retornado por `db.table(...)`.

```ts
import { Database, PostgresDialect } from 'pg-query-sdk'

const db = new Database({
  connectionString: process.env.DATABASE_URL,
  dialect: new PostgresDialect(),
})
```

## Indice
- [SELECT](#select)
- [Filtros WHERE](#filtros-where)
- [JOIN](#join)
- [Ordenacao e paginacao](#ordenacao-e-paginacao)
- [GROUP BY e HAVING](#group-by-e-having)
- [Agregacoes](#agregacoes)
- [DML: INSERT UPDATE DELETE](#dml-insert-update-delete)
- [DISTINCT UNION UNION ALL](#distinct-union-union-all)
- [CTE e subquery](#cte-e-subquery)
- [Inspecao de SQL](#inspecao-de-sql)
- [Execucao e first](#execucao-e-first)

## SELECT

### `select(fields)`

```ts
const rows = await db
  .table('users')
  .select(['id', 'name', 'email'])
  .execute()
```

Se `select` nao for chamado, o builder usa `SELECT *`.

```ts
const rows = await db.table('users').execute()
```

## Filtros WHERE

### `where({ campo: valor })`

```ts
await db.table('users').where({ active: true }).execute()
```

### Operadores

Suportados: `=`, `>`, `<`, `>=`, `<=`, `!=`, `<>`, `LIKE`, `ILIKE`, `IN`, `NOT IN`, `BETWEEN`, `EXISTS`.

```ts
await db
  .table('users')
  .where({ age: { op: '>=', value: 18 } })
  .execute()

await db
  .table('users')
  .where({ id: { op: 'IN', value: [1, 2, 3] } })
  .execute()

await db
  .table('orders')
  .where({ total: { op: 'BETWEEN', value: [100, 500] } })
  .execute()
```

### Nulos

```ts
await db.table('users').where({ deleted_at: null }).execute()
```

### `whereRaw(expression)`

```ts
await db
  .table('events')
  .whereRaw("created_at > NOW() - INTERVAL '7 days'")
  .execute()
```

Para deixar intencao explicita, voce tambem pode usar `unsafeWhereRaw(...)`.

### Grupos logicos

```ts
await db
  .table('users')
  .where({ active: true })
  .andGroup((g) => {
    g.where({ role: 'admin' }).orGroup((or) => {
      or.where({ age: { op: '>=', value: 18 } })
      or.where({ country: 'BR' })
    })
  })
  .execute()
```

## JOIN

### `join(table, localKey, foreignKey)`

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

### `leftJoin(...)` e `rightJoin(...)`

```ts
await db
  .table('users')
  .leftJoin('orders', 'users.id', 'orders.user_id')
  .execute()
```

## Ordenacao e paginacao

```ts
await db
  .table('users')
  .orderBy('created_at', 'DESC')
  .limit(20)
  .offset(40)
  .execute()
```

Para ordenacao raw:

```ts
await db.table('users').unsafeOrderByRaw('RANDOM()').execute()
```

## GROUP BY e HAVING

```ts
await db
  .table('orders')
  .select(['user_id'])
  .groupBy('user_id')
  .having({ 'COUNT(*)': { op: '>', value: 5 } })
  .execute()
```

Tambem existe `havingRaw(...)`.
Alias explicito: `unsafeHavingRaw(...)`.

## Agregacoes

Metodos: `count`, `sum`, `avg`, `min`, `max`.

```ts
const totalUsers = await db.table('users').count().execute()
const totalSales = await db.table('orders').sum('amount').execute()
const maxPrice = await db.table('products').max('price').execute()
```

Retorno: `number | null`.

## DML: INSERT UPDATE DELETE

### `insert(data)`

```ts
const inserted = await db
  .table('users')
  .insert({ name: 'Ana', email: 'ana@example.com' })
  .execute()

console.log(inserted) // rowCount
```

### `update(data)` + `where(...)`

```ts
const updated = await db
  .table('users')
  .where({ id: 10 })
  .update({ name: 'Ana Silva' })
  .execute()
```

### `delete()` + `where(...)`

```ts
const deleted = await db
  .table('users')
  .where({ id: 10 })
  .delete()
  .execute()
```

Atencao: `delete()` sem `where` remove todos os registros.
Atencao: `insert/update/delete` exigem tabela concreta (sem alias e sem subquery).

## DISTINCT UNION UNION ALL

```ts
await db.table('users').select(['city']).distinct().execute()
```

```ts
const active = db.table('users').select(['id']).where({ active: true })
const blocked = db.table('users').select(['id']).where({ blocked: true })

const ids = await active.union(blocked).execute()
```

## CTE e subquery

### `with(name, subQuery, recursive?)`

```ts
const managers = db.table('employees').where({ role: 'manager' })

const rows = await db
  .table('employees')
  .with('managers', managers)
  .join('managers', 'employees.manager_id', 'managers.id')
  .execute()
```

### `fromSubquery(sub, alias)`

```ts
const sub = db.table('orders').select(['user_id']).groupBy('user_id')

const rows = await db
  .table('users')
  .fromSubquery(sub, 'u_orders')
  .execute()
```

## Inspecao de SQL

### `build()`

```ts
const { query, params } = db
  .table('users')
  .where({ id: 1 })
  .build()

console.log(query)
console.log(params)
```

### `show()`

```ts
const sql = db.table('users').where({ id: 1 }).show()
```

## Execucao e first

### `execute()`
- `SELECT`: retorna `T[]`
- `INSERT/UPDATE/DELETE`: retorna `rowCount` (`number`)
- agregacao: retorna `number | null`

### `first()`

```ts
const user = await db.table('users').where({ id: 1 }).first()
```

Retorna `T | null`.

## Boas praticas
- Prefira `where(...)` com parametros ao inves de concatenar SQL.
- Use `show()` para depurar query gerada.
- Em operacoes criticas, rode dentro de `db.transaction(...)`.
- Use `unsafe*Raw` somente com SQL confiavel.

Proximo: [Transacoes](./usage-transactions.md)

