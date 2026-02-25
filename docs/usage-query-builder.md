# Using the QueryBuilder

The `QueryBuilder` is a core component of the PG Query SDK, providing a fluent and type-safe interface for constructing SQL `SELECT` queries. It abstracts away the complexities of SQL syntax, allowing you to build dynamic queries programmatically.

## Accessing the QueryBuilder

You can obtain a `QueryBuilder` instance by calling the `table()` method on your `Database` instance, specifying the target table name.

```typescript
import Database from 'pg-query-sdk';

const db = new Database({
  connectionString: 'postgres://user:pass@localhost:5432/your_database',
});

// Get a QueryBuilder for the 'users' table
const userQueryBuilder = db.table('users');
```

## Basic Select Statements

### `select(fields: (keyof T | string)[])`

Specify the columns you want to retrieve. If `select()` is not called, all columns (`*`) will be selected by default.

```typescript
// Select specific columns
const users = await db.table('users')
  .select(['id', 'name', 'email'])
  .execute();
// SELECT id, name, email FROM users

// Select all columns (default behavior if .select() is omitted)
const allUsers = await db.table('users').execute();
// SELECT * FROM users
```

## Filtering Data (`WHERE` Clauses)

### `where(obj: Partial<T>)`

Add `WHERE` conditions using an object. Keys correspond to column names, and values are matched for equality.

```typescript
// Simple equality
const activeUsers = await db.table('users')
  .where({ active: true })
  .execute();
// SELECT * FROM users WHERE active = $1

// Null check
const usersWithoutEmail = await db.table('users')
  .where({ email: null })
  .execute();
// SELECT * FROM users WHERE email IS NULL
```

### `where(obj: { op: Operator, value: any })` with Operators

For conditions other than equality, you can pass an object with an `op` (operator) and `value`.

```typescript
const expensiveProducts = await db.table('products')
  .where({ price: { op: '>', value: 100 } })
  .execute();
// SELECT * FROM products WHERE price > $1

const productsLikeName = await db.table('products')
  .where({ name: { op: 'ILIKE', value: '%apple%' } }) // ILIKE for case-insensitive LIKE
  .execute();
// SELECT * FROM products WHERE name ILIKE $1
```

### `whereRaw(expression: string)`

Add raw SQL expressions to your `WHERE` clause for maximum flexibility. Be cautious with raw expressions to prevent SQL injection; ensure any dynamic values are properly parameterized.

```typescript
const recentOrders = await db.table('orders')
  .whereRaw('created_at > NOW() - INTERVAL \'7 days\'')
  .execute();
// SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '7 days'
```

### `andGroup(cb: (qb: ConditionBuilder) => void)` and `orGroup(cb: (qb: ConditionBuilder) => void)`

Group conditions using `AND` or `OR` logic. The callback receives a `ConditionBuilder` instance to define nested conditions.

```typescript
const complexUsers = await db.table('users')
  .where(conditions => {
    conditions
      .where({ active: true })
      .andGroup(group => {
        group
          .where({ age: { op: '>', value: 18 } })
          .where({ country: 'USA' });
      })
      .orGroup(group => {
        group
          .where({ role: 'admin' })
          .where({ last_login: { op: '<', value: '2023-01-01' } });
      });
  })
  .execute();
// SELECT * FROM users WHERE active = $1 AND (age > $2 AND country = $3) OR (role = $4 AND last_login < $5)
```

## Joining Tables

### `join(table: string, localKey: string, foreignKey: string)` (INNER JOIN)
### `leftJoin(table: string, localKey: string, foreignKey: string)` (LEFT JOIN)
### `rightJoin(table: string, localKey: string, foreignKey: string)` (RIGHT JOIN)

Add join clauses to combine data from multiple tables.

```typescript
const usersWithOrders = await db.table('users')
  .select(['users.name', 'orders.order_id', 'orders.amount'])
  .join('orders', 'users.id', 'orders.user_id')
  .where({ 'orders.amount': { op: '>', value: 50 } })
  .execute();
// SELECT users.name, orders.order_id, orders.amount FROM users INNER JOIN orders ON users.id = orders.user_id WHERE orders.amount > $1
```

## Aggregating Data

