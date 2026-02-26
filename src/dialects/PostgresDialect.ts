import { Dialect } from "./Dialect"

/**
 * PostgreSQL-specific implementation of the Dialect contract.
 *
 * Responsibilities:
 * - Generate positional parameter placeholders using `$n` syntax
 * - Apply double-quote identifier wrapping according to PostgreSQL rules
 *
 * @remarks
 * PostgreSQL uses 1-based positional parameters:
 *   $1, $2, $3, ...
 *
 * Identifier quoting uses double quotes (") and preserves case sensitivity.
 *
 * This implementation performs simple wrapping and does not escape
 * embedded double quotes. Upstream validation is recommended
 * if dynamic identifiers are allowed.
 */
export default class PostgresDialect implements Dialect {

    /**
     * Generates a PostgreSQL positional parameter placeholder.
     *
     * @param index - 1-based parameter index.
     * @returns Placeholder string in `$n` format.
     *
     * @example
     * placeholder(1) → "$1"
     * placeholder(2) → "$2"
     */
    placeholder(index: number): string {
        return `$${index}`
    }

    /**
     * Wraps an SQL identifier using PostgreSQL double-quote syntax.
     *
     * @param id - Raw identifier (table, column, schema, alias).
     * @returns Double-quoted identifier.
     *
     * @example
     * wrapIdentifier("users") → "\"users\""
     *
     * @remarks
     * - Preserves case sensitivity.
     * - Does not sanitize or escape internal quotes.
     * - Should not be used with untrusted raw input.
     */
    wrapIdentifier(id: string): string {
        return `"${id}"`
    }
}