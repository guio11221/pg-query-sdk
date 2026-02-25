/**
 * Defines the interface for a database dialect, providing methods for placeholder generation and identifier wrapping.
 */
export interface Dialect {
    /**
     * Generates a parameter placeholder for the given index.
     * @param index - The index of the parameter.
     * @returns The dialect-specific parameter placeholder.
     */
    placeholder(index: number): string

    /**
     * Wraps an identifier (e.g., table name, column name) with dialect-specific quoting.
     * @param identifier - The identifier to wrap.
     * @returns The wrapped identifier.
     */
    wrapIdentifier(identifier: string): string
}