# Seguranca

## 1. Queries parametrizadas

O SDK parametriza valores automaticamente no Query Builder.

```ts
await db.table('users').where({ email: 'ana@example.com' }).execute()
```

Em SQL raw, sempre passe parametros no segundo argumento de `execute`.

```ts
await executor.execute('SELECT * FROM users WHERE email = $1', ['ana@example.com'])
```

## 2. Guard rails para raw SQL

Metodos raw do QueryBuilder agora bloqueiam tokens perigosos obvios (`;`, `--`, `/*`, `*/`).
Use:
- `unsafeWhereRaw(...)`
- `unsafeHavingRaw(...)`
- `unsafeOrderByRaw(...)`
- `unsafeJoinRaw(...)`

Somente com SQL confiavel.

## 3. Evite SQL dinamico com input direto

Nao faca:

```ts
await executor.execute(`SELECT * FROM users WHERE email = '${email}'`)
```

## 4. Credenciais
- guarde `DATABASE_URL` em variaveis de ambiente
- nao versione secrets
- use usuario de banco com privilegios minimos

## 5. Transacoes para consistencia
Use `db.transaction(...)` para operacoes multi-etapa.

## 6. Tratamento de erro
- logue erro tecnico no servidor
- nao exponha mensagem SQL detalhada para cliente final

## 7. Pool e recursos
`QueryExecutor` gerencia pool quando instanciado com config.
Feche com `executor.close()` em scripts/rotinas de vida curta.

## 8. Timeout e observabilidade

No `Database`, configure:
- `defaultQueryTimeoutMs`
- `redactQueryParams`
- `queryLogger`

Proximo: [API Reference](./api-reference.md)

