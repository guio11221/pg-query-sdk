# Repositories (ORM basico)

A classe `Repository<T>` ajuda a padronizar acesso a dados por entidade.

## Estrutura

```ts
import { Repository, QueryExecutor } from 'pg-query-sdk'

interface User {
  id: number
  name: string
  email: string
  active: boolean
}

class UserRepository extends Repository<User> {
  constructor(executor: QueryExecutor, dialect: any) {
    super('users', executor, dialect)
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.qb().where({ email }).first()
  }

  async findActives(): Promise<User[]> {
    return this.qb().where({ active: true }).orderBy('name', 'ASC').execute() as Promise<User[]>
  }

  async create(data: Omit<User, 'id'>): Promise<number> {
    return this.qb().insert(data).execute() as Promise<number>
  }
}
```

## Uso com `Database`

```ts
import { Database, PostgresDialect } from 'pg-query-sdk'

const db = new Database({
  connectionString: process.env.DATABASE_URL,
  dialect: new PostgresDialect(),
})

const userRepo = db.repository(UserRepository)
const user = await userRepo.findByEmail('ana@example.com')
```

## Observacoes
- `findById(id)` ja existe na classe base.
- Metodos `insert/update/delete` na base sao placeholders; implemente na classe concreta.
- `qb()` retorna QueryBuilder configurado para a tabela do repositorio.

Proximo: [SQL Raw](./usage-raw-queries.md)

