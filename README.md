# PG QUERY SDK (TypeScript)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Architecture: Hexagonal](https://img.shields.io/badge/Architecture-Hexagonal-green.svg)](#-arquitetura)

Uma biblioteca robusta e tipada para integração com banco de dados **PostgresSQL**. Construída sob os princípios da **Arquitetura Hexagonal**, garantindo que sua integração seja escalável, testável e fácil de manter.

**PostgreSQL** SDK com suporte a:

- **`Database`**: Ponto de entrada central para todas as operações.
- **`QueryBuilder`**: Construtor de queries SQL fluente.
- **`ConditionBuilder`**: Construtor de cláusulas `WHERE` complexas.
- **`QueryExecutor`**: Executor de queries baseado em Pool de conexões.
- **ORM Básico**: Com `Repository` para abstração de acesso a dados.
- **Transações**: Gerenciamento de transações ACID.
- Compatível com CommonJS e ESM.
- Dual build (CJS + ESM).

---

# 📦 Instalação

```bash
npm install pg-query-sdk
```

Ou localmente:

```bash
npm install .
```

---

# 🚀 Primeiros Passos

O ponto de entrada principal para interagir com o SDK é a classe `Database`. Ela gerencia a conexão, o dialeto SQL e fornece acesso a todas as funcionalidades.

## Inicializando o Database

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
  // Opcional: Você pode especificar um dialeto diferente se necessário
  // dialect: new MyCustomDialect(),
  // Opcional: TTL padrão para cache de queries (em segundos)
  // defaultCacheTTL: 300
});

// Agora 'db' está pronto para ser usado!
```

---

# 🛠 Funcionalidades Principais

## 1️⃣ QueryBuilder: Construindo Queries SQL

O `QueryBuilder` permite construir queries SQL de forma programática e segura. Ele é acessado através do método `table()` da sua instância `Database`.

Ele **não executa nada**, apenas retorna a string SQL e os parâmetros.

### Selecionando Dados

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function selectExample() {
  const { query, params } = db.table('users')
    .select(['id', 'name', 'email'])
    .where({ active: true })
    .limit(10)
    .offset(0)
    .orderBy('name', 'ASC')
    .build();

  console.log('SELECT Query:', query);
  // Ex: SELECT id, name, email FROM users WHERE active = $1 ORDER BY name ASC LIMIT 10 OFFSET 0
  console.log('SELECT Params:', params);
  // Ex: [true]

  // Para executar a query, você usaria o .execute() no final da cadeia
  const users = await db.table('users')
    .select(['id', 'name', 'email'])
    .where({ active: true })
    .limit(10)
    .offset(0)
    .orderBy('name', 'ASC')
    .execute(); // Executa a query e retorna os resultados

  console.log('Selected Users:', users);
}

selectExample();
```

### Inserindo Dados

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function insertExample() {
  const newUser = { name: 'Alice', email: 'alice@example.com', age: 30 };

  const { query, params } = db.table('users')
    .insert(newUser)
    .returning(['id', 'name']) // Retorna as colunas 'id' e 'name' do registro inserido
    .build();

  console.log('INSERT Query:', query);
  // Ex: INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING id, name
  console.log('INSERT Params:', params);
  // Ex: ['Alice', 'alice@example.com', 30]

  const insertedUser = await db.table('users')
    .insert(newUser)
    .returning(['id', 'name'])
    .execute();

  console.log('Inserted User:', insertedUser[0]); // Retorna um array, pegamos o primeiro elemento
}

insertExample();
```

### Atualizando Dados

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function updateExample() {
  const updatedData = { email: 'alice.smith@example.com', age: 31 };

  const { query, params } = db.table('users')
    .update(updatedData)
    .where({ id: 1 })
    .returning(['id', 'email', 'age'])
    .build();

  console.log('UPDATE Query:', query);
  // Ex: UPDATE users SET email = $1, age = $2 WHERE id = $3 RETURNING id, email, age
  console.log('UPDATE Params:', params);
  // Ex: ['alice.smith@example.com', 31, 1]

  const updatedUsers = await db.table('users')
    .update(updatedData)
    .where({ id: 1 })
    .returning(['id', 'email', 'age'])
    .execute();

  console.log('Updated User:', updatedUsers[0]);
}

updateExample();
```

### Deletando Dados

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function deleteExample() {
  const { query, params } = db.table('users')
    .delete()
    .where({ id: 1 })
    .returning(['id', 'name'])
    .build();

  console.log('DELETE Query:', query);
  // Ex: DELETE FROM users WHERE id = $1 RETURNING id, name
  console.log('DELETE Params:', params);
  // Ex: [1]

  const deletedUsers = await db.table('users')
    .delete()
    .where({ id: 1 })
    .returning(['id', 'name'])
    .execute();

  console.log('Deleted User:', deletedUsers[0]);
}

