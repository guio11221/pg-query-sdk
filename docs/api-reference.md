# API Reference

This section provides guidance on accessing the detailed API documentation for the PG Query SDK. While this markdown documentation covers the conceptual understanding and usage examples, a comprehensive API reference is best generated directly from the TypeScript source code.

## Generated API Documentation

For the most accurate and up-to-date API reference, including all classes, interfaces, methods, properties, and their respective JSDoc comments, please refer to the **generated documentation**.

Typically, such documentation is generated using tools like [TypeDoc](https://typedoc.org/) or [JSDoc](https://jsdoc.app/) (with TypeScript support).

### How to Generate (Example with TypeDoc)

If you have TypeDoc configured in your project, you can usually generate the API documentation by running a command similar to this in your project's root directory:

```bash
npx typedoc --out docs/api src/index.ts
```

This command would:
*   `npx typedoc`: Execute the TypeDoc tool.
*   `--out docs/api`: Specify the output directory for the generated documentation (e.g., `pg-query-sdk/docs/api`).
*   `src/index.ts`: Indicate the entry point(s) for TypeDoc to analyze.

After generation, you would find HTML files in the `docs/api` directory that provide a navigable and searchable API reference.

## Key Modules and Classes

The PG Query SDK is structured around several key modules and classes:

*   **`Database`**: The primary entry point for all database interactions.
*   **`QueryExecutor`**: Handles the execution of SQL queries and connection pooling.
*   **`TransactionManager`**: Manages ACID-compliant database transactions.
*   **`QueryBuilder`**: A fluent interface for constructing `SELECT` queries.
*   **`ConditionBuilder`**: Used within `QueryBuilder` for complex `WHERE` and `HAVING` clauses.
*   **`Repository`**: An abstract base class for implementing data access layers (ORMs).
*   **`Dialect`**: An interface for database-specific syntax, with implementations like `PostgresDialect` and `MysqlDialect`.
*   **`ParamContext`**: Manages query parameters for safe execution.

Each of these components, along with their methods, properties, and parameters, is thoroughly documented in the source code using JSDoc, which forms the basis of the generated API reference.

Please consult the generated API documentation for detailed information on each function signature, parameter type, return value, and usage examples.

Next: [Contributing](./contributing.md)