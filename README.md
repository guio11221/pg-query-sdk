# PG QUERY SDK (TypeScript)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Architecture: Hexagonal](https://img.shields.io/badge/Architecture-Hexagonal-green.svg)](#-arquitetura)

Uma biblioteca robusta e tipada para integração com banco de dados **PostgresSQL**. Construída sob os princípios da **Arquitetura Hexagonal**, garantindo que sua integração seja escalável, testável e fácil de manter.

**PostgreSQL** SDK com suporte a:

-   **`Database`**: Ponto de entrada central para todas as operações.
-   **`QueryBuilder`**: Construtor de queries SQL fluente para **SELECT**.
-   **`ConditionBuilder`**: Construtor de cláusulas `WHERE` e `HAVING` complexas.
-   **`QueryExecutor`**: Executor de queries baseado em Pool de conexões.
-   **ORM Básico**: Com `Repository` para abstração de acesso a dados (atualmente apenas `findById` implementado na base).
-   **Transações**: Gerenciamento de transações ACID.
-   Compatível com CommonJS e ESM.
-   Dual build (CJS + ESM).

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
  // Opcional: TTL padrão para cache de queries (em segundos). Use 0 para desativar.
  // defaultCacheTTL: 300
});

// Agora 'db' está pronto para ser usado!
```

---

# 🛠 Funcionalidades Principais

## 1️⃣ QueryBuilder: Construindo Queries SQL (SELECT)

O `QueryBuilder` permite construir queries SQL de forma programática e segura, **focando em operações de seleção de dados**. Ele é acessado através do método `table()` da sua instância `Database`.

Ele **não executa nada**, apenas retorna a string SQL e os parâmetros. Para executar a query, você deve encadear `.execute()` no final.

### Selecionando Dados

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function selectExample() {
  // Construindo a query
  const { query, params } = db.table('users')
    .select(['id', 'name', 'email'])
    .where({ active: true })
    .limit(10)
    .offset(0)
    .orderBy('name', 'ASC')
    .build(); // Apenas constrói a query, não executa

  console.log('SELECT Query:', query);
  // Ex: SELECT id, name, email FROM users WHERE active = $1 ORDER BY name ASC LIMIT 10 OFFSET 0
  console.log('SELECT Params:', params);
  // Ex: [true]

  // Executando a query
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

### Joins

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function joinExample() {
  const usersWithOrders = await db.table('users')
    .select(['users.name', 'orders.amount', 'orders.status'])
    .join('orders', 'users.id', 'orders.user_id') // INNER JOIN
    .where({ 'orders.status': 'completed' })
    .execute();

  console.log('Users with completed orders:', usersWithOrders);

  const usersAndTheirOrders = await db.table('users')
    .select(['users.name', 'orders.amount', 'orders.status'])
    .leftJoin('orders', 'users.id', 'orders.user_id') // LEFT JOIN
    .orderBy('users.name', 'ASC')
    .execute();

  console.log('Users and all their orders (if any):', usersAndTheirOrders);
}

joinExample();
```

### Group By e Having

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function groupByHavingExample() {
  const categorySales = await db.table('products')
    .select(['category', 'COUNT(id) as total_products', 'SUM(price) as total_value'])
    .groupBy('category')
    .having({ 'SUM(price)': { op: '>', value: 1000 } }) // HAVING SUM(price) > 1000
    .orderBy('total_value', 'DESC')
    .execute();

  console.log('Category sales over 1000:', categorySales);
}

groupByHavingExample();
```

### Common Table Expressions (CTEs)

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function cteExample() {
  // Subquery para usuários ativos
  const activeUsersSubquery = db.table('users')
    .select(['id', 'name'])
    .where({ active: true });

  // Query principal usando a CTE
  const result = await db.table('active_users') // Referencia a CTE pelo nome
    .with('active_users', activeUsersSubquery) // Define a CTE
    .select(['name'])
    .orderBy('name', 'ASC')
    .execute();

  console.log('Users from CTE:', result);
}

cteExample();
```