### `groupBy(fields: string | string[])`

Group rows that have the same values in specified columns into summary rows.

```typescript
const orderCountsByUser = await db.table('orders')
  .select(['user_id', 'COUNT(order_id) AS total_orders'])
  .groupBy('user_id')
  .execute();
// SELECT user_id, COUNT(order_id) AS total_orders FROM orders GROUP BY user_id
```

### `having(obj: Record<string, any>)` and `havingRaw(expression: string)`

Filter groups based on aggregate conditions, similar to `where` but applied after `groupBy`.

```typescript
const usersWithManyOrders = await db.table('orders')
  .select(['user_id', 'COUNT(order_id) AS total_orders'])
  .groupBy('user_id')
  .having({ 'COUNT(order_id)': { op: '>', value: 5 } })
  .execute();
// SELECT user_id, COUNT(order_id) AS total_orders FROM orders GROUP BY user_id HAVING COUNT(order_id) > $1
```

## Ordering and Limiting Results

### `orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC')`

Sort the result set by one or more columns.

```typescript
const sortedProducts = await db.table('products')
  .orderBy('price', 'DESC')
  .orderBy('name', 'ASC')
  .execute();
// SELECT * FROM products ORDER BY price DESC, name ASC
```

### `limit(value: number)`

Restrict the number of rows returned by the query.

```typescript
const top10Users = await db.table('users')
  .limit(10)
  .execute();
// SELECT * FROM users LIMIT 10
```

### `offset(value: number)`

Skip a specified number of rows before beginning to return rows. Useful for pagination.

```typescript
const usersPage2 = await db.table('users')
  .limit(10)
  .offset(10) // Skips the first 10 users, gets the next 10
  .execute();
// SELECT * FROM users LIMIT 10 OFFSET 10
```

## Advanced Query Features

### `with(name: string, subQuery: QueryBuilder<any>, recursive = false)` (Common Table Expressions - CTEs)

Define Common Table Expressions (CTEs) to simplify complex queries or perform recursive operations.

```typescript
const cteExample = await db.table('employees')
  .with('managers', db.table('employees').where({ role: 'manager' }))
  .select(['employees.name', 'managers.name AS manager_name'])
  .join('managers', 'employees.manager_id', 'managers.id')
  .execute();
// WITH managers AS (SELECT * FROM employees WHERE role = $1) SELECT employees.name, managers.name AS manager_name FROM employees INNER JOIN managers ON employees.manager_id = managers.id
```

### `fromSubquery(sub: QueryBuilder<any>, alias: string)`

Use a subquery as the main table in your `FROM` clause.

```typescript
const subqueryExample = await db.table('users')
  .fromSubquery(
    db.table('orders').select(['user_id', 'SUM(amount) AS total_spent']).groupBy('user_id'),
    'user_spending'
  )
  .select(['users.name', 'user_spending.total_spent'])
  .join('users', 'users.id', 'user_spending.user_id')
  .where({ 'user_spending.total_spent': { op: '>', value: 1000 } })
  .execute();
// SELECT users.name, user_spending.total_spent FROM (SELECT user_id, SUM(amount) AS total_spent FROM orders GROUP BY user_id) AS user_spending INNER JOIN users ON users.id = user_spending.user_id WHERE user_spending.total_spent > $1
```

## Executing the Query

### `execute(): Promise<T[]>`

Once your query is built, call `execute()` to run it against the database and retrieve the results. The method returns a Promise that resolves to an array of objects, where each object represents a row from the result set.

```typescript
const results = await db.table('my_table').select(['column1']).execute();
console.log(results); // [{ column1: 'value1' }, { column1: 'value2' }]
```

## Building the Query String

### `build(): { query: string, params: any[] }`

If you need to inspect the generated SQL query string and its parameters without executing it, use the `build()` method.

```typescript
const { query, params } = db.table('users').where({ id: 1 }).build();
console.log('SQL Query:', query);   // SELECT * FROM users WHERE id = $1
console.log('Parameters:', params); // [1]
```

The `QueryBuilder` provides a powerful and flexible way to interact with your database. Combine these methods to construct highly specific and efficient queries for your application.

Next: [Managing Transactions](./usage-transactions.md)