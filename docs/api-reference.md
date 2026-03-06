# API Reference

Referencia resumida da API publica.

## Exports

```ts
import {
  Database,
  QueryExecutor,
  TransactionManager,
  PostgresDialect,
  MysqlDialect,
  Repository,
} from 'pg-query-sdk'
```

## Database

Construtor:

```ts
new Database({
  connectionString,
  dialect?,
  defaultCacheTTL?,
  defaultQueryTimeoutMs?,
  redactQueryParams?,
  queryLogger?,
  ...PoolConfig
})
```

Metodos:
- `table<T = any>(name: string): QueryBuilder<T>`
- `transaction<T>(callback: (trxDb: Database) => Promise<T>): Promise<T>`
- `repository<R>(RepoClass: new (executor, dialect) => R): R`
- `close(): Promise<void>`

## QueryBuilder<T>

`QueryBuilder` e obtido principalmente via `db.table('nome_tabela')`.

Construcao:
- `select(fields)`
- `join(table, localKey, foreignKey)`
- `leftJoin(table, localKey, foreignKey)`
- `rightJoin(table, localKey, foreignKey)`
- `where(obj)`
- `whereRaw(expression)`
- `andGroup(cb)`
- `orGroup(cb)`
- `groupBy(fields)`
- `having(obj)`
- `havingRaw(expression)`
- `unsafeWhereRaw(expression)`
- `unsafeHavingRaw(expression)`
- `unsafeOrderByRaw(expression)`
- `unsafeJoinRaw(joinClause)`
- `orderBy(column, direction?)`
- `limit(value)`
- `offset(value)`
- `with(name, subQuery, recursive?)`
- `fromSubquery(sub, alias)`
- `distinct()`
- `union(queryBuilder)`
- `unionAll(queryBuilder)`

DML/agregacao:
- `insert(data)`
- `update(data)`
- `delete()`
- `count(column?)`
- `sum(column)`
- `avg(column)`
- `min(column)`
- `max(column)`

Execucao/inspecao:
- `build(): { query: string; params: any[] }`
- `show(): string`
- `execute(): Promise<T[] | number | null>`
- `first(): Promise<T | null>`
- `clone(): QueryBuilder<T>`

## ConditionBuilder
- `where(obj | fn)`
- `raw(expression)`
- `andGroup(cb)`
- `orGroup(cb)`
- `build(prefix?)`
- `clone()`

## QueryExecutor

Construtor:

```ts
new QueryExecutor(poolConfig?)
new QueryExecutor(undefined, poolClient)
```

Metodos:
- `execute(query: string, params?: readonly any[], cacheTTL?: number)`
- `getPool()`
- `getClient()`
- `close()`

## Repository<T>
- `qb()`
- `findById(id: number)`
- `insert(data)` (placeholder para implementar)
- `update(data)` (placeholder para implementar)
- `delete(data)` (placeholder para implementar)

## PostgresDialect
- `placeholder(index: number): string`
- `wrapIdentifier(id: string): string`

## MysqlDialect
- `placeholder(index: number): string`
- `wrapIdentifier(id: string): string`

Proximo: [Contribuicao](./contributing.md)