### Subqueries na Cláusula FROM

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function fromSubqueryExample() {
  // Subquery para obter o total de pedidos por usuário
  const userOrderCounts = db.table('orders')
    .select(['user_id', 'COUNT(id) as order_count'])
    .groupBy('user_id');

  // Query principal usando a subquery como tabela
  const usersWithOrderCounts = await db.table('users')
    .select(['users.name', 'uoc.order_count'])
    .fromSubquery(userOrderCounts, 'uoc') // Usa a subquery 'userOrderCounts' como 'uoc'
    .join('users', 'users.id', 'uoc.user_id') // JOIN com a tabela original de usuários
    .where({ 'uoc.order_count': { op: '>', value: 5 } })
    .execute();

  console.log('Users with more than 5 orders:', usersWithOrderCounts);
}

fromSubqueryExample();
```

## 2️⃣ ConditionBuilder: Cláusulas WHERE e HAVING Avançadas

O `ConditionBuilder` é usado dentro dos métodos `where()` e `having()` do `QueryBuilder` para construir condições complexas, incluindo operadores, `NULL` checks, expressões raw e agrupamentos `AND`/`OR`.

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
        .where({ category: 'electronics' }) // category = $1
        .andGroup(group1 => { // AND (...)
          group1
            .where({ stock: { op: '>', value: 0 } }) // stock > $2
            .orGroup(group2 => { // OR (...)
              group2
                .where({ price: { op: '<', value: 100 } }) // price < $3
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

O `QueryExecutor` é a camada responsável por interagir diretamente com o driver `pg` para executar queries. Embora o `QueryBuilder` seja preferível para a maioria dos casos, você pode acessar o `QueryExecutor` diretamente através da instância `Database` para queries SQL customizadas, procedimentos armazenados ou comandos DDL.

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function directExecuteExample() {
  // Executando uma query simples
  const result = await db.executor.execute(
    'SELECT version(), NOW() as current_time',
    []
  );
  console.log('Direct Execution Result:', result.rows);

  // Executando uma query com parâmetros
  const specificUser = await db.executor.execute(
    'SELECT * FROM users WHERE id = $1',
    [1]
  );
  console.log('Specific User (Direct):', specificUser.rows[0]);

  // Exemplo de DDL (Data Definition Language) - CUIDADO ao usar em produção!
  // await db.executor.execute('CREATE TABLE IF NOT EXISTS temp_table (id SERIAL PRIMARY KEY, name VARCHAR(255))', []);
  // console.log('temp_table created (if not exists).');
}

directExecuteExample();
```

## 4️⃣ Transações ACID

O SDK oferece um gerenciador de transações robusto para garantir a atomicidade (ACID) das suas operações de banco de dados. Se qualquer operação dentro da transação falhar, todas as alterações serão revertidas (rollback).

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

      // Exemplo: Transferir fundos entre contas
      const senderId = 1;
      const receiverId = 2;
      const amount = 100.00;

      // 1. Decrementar saldo do remetente
      // Nota: Para INSERT/UPDATE/DELETE, você precisará usar db.executor.execute() diretamente
      // ou implementar esses métodos em um repositório customizado.
      await trxDb.executor.execute(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING id, balance',
        [amount, senderId]
      );
      console.log(`Decremented balance for account ${senderId}`);

      // Simular uma falha para testar o rollback
      // if (true) throw new Error('Simulated failure');

      // 2. Incrementar saldo do destinatário
      await trxDb.executor.execute(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2 RETURNING id, balance',
        [amount, receiverId]
      );
      console.log(`Incremented balance for account ${receiverId}`);

      // Se tudo ocorrer bem, a transação será commitada automaticamente.
      return `Transaction successful: ${amount} transferred from ${senderId} to ${receiverId}`;
    });

    console.log(result);
  } catch (error) {
    console.error('Transaction failed:', error.message);
    // Se uma exceção for lançada, a transação será automaticamente revertida (rollback).
  }
}

