# Managing Transactions

The PG Query SDK provides robust support for managing database transactions, ensuring data integrity through ACID properties (Atomicity, Consistency, Isolation, Durability). Transactions are crucial for operations that involve multiple database changes that must either all succeed or all fail together.

## The `transaction` Method

The `Database` class exposes a `transaction` method that allows you to execute a series of database operations within a single, atomic transaction.

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

async function transferFunds(fromAccountId: number, toAccountId: number, amount: number) {
  try {
    const result = await db.transaction(async trxDb => {
      // trxDb is a special Database instance bound to the current transaction.
      // All operations performed with trxDb will be part of this transaction.

      // 1. Deduct amount from sender's account
      const deductResult = await trxDb.executor.execute(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2 RETURNING balance',
        [amount, fromAccountId]
      );

      if (deductResult.rowCount === 0) {
        throw new Error(`Account ${fromAccountId} not found or insufficient funds.`);
      }
      if (deductResult.rows[0].balance < 0) {
        throw new Error(`Insufficient funds in account ${fromAccountId}.`);
      }

      // 2. Add amount to receiver's account
      const addResult = await trxDb.executor.execute(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2 RETURNING balance',
        [amount, toAccountId]
      );

      if (addResult.rowCount === 0) {
        throw new Error(`Account ${toAccountId} not found.`);
      }

      // If all operations succeed, the transaction will be committed.
      return `Successfully transferred ${amount} from account ${fromAccountId} to ${toAccountId}.`;
    });

    console.log(result); // "Successfully transferred 100 from account 1 to 2."
  } catch (error: any) {
    console.error('Transaction failed:', error.message);
    // If any error occurs, the transaction will be rolled back automatically.
  }
}

// Example usage:
// transferFunds(1, 2, 100);
```

## How it Works

1.  **Acquiring a Client**: When `db.transaction()` is called, it acquires a dedicated client from the PostgreSQL connection pool.
2.  **`BEGIN`**: A `BEGIN` command is sent to the database to start the transaction.
3.  **Callback Execution**: Your provided `async` callback function is executed. This function receives a special `trxDb` (transactional Database) instance.
    *   **Crucially**, you must use this `trxDb` instance for all database operations that should be part of the transaction. Any `QueryBuilder` or `executor` calls made directly on the original `db` instance will *not* be part of the transaction.
    *   The `trxDb` instance has its `QueryExecutor` configured to use the transactional client, ensuring all queries within the callback are isolated.
4.  **`COMMIT` or `ROLLBACK`**:
    *   If the callback function completes successfully (i.e., returns a value or resolves its Promise), a `COMMIT` command is sent, making all changes permanent.
    *   If the callback function throws an error or its Promise rejects, a `ROLLBACK` command is sent, undoing all changes made within the transaction.
5.  **Client Release**: Regardless of success or failure, the dedicated client is always released back to the connection pool in a `finally` block, preventing resource leaks.

## Best Practices for Transactions

*   **Keep Transactions Short**: Long-running transactions can hold locks and impact database performance. Aim to make your transactional blocks as concise as possible.
*   **Handle Errors Gracefully**: Always wrap your transaction calls in `try...catch` blocks to handle potential errors and inform the user or log the failure.
*   **Use `trxDb` Consistently**: Remember to use the `trxDb` instance passed to your callback for all database interactions that need to be part of the atomic unit.
*   **Avoid External Side Effects**: Try to minimize operations within a transaction that have external side effects (e.g., sending emails, calling external APIs) until after the transaction has successfully committed. If an external call fails after a commit, you might end up in an inconsistent state.

By following these guidelines, you can effectively leverage the transaction management capabilities of the PG Query SDK to build reliable and robust applications.

Next: [Basic ORM with Repositories](./usage-orm.md)