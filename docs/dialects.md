# Dialetos

O SDK usa um contrato de dialeto para placeholders e quoting de identificadores.

## PostgresDialect

`PostgresDialect` e o dialeto publico do pacote.

```ts
import { PostgresDialect } from 'pg-query-sdk'

const d = new PostgresDialect()
console.log(d.placeholder(1))       // $1
console.log(d.wrapIdentifier('id')) // "id"
```

## Definindo no Database

```ts
import { Database, PostgresDialect } from 'pg-query-sdk'

const db = new Database({
  connectionString: process.env.DATABASE_URL,
  dialect: new PostgresDialect(),
})
```

## Dialeto customizado

O `Database` aceita qualquer objeto que implemente:
- `placeholder(index: number): string`
- `wrapIdentifier(identifier: string): string`

Exemplo:

```ts
const customDialect = {
  placeholder(index: number) {
    return `$${index}`
  },
  wrapIdentifier(identifier: string) {
    return `"${identifier}"`
  },
}
```

Use apenas se voce souber exatamente a sintaxe do banco alvo.

Proximo: [Seguranca](./security.md)

