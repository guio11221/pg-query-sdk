# Introduction to PG Query SDK

The PG Query SDK is a robust and type-safe TypeScript library designed to streamline interactions with PostgreSQL databases. Built with developer experience in mind, it offers a fluent API for constructing SQL queries, managing transactions, and implementing data access layers, all while leveraging TypeScript's strong typing for enhanced reliability and maintainability.

## Purpose

This SDK aims to provide a flexible yet powerful interface for PostgreSQL, bridging the gap between raw SQL and full-fledged ORMs. It empowers developers to write complex queries programmatically, ensuring SQL injection safety through parameterized queries, and offering clear separation of concerns for various database operations.

## Key Features

*   **Fluent Query Building**: Construct `SELECT` queries with a chainable API, supporting `WHERE`, `JOIN`, `GROUP BY`, `ORDER BY`, `LIMIT`, `OFFSET`, and Common Table Expressions (CTEs).
*   **Advanced Condition Handling**: Utilize `ConditionBuilder` for intricate `WHERE` and `HAVING` clauses, including nested logical groups (`AND`, `OR`).
*   **Transaction Management**: Ensure data integrity with ACID-compliant transaction support, allowing atomic operations across multiple database commands.
*   **Extensible Dialect Support**: Designed with an abstract `Dialect` interface, currently supporting PostgreSQL and MySQL, making it adaptable to other SQL databases.
*   **Basic ORM Capabilities**: An abstract `Repository` class provides a foundation for building data access layers, promoting reusability and maintainability.
*   **Direct Query Execution**: For scenarios requiring maximum flexibility, execute raw SQL queries securely with parameter binding.
*   **Type Safety**: Fully written in TypeScript, providing compile-time checks and excellent IDE support for a smoother development workflow.

## Why Choose PG Query SDK?

*   **Productivity**: Reduce boilerplate code with intuitive builders and clear abstractions.
*   **Safety**: Minimize SQL injection risks and leverage TypeScript for fewer runtime errors.
*   **Flexibility**: Control over SQL generation when needed, without being constrained by a heavy ORM.
*   **Maintainability**: Structured code and comprehensive documentation make projects easier to understand and evolve.

This documentation will guide you through the installation, configuration, and usage of the PG Query SDK, helping you harness its full potential in your applications.