deleteExample();
```

## 2️⃣ ConditionBuilder: Cláusulas WHERE Avançadas

O `ConditionBuilder` é usado dentro do método `where()` do `QueryBuilder` para construir condições complexas, incluindo operadores, `NULL` checks, expressões raw e agrupamentos `AND`/`OR`.

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function complexWhereExample() {
  const products = await db.table('products')
    .select(['name', 'price', 'stock', 'category'])
    .where(conditions => {
      conditions
        .where({ category: 'electronics' }) // category = 'electronics'
        .andGroup(group1 => { // AND (...)
          group1
            .where({ stock: { op: '>', value: 0 } }) // stock > 0
            .orGroup(group2 => { // OR (...)
              group2
                .where({ price: { op: '<', value: 100 } }) // price < 100
                .raw('created_at > NOW() - INTERVAL \'1 year\''); // created_at > ...
            });
        })
        .where({ manufacturer: null }); // manufacturer IS NULL
    })
    .execute();

  console.log('Complex WHERE Products:', products);
  // A query gerada seria algo como:
  // SELECT name, price, stock, category FROM products
  // WHERE category = $1 AND (stock > $2 OR (price < $3 AND created_at > NOW() - INTERVAL '1 year')) AND manufacturer IS NULL
}

complexWhereExample();
```

## 3️⃣ QueryExecutor: Execução Direta de Queries

Embora o `QueryBuilder` seja preferível para a maioria dos casos, você pode usar o `QueryExecutor` diretamente para queries SQL customizadas ou procedimentos armazenados. A instância do `QueryExecutor` é gerenciada internamente pelo `Database`.

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function directExecuteExample() {
  const result = await db.executor.execute(
    'SELECT version(), NOW() as current_time',
    []
  );
  console.log('Direct Execution Result:', result.rows);

  const specificUser = await db.executor.execute(
    'SELECT * FROM users WHERE id = $1',
    [1]
  );
  console.log('Specific User (Direct):', specificUser.rows[0]);
}

directExecuteExample();
```

## 4️⃣ Transações ACID

O SDK oferece um gerenciador de transações robusto para garantir a atomicidade das suas operações de banco de dados.

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function transactionExample() {
  try {
    const result = await db.transaction(async trxDb => {
      // Dentro desta callback, 'trxDb' é uma instância de Database
      // que está vinculada à transação atual.
      // Todas as operações feitas com 'trxDb' farão parte da mesma transação.

      // 1. Inserir um novo pedido
      const newOrder = await trxDb.table('orders')
        .insert({ customer_id: 1, amount: 150.00, status: 'pending' })
        .returning(['id'])
        .execute();
      const orderId = newOrder[0].id;
      console.log('Order inserted with ID:', orderId);

      // 2. Atualizar o saldo do cliente (exemplo hipotético)
      // Se esta operação falhar, a inserção do pedido também será revertida.
      await trxDb.table('customers')
        .update({ balance: { op: '-', value: 150.00 } }) // Decrementa o saldo
        .where({ id: 1 })
        .execute();
      console.log('Customer balance updated.');

      // Se tudo ocorrer bem, a transação será commitada automaticamente.
      return `Transaction successful for order ${orderId}`;
    });

    console.log(result);
  } catch (error) {
    console.error('Transaction failed:', error);
    // Se uma exceção for lançada, a transação será automaticamente revertida (rollback).
  }
}

transactionExample();
```

## 5️⃣ ORM Básico com Repositórios

O SDK fornece uma base para construir um ORM simples usando a classe `Repository`. Isso ajuda a organizar o código de acesso a dados por entidade.

### Definindo um Repositório

```typescript
import { Repository, QueryExecutor, Dialect } from 'pg-query-sdk';

// 1. Defina a interface para sua entidade
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  active: boolean;
}

// 2. Crie sua classe de repositório estendendo Repository<T>
class UserRepository extends Repository<User> {
  constructor(executor: QueryExecutor, dialect: Dialect) {
    // O construtor base requer o nome da tabela, o executor e o dialeto
    super('users', executor, dialect);
  }

  // Exemplo de método customizado para o repositório de usuários
  async findActiveUsers(): Promise<User[]> {
    return this.qb() // 'this.qb()' retorna um QueryBuilder pré-configurado para a tabela 'users'
      .where({ active: true })
      .execute();
  }

  async findUsersByAgeRange(minAge: number, maxAge: number): Promise<User[]> {
    return this.qb()
      .where(conditions => {
        conditions
          .where({ age: { op: '>=', value: minAge } })
          .where({ age: { op: '<=', value: maxAge } });
      })
      .execute();
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const result = await this.qb()
      .insert(data)
      .returning(['id', 'name', 'email', 'age', 'active'])
      .execute();
    return result[0];
  }
}
```

