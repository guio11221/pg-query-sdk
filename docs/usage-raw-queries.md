# SQL Raw

Quando o builder nao atender um caso especifico, use `QueryExecutor`.

## Execucao direta

```ts
import { QueryExecutor } from 'pg-query-sdk'

const executor = new QueryExecutor({
  connectionString: process.env.DATABASE_URL,
})

try {
  const result = await executor.execute(
    'SELECT id, name FROM users WHERE id = $1',
    [1]
  )

  console.log(result.rows)
} finally {
  await executor.close()
}
```

## INSERT com RETURNING

```ts
const result = await executor.execute(
  'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
  ['Ana', 'ana@example.com']
)

console.log(result.rows[0].id)
```

## Parametros e seguranca

Nunca concatene entrada do usuario na string SQL.

Errado:

```ts
const name = "ana' OR 1=1 --"
await executor.execute(`SELECT * FROM users WHERE name = '${name}'`)
```

Correto:

```ts
const name = "ana' OR 1=1 --"
await executor.execute('SELECT * FROM users WHERE name = $1', [name])
```

## Quando usar SQL Raw
- query muito especifica
- uso intensivo de funcoes SQL nativas
- tuning fino de performance

## Raw no QueryBuilder

Quando estiver no builder e precisar de fragmento raw:

```ts
await db
  .table('users')
  .unsafeWhereRaw('created_at > NOW() - INTERVAL \'30 days\'')
  .unsafeOrderByRaw('RANDOM()')
  .execute()
```

Proximo: [Dialetos](./dialects.md)

