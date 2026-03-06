# Transacoes

Use `db.transaction(...)` para garantir atomicidade.

## Exemplo completo

```ts
import { Database, PostgresDialect } from 'pg-query-sdk'

const db = new Database({
  connectionString: process.env.DATABASE_URL,
  dialect: new PostgresDialect(),
})

async function transfer(fromId: number, toId: number, amount: number) {
  return db.transaction(async (trxDb) => {
    const debited = await trxDb
      .table('accounts')
      .where({ id: fromId })
      .update({ updated_at: new Date() })
      .execute()

    if (!debited) {
      throw new Error('Conta de origem nao encontrada')
    }

    await trxDb
      .table('account_entries')
      .insert({ account_id: fromId, type: 'debit', amount })
      .execute()

    const credited = await trxDb
      .table('accounts')
      .where({ id: toId })
      .update({ updated_at: new Date() })
      .execute()

    if (!credited) {
      throw new Error('Conta de destino nao encontrada')
    }

    await trxDb
      .table('account_entries')
      .insert({ account_id: toId, type: 'credit', amount })
      .execute()

    return { ok: true }
  })
}
```

## Regras importantes
- Use sempre `trxDb` dentro do callback.
- Se uma etapa falhar, lance erro para forcar rollback.
- Mantenha transacoes curtas.

## Comportamento
- sucesso: `COMMIT`
- erro: `ROLLBACK`
- conexao sempre devolvida ao pool

Proximo: [Repositories](./usage-orm.md)

