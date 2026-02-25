# Executing Raw Queries

While the `QueryBuilder` and `Repository` classes provide a high-level, fluent interface for database interactions, there are scenarios where you might need to execute raw SQL queries directly. The PG Query SDK facilitates this through the `QueryExecutor` class, ensuring that even raw queries are executed securely using parameterized statements.

## Accessing the `QueryExecutor`

You can obtain a `QueryExecutor` instance in a few ways:

1.  **Direct Instantiation**: For standalone raw query execution, you can instantiate `QueryExecutor` directly.
2.  **From `Database` Instance**: The `Database` class internally uses a `QueryExecutor`. You can access it via `db.executor`.
3.  **Within a Transaction**: Inside a `db.transaction()` callback, the `trxDb` instance provides a transactional `QueryExecutor` (`trxDb.executor`).

### Direct Instantiation

```typescript
import { QueryExecutor } from 'pg-query-sdk';

const executor = new QueryExecutor({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function executeRawSelect() {
  try {
    const result = await executor.execute(
      'SELECT version() AS pg_version'
    );
    console.log('PostgreSQL Version:', result.rows[0].pg_version);

    const users = await executor.execute(
      'SELECT id, name, email FROM users WHERE id = $1',
      [1]
    );
    console.log('User by ID:', users.rows);
  } catch (error) {
    console.error('Error executing raw query:', error);
  } finally {
    // It's good practice to close the executor's pool if it was directly instantiated
    await executor.close();
  }
}

executeRawSelect();
```

### From `Database` Instance

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function executeRawUpdate() {
  try {
    const result = await db.executor.execute(
      'UPDATE products SET price = $1 WHERE id = $2 RETURNING *',
      [99.99, 101]
    );
    console.log('Updated Product:', result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
  }
}

executeRawUpdate();
```

### Within a Transaction

As discussed in [Managing Transactions](./usage-transactions.md), the `trxDb` instance provides a `QueryExecutor` that is bound to the ongoing transaction.

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function rawQueryInTransaction() {
  try {
    const transactionResult = await db.transaction(async trxDb => {
      // Insert a new log entry
      await trxDb.executor.execute(
        'INSERT INTO logs (message, created_at) VALUES ($1, NOW())',
        ['Starting critical operation']
      );

      // Perform a critical update
      const updateResult = await trxDb.executor.execute(
        'UPDATE settings SET value = $1 WHERE key = $2 RETURNING value',
        ['new_value', 'critical_setting']
      );

      if (updateResult.rowCount === 0) {
        throw new Error('Critical setting not found.');
      }

      // Insert another log entry
      await trxDb.executor.execute(
        'INSERT INTO logs (message, created_at) VALUES ($1, NOW())',
        ['Critical operation completed']
      );

      return 'Critical operation successful within transaction.';
    });
    console.log(transactionResult);
  } catch (error: any) {
    console.error('Transaction with raw queries failed:', error.message);
  }
}

rawQueryInTransaction();
```

## The `execute` Method

The `execute` method of `QueryExecutor` has the following signature:

```typescript
async execute(query: string, params: any[] = [], cacheTTL?: number): Promise<QueryResult>
```

*   **`query: string`**: The raw SQL query string to be executed.
*   **`params: any[]`**: An optional array of parameters to be bound to the query. **It is highly recommended to always use parameters for any dynamic values to prevent SQL injection.**
*   **`cacheTTL?: number`**: An optional time-to-live for caching the query result (not actively used in the current `QueryExecutor` implementation but available for future extensions).
*   **Returns `Promise<QueryResult>`**: A Promise that resolves to a `QueryResult` object from the underlying `pg` library, containing `rows`, `command`, `rowCount`, etc.

## Security Considerations

**Always use parameterized queries** when executing raw SQL with dynamic values. This is the primary defense against SQL injection attacks. The `QueryExecutor` automatically handles the safe binding of parameters to your query.

**Bad (Vulnerable to SQL Injection):**

```typescript
const unsafeName = "Robert'); DROP TABLE users; --";
await executor.execute(`SELECT * FROM users WHERE name = '${unsafeName}'`);
```

**Good (Secure):**

```typescript
const safeName = "Robert'); DROP TABLE users; --";
await executor.execute('SELECT * FROM users WHERE name = $1', [safeName]);
```

By leveraging the `QueryExecutor` for raw SQL, you gain fine-grained control over your database interactions while maintaining security and efficiency.

Next: [Dialect Support](./dialects.md)