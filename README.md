# PG Query SDK (TypeScript)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.com/)

## A Robust and Type-Safe PostgreSQL Integration Library for TypeScript

The PG Query SDK is a comprehensive TypeScript library designed to facilitate seamless and type-safe interaction with PostgreSQL databases. It provides a structured approach to query construction, execution, and transaction management, enhancing developer productivity and reducing common database-related errors.

### Key Features:

*   **`Database`**: The central entry point for database operations, managing connections and configurations.
*   **`QueryBuilder`**: A fluent interface for constructing complex SQL `SELECT` queries programmatically.
*   **`ConditionBuilder`**: Specialized builder for crafting intricate `WHERE` and `HAVING` clauses.
*   **`QueryExecutor`**: Manages database connection pooling and executes raw SQL queries securely.
*   **Basic ORM Capabilities**: Includes an abstract `Repository` class for data access abstraction, with extensible methods for DML operations.
*   **Transaction Management**: Robust support for ACID-compliant database transactions.

---

## 📦 Installation

To integrate the PG Query SDK into your project, execute the following command:

```bash
npm install pg-query-sdk
```

---

## 🚀 Getting Started

### Initializing the Database

The `Database` class serves as the primary interface for all database interactions. Instantiate it with your PostgreSQL connection string.

```typescript
import {Database} from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});
```

---

## 🛠 Core Functionalities

### 1️⃣ QueryBuilder: Fluent SQL `SELECT` Query Construction

The `QueryBuilder` enables the programmatic construction of SQL `SELECT` statements, accessible via the `db.table()` method.

```typescript
import {Database} from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function selectExample() {
  const users = await db.table('users')
    .select(['id', 'name', 'email'])
    .where({ active: true })
    .limit(10)
    .orderBy('name', 'ASC')
    .execute();

  console.log('Selected Users:', users);
}

selectExample();
```

### 2️⃣ ConditionBuilder: Advanced `WHERE` and `HAVING` Clauses

The `ConditionBuilder` facilitates the creation of complex conditional logic within `WHERE` and `HAVING` clauses, typically used in conjunction with the `QueryBuilder`.

```typescript
import {Database} from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function complexWhereExample() {
  const products = await db.table('products')
    .select(['name', 'price'])
    .where(conditions => {
      conditions
        .where({ category: 'electronics' })
        .orGroup(group => {
          group
            .where({ price: { op: '<', value: 100 } })
            .where({ stock: { op: '>', value: 0 } });
        });
    })
    .execute();

  console.log('Complex WHERE Products:', products);
}

complexWhereExample();
```

### 3️⃣ QueryExecutor: Direct Query Execution

For scenarios requiring direct execution of raw SQL queries, the `QueryExecutor` can be instantiated and utilized.

```typescript
import { QueryExecutor } from 'pg-query-sdk';

const executor = new QueryExecutor({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function directExecuteExample() {
  const result = await executor.execute(
    'SELECT version()',
    []
  );
  console.log('Direct Execution Result:', result.rows);
}

directExecuteExample();
```

### 4️⃣ ACID Transactions

The SDK provides robust support for managing ACID-compliant transactions, ensuring data integrity.

```typescript
import {Database} from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function transactionExample() {
  try {
    const result = await db.transaction(async trxDb => {
      // 'trxDb' is a Database instance bound to the current transaction.
      // Use 'trxDb.executor.execute()' for DML operations within the transaction.
      await trxDb.executor.execute(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [100.00, 1]
      );
      await trxDb.executor.execute(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [100.00, 2]
      );
      return 'Transaction completed successfully.';
    });
    console.log(result);
  } catch (error: any) {
    console.error('Transaction failed:', error.message);
  }
}

transactionExample();
```

### 5️⃣ Basic ORM with Repositories

The abstract `Repository<T>` class offers a foundational ORM layer, providing methods like `findById` and a pre-configured `QueryBuilder` (`qb()`). Custom DML operations (`insert`, `update`, `delete`) should be implemented in concrete repository classes.

```typescript
import {Database, Repository } from 'pg-query-sdk';
import { QueryExecutor, Dialect } from 'pg-query-sdk';

interface User {
  id: number;
  name: string;
  email: string;
}

class UserRepository extends Repository<User> {
  constructor(executor: QueryExecutor, dialect: Dialect) {
    super('users', executor, dialect);
  }

  async findByName(name: string): Promise<User[]> {
    return this.qb()
      .where({ name })
      .execute();
  }

  // Implement DML operations as needed.
  // Example: async insert(data: Partial<User>): Promise<User> { /* ... */ }
}

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function repositoryExample() {
  const userRepository = db.repository(UserRepository);

  const userById = await userRepository.findById(1);
  console.log('User by ID:', userById);

  const usersByName = await userRepository.findByName('Alice');
  console.log('Users by Name:', usersByName);
}

repositoryExample();
```

---

## ⚙️ Dual Module Support

The package provides support for both CommonJS and ES Modules environments.

### CommonJS

```javascript
const Database = require('pg-query-sdk').default;
const db = new Database({ /* ... */ });
```

### ESM

```typescript
import {Database} from 'pg-query-sdk';
const db = new Database({ /* ... */ });
```

---

## 🧱 Project Structure

The project is organized into distinct modules, each responsible for a specific aspect of database interaction:

```
pg-query-sdk/
  src/
    core/
      Database.ts           # Central database interface
      ParamContext.ts       # Manages query parameters
      QueryExecutor.ts      # Executes SQL queries
      TransactionManager.ts # Handles database transactions
    builders/
      ConditionBuilder.ts   # Builds WHERE/HAVING clauses
      QueryBuilder.ts       # Builds SELECT queries
    orm/
      EntityManager.ts      # (Planned) Entity management
      Repository.ts         # Abstract base for data access
    dialects/
      Dialect.ts            # Interface for database dialects
      PostgresDialect.ts    # PostgreSQL specific dialect implementation
    index.ts                # Main entry point for module exports
```

---

## 📌 Responsibilities of Layers

| Layer                 | Responsibility                                                                                                 |
| :-------------------- | :------------------------------------------------------------------------------------------------------------- |
| `Database`            | Serves as the primary entry point, managing connection configurations, dialect, transactions, and access to builders and repositories. |
| `QueryBuilder`        | Provides a fluent API for constructing SQL `SELECT` queries.                                                   |
| `ConditionBuilder`    | Facilitates the construction of complex `WHERE` and `HAVING` clauses.                                          |
| `QueryExecutor`       | Manages the PostgreSQL connection pool and executes SQL queries, ensuring resource efficiency.                 |
| `Repository`          | Offers an abstract layer for data access operations for a specific entity. Includes `findById` and a pre-configured `QueryBuilder`. Custom DML operations are to be implemented by concrete classes. |
| `TransactionManager`  | Orchestrates ACID-compliant database transactions, ensuring atomicity, consistency, isolation, and durability. |
| `EntityManager`       | (Planned) Will manage multiple repositories and coordinate units of work for complex persistence scenarios.    |

---

## 🔐 Security Considerations

The PG Query SDK prioritizes security through several mechanisms:

*   **Prepared Statements**: All queries utilize prepared statements with parameterized values, effectively mitigating SQL injection vulnerabilities.
*   **Connection Pooling**: The `QueryExecutor` employs connection pooling to manage database connections efficiently and securely, reducing overhead and preventing resource exhaustion.
*   **Resource Management**: Database connections are meticulously released in `finally` blocks within transaction and execution contexts, preventing connection leaks and ensuring system stability.

---

## 📄 License

This project is distributed under the MIT License. For more details, please refer to the `LICENSE` file.
