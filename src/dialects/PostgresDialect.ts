import {Dialect} from "./Dialect";

/**
 * Implements the Dialect interface for PostgreSQL, providing PostgreSQL-specific placeholder and identifier wrapping.
 */
export default class PostgresDialect implements Dialect {
    /**
     * Returns a PostgreSQL-specific parameter placeholder (e.g., '$1', '$2').
     * @param index - The index of the parameter.
     * @returns The dollar-prefixed, indexed placeholder.
     */
    placeholder(index: number) {
        return `$${index}`
    }

    /**
     * Wraps a PostgreSQL identifier with double quotes.
     * @param id - The identifier to wrap.
     * @returns The double-quoted identifier.
     */
    wrapIdentifier(id: string) {
        return `"${id}"`
    }
}