### Usando o Repositório

```typescript
import Database from 'pg-query-sdk';
// Importe seu UserRepository definido acima
import { UserRepository } from './path/to/UserRepository'; // Ajuste o caminho

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function repositoryExample() {
  // Obtenha uma instância do seu repositório através do método .repository() do Database
  const userRepository = db.repository(UserRepository);

  // Usando métodos do repositório
  const userById = await userRepository.findById(1);
  console.log('User by ID:', userById);

  const activeUsers = await userRepository.findActiveUsers();
  console.log('Active Users:', activeUsers);

  const usersInAgeRange = await userRepository.findUsersByAgeRange(25, 35);
  console.log('Users in age range 25-35:', usersInAgeRange);

  const newUser = await userRepository.createUser({
    name: 'Bob',
    email: 'bob@example.com',
    age: 28,
    active: true
  });
  console.log('Created new user:', newUser);
}

repositoryExample();
```

### EntityManager (Planejado)

O `EntityManager` é um componente planejado para gerenciar múltiplos repositórios e unidades de trabalho, oferecendo uma interface centralizada para operações de persistência mais complexas. Atualmente, esta classe está vazia e será desenvolvida em futuras iterações.

---

# ⚙️ Dual Module Support

O pacote suporta tanto CommonJS quanto ES Modules, permitindo flexibilidade na sua configuração de projeto.

## CommonJS

```javascript
const Database = require('pg-query-sdk').default; // Note o .default para a exportação padrão

const db = new Database({ /* ... */ });
```

## ESM

```typescript
import Database from 'pg-query-sdk';

const db = new Database({ /* ... */ });
```

Isso funciona graças ao campo `exports` no `package.json`:

```json
{
  "exports": {
    ".": {
      "require": "./dist/cjs/index.js",
      "import": "./dist/esm/index.js"
    }
  }
}
```

---

# 🧱 Estrutura do Projeto

```
pg-query-sdk/
  src/
    core/
      Database.ts           # Ponto de entrada principal
      ParamContext.ts       # Gerencia parâmetros para queries seguras
      QueryExecutor.ts      # Executa queries no PostgreSQL
      TransactionManager.ts # Gerencia transações
    builders/
      ConditionBuilder.ts   # Constrói cláusulas WHERE
      QueryBuilder.ts       # Constrói queries SQL (SELECT, INSERT, UPDATE, DELETE)
    orm/
      EntityManager.ts      # (Planejado) Gerenciador de entidades
      Repository.ts         # Classe base para repositórios ORM
    dialects/
      Dialect.ts            # Interface para dialetos SQL
      PostgresDialect.ts    # Implementação do dialeto PostgreSQL
    index.ts                # Exportações principais do SDK
  test/                     # Testes unitários e de integração
  dist/                     # Saída da compilação (CJS e ESM)
```

---

# 📌 Responsabilidades das Camadas

| Camada             | Responsabilidade                                         |
|--------------------|----------------------------------------------------------|
| `Database`         | Ponto de entrada, gerencia conexão, dialeto, transações e acesso a builders/repositórios. |
| `QueryBuilder`     | Construção fluente de queries SQL (SELECT, INSERT, UPDATE, DELETE). |
| `ConditionBuilder` | Construção de cláusulas `WHERE` complexas e aninhadas.   |
| `QueryExecutor`    | Execução de queries no PostgreSQL e gerenciamento do pool de conexões. |
| `Repository`       | Abstração de acesso a dados para uma entidade específica (CRUD básico e métodos customizados). |
| `TransactionManager`| Gerenciamento de transações ACID.                        |
| `EntityManager`    | (Planejado) Gerenciamento de múltiplos repositórios e unidade de trabalho. |
| `pg` (driver)      | Comunicação de baixo nível com o banco de dados PostgreSQL. |

---

# 🔐 Segurança

- **Parâmetros Preparados**: Todas as queries construídas pelo `QueryBuilder` e `ConditionBuilder` utilizam parâmetros preparados, prevenindo ataques de SQL Injection.
- **Pool de Conexões**: O `QueryExecutor` gerencia um pool de conexões, otimizando o uso de recursos e garantindo que as conexões sejam reutilizadas de forma eficiente.
- **Liberação de Conexões**: As conexões são sempre liberadas de volta ao pool no bloco `finally` após a execução da query ou transação, evitando vazamentos de conexão.

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
