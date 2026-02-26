/**
 * Contract that defines the behavior required for a SQL dialect implementation.
 *
 * Responsibilities:
 * - Generate positional parameter placeholders
 * - Apply proper identifier quoting/escaping rules
 *
 * @remarks
 * Implementations must ensure compatibility with the target
 * database engine syntax (e.g., PostgreSQL, MySQL, SQLite).
 *
 * This interface abstracts vendor-specific SQL differences,
 * enabling query generation to remain database-agnostic.
 */
export interface Dialect {

    /**
     * Generates a positional parameter placeholder.
     *
     * @param index - 1-based parameter index.
     *
     * @returns A dialect-specific placeholder string.
     *
     * @example
     * PostgreSQL:
     *   placeholder(1) → "$1"
     *
     * MySQL:
     *   placeholder(1) → "?"
     *
     * @remarks
     * Implementations must preserve positional consistency
     * with the order parameters are bound.
     */
    placeholder(index: number): string

    /**
     * Applies dialect-specific quoting to an SQL identifier.
     *
     * Identifiers include:
     * - Table names
     * - Column names
     * - Schema names
     * - Aliases
     *
     * @param identifier - Raw identifier name.
     *
     * @returns Safely wrapped identifier.
     *
     * @example
     * PostgreSQL:
     *   wrapIdentifier("users") → "\"users\""
     *
     * MySQL:
     *   wrapIdentifier("users") → "`users`"
     *
     * @remarks
     * Implementations should not modify semantic meaning,
     * only apply quoting/escaping rules.
     */
    wrapIdentifier(identifier: string): string
}