/**
 * @packageDocumentation
 *
 * Public API surface of the database SDK.
 *
 * This module re-exports the primary building blocks required to:
 *
 * - Execute queries
 * - Build SQL statements fluently
 * - Manage transactions
 * - Implement repositories
 * - Configure SQL dialects
 *
 * Consumers should import from this entrypoint instead of
 * referencing internal paths directly.
 *
 * @example
 * import { Database, QueryBuilder } from 'pg-query-sdk'
 */

/**
 * Core execution engine responsible for running SQL queries
 * through a Pool or transactional PoolClient.
 *
 * @module QueryExecutor
 */
export { default as QueryExecutor } from './core/QueryExecutor'

/**
 * Fluent SQL builder used to construct SELECT, INSERT,
 * UPDATE and DELETE statements.
 *
 * @module QueryBuilder
 */
export { default as QueryBuilder } from './builders/QueryBuilder'

/**
 * Builder responsible for composing WHERE conditions
 * and logical predicates.
 *
 * @module ConditionBuilder
 */
export { default as ConditionBuilder } from './builders/ConditionBuilder'

/**
 * High-level database facade that integrates executor,
 * dialect and transaction management.
 *
 * @module Database
 */
export { default as Database } from './core/Database'

/**
 * Handles transactional lifecycle management
 * (BEGIN, COMMIT, ROLLBACK).
 *
 * @module TransactionManager
 */
export { default as TransactionManager } from './core/TransactionManager'

/**
 * PostgreSQL dialect implementation responsible for
 * SQL syntax generation specific to Postgres.
 *
 * @module PostgresDialect
 */
export { default as PostgresDialect } from './dialects/PostgresDialect'

/**
 * Base repository abstraction for implementing
 * data-access patterns on top of QueryExecutor.
 *
 * @module Repository
 */
export { default as Repository } from './orm/Repository'