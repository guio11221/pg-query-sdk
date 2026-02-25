# Dialect Support

The PG Query SDK is designed with an extensible architecture to support various SQL database dialects. This is achieved through the `Dialect` interface, which abstracts away database-specific syntax differences, primarily for parameter placeholders and identifier quoting.

## The `Dialect` Interface

The `Dialect` interface defines two core methods:

```typescript
export interface Dialect {
    /**
     * Generates a parameter placeholder for the given index.
     * @param index - The index of the parameter (1-based).
     * @returns The dialect-specific parameter placeholder (e.g., '$1' for PostgreSQL, '?' for MySQL).
     */
    placeholder(index: number): string

    /**
     * Wraps an identifier (e.g., table name, column name) with dialect-specific quoting.
     * This prevents issues with reserved keywords or special characters in identifiers.
     * @param identifier - The identifier to wrap.
     * @returns The wrapped identifier (e.g., '"my_table"' for PostgreSQL, '`my_table`' for MySQL).
     */
    wrapIdentifier(identifier: string): string
}
```

## Provided Dialects

The SDK currently ships with implementations for the following dialects:

### `PostgresDialect`

This is the default dialect used by the `Database` class if no other dialect is explicitly provided. It implements PostgreSQL-specific syntax.

*   **Placeholder**: Uses dollar-prefixed, indexed placeholders (e.g., `$1`, `$2`, `$3`).
*   **Identifier Wrapping**: Uses double quotes (e.g., `"my_column"`).

```typescript
import PostgresDialect from 'pg-query-sdk';

const pgDialect = new PostgresDialect();
console.log(pgDialect.placeholder(1));      // Output: $1
console.log(pgDialect.wrapIdentifier('user_name')); // Output: "user_name"
```

### `MysqlDialect`

This dialect implements MySQL-specific syntax.

*   **Placeholder**: Uses a simple question mark (e.g., `?`).
*   **Identifier Wrapping**: Uses backticks (e.g., `` `my_column` ``).

```typescript
import { MysqlDialect } from '../src/dialects/MysqlDialect'; // Assuming you import it from its direct path if not exported via index.ts

const mysqlDialect = new MysqlDialect();
console.log(mysqlDialect.placeholder(1));      // Output: ?
console.log(mysqlDialect.wrapIdentifier('user_name')); // Output: `user_name`
```

## Using a Specific Dialect

You can specify the dialect to be used when initializing the `Database` instance.

```typescript
import Database from 'pg-query-sdk';
import PostgresDialect from 'pg-query-sdk';
// import { MysqlDialect } from 'pg-query-sdk'; // If MysqlDialect is exported from index.ts

// Using PostgresDialect explicitly (default behavior)
const pgDb = new Database({
  connectionString: 'postgres://...',
  dialect: new PostgresDialect(),
});

// Example of using a hypothetical MysqlDialect
// const mysqlDb = new Database({
//   connectionString: 'mysql://...',
//   dialect: new MysqlDialect(),
// });
```

## Extending with Custom Dialects

If you need to support a database not natively provided by the SDK, you can create your own custom dialect by implementing the `Dialect` interface.

```typescript
import { Dialect } from 'pg-query-sdk'; // Or from '../src/dialects/Dialect'

class SqliteDialect implements Dialect {
  placeholder(index: number): string {
    // SQLite typically uses '?' for placeholders
    return '?';
  }

  wrapIdentifier(identifier: string): string {
    // SQLite typically uses double quotes for identifiers
    return `"${identifier}"`;
  }
}

// Then you can use it:
// const sqliteDb = new Database({
//   connectionString: 'sqlite://...',
//   dialect: new SqliteDialect(),
// });
```

By abstracting dialect-specific syntax, the PG Query SDK provides a flexible foundation that can be extended to work with a wider range of SQL databases, although its primary focus remains PostgreSQL.

Next: [Security Considerations](./security.md)