transactionExample();
```

## 5️⃣ ORM Básico com Repositórios

O SDK fornece uma base para construir um ORM simples usando a classe `Repository`. Isso ajuda a organizar o código de acesso a dados por entidade.

### Definindo um Repositório Customizado

A classe base `Repository<T>` oferece um método `findById` e um `qb()` que retorna um `QueryBuilder` pré-configurado para a tabela. Para operações de `INSERT`, `UPDATE` e `DELETE`, você precisará implementá-las em seus repositórios customizados, utilizando o `QueryExecutor` ou o `QueryBuilder` (para `SELECT` após a operação).

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

  // Método implementado na classe base
  // async findById(id: number): Promise<User | null> { ... }

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

  // Exemplo de implementação de INSERT em um repositório customizado
  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const { query, params } = this.dialect.createInsertQuery(this.table, data as Record<string, any>, ['id', 'name', 'email', 'age', 'active']);
    const result = await this.executor.execute(query, params);
    return result.rows[0];
  }

  // Exemplo de implementação de UPDATE em um repositório customizado
  async updateUser(id: number, data: Partial<User>): Promise<User | null> {
    const { query, params } = this.dialect.createUpdateQuery(this.table, data as Record<string, any>, { id }, ['id', 'name', 'email', 'age', 'active']);
    const result = await this.executor.execute(query, params);
    return result.rows[0] || null;
  }

  // Exemplo de implementação de DELETE em um repositório customizado
  async deleteUser(id: number): Promise<boolean> {
    const { query, params } = this.dialect.createDeleteQuery(this.table, { id });
    const result = await this.executor.execute(query, params);
    return result.rowCount > 0;
  }
}
```

### Usando o Repositório Customizado

```typescript
import Database from 'pg-query-sdk';
// Importe seu UserRepository definido acima
import { UserRepository } from './path/to/UserRepository'; // Ajuste o caminho conforme necessário

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function repositoryExample() {
  // Obtenha uma instância do seu repositório através do método .repository() do Database
  const userRepository = db.repository(UserRepository);

  // Usando métodos do repositório base
  const userById = await userRepository.findById(1);
  console.log('User by ID:', userById);

  // Usando métodos customizados
  const activeUsers = await userRepository.findActiveUsers();
  console.log('Active Users:', activeUsers);

  const usersInAgeRange = await userRepository.findUsersByAgeRange(25, 35);
  console.log('Users in age range 25-35:', usersInAgeRange);

  // Criando um novo usuário
  const newUser = await userRepository.createUser({
    name: 'Charlie',
    email: 'charlie@example.com',
    age: 29,
    active: true
  });
  console.log('Created new user:', newUser);

  // Atualizando um usuário
  const updatedUser = await userRepository.updateUser(newUser.id, { age: 30, active: false });
  console.log('Updated user:', updatedUser);

  // Deletando um usuário
  const deleted = await userRepository.deleteUser(newUser.id);
  console.log(`User ${newUser.id} deleted: ${deleted}`);
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
      ConditionBuilder.ts   # Constrói cláusulas WHERE e HAVING
      QueryBuilder.ts       # Constrói queries SQL (apenas SELECT)
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

| Camada             | Responsabilidade                                                                                             |
|--------------------|--------------------------------------------------------------------------------------------------------------|
| `Database`         | Ponto de entrada, gerencia conexão, dialeto, transações e acesso a builders/repositórios.                    |
| `QueryBuilder`     | Construção fluente de queries SQL **apenas para seleção de dados** (SELECT, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, OFFSET, CTEs, Subqueries). |
| `ConditionBuilder` | Construção de cláusulas `WHERE` e `HAVING` complexas e aninhadas.                                            |
| `QueryExecutor`    | Execução de queries no PostgreSQL e gerenciamento do pool de conexões.                                       |
| `Repository`       | Abstração de acesso a dados para uma entidade específica. A classe base implementa `findById`. Métodos como `insert`, `update`, `delete` devem ser implementados nos repositórios customizados. |
| `TransactionManager`| Gerenciamento de transações ACID.                                                                            |
| `EntityManager`    | (Planejado) Gerenciamento de múltiplos repositórios e unidade de trabalho.                                   |
| `pg` (driver)      | Comunicação de baixo nível com o banco de dados PostgreSQL.                                                  |

---

# 🔐 Segurança

-   **Parâmetros Preparados**: Todas as queries construídas pelo `QueryBuilder` e `ConditionBuilder` utilizam parâmetros preparados, prevenindo ataques de SQL Injection. O `QueryExecutor` também suporta parâmetros para queries diretas.
-   **Pool de Conexões**: O `QueryExecutor` gerencia um pool de conexões, otimizando o uso de recursos e garantindo que as conexões sejam reutilizadas de forma eficiente.
-   **Liberação de Conexões**: As conexões são sempre liberadas de volta ao pool no bloco `finally` após a execução da query ou transação, evitando vazamentos de conexão.

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
