import { Dialect } from "../dialects/Dialect"

type SQLParam =
    | string
    | number
    | boolean
    | Date
    | null
    | Buffer
    | any[]

/**
 * Encapsulates SQL parameter handling and placeholder generation.
 *
 * Responsible for:
 * - Storing bound parameters in insertion order
 * - Delegating placeholder formatting to the configured Dialect
 * - Preserving immutability when exposing parameters
 *
 * @remarks
 * This class guarantees positional consistency between
 * generated placeholders and the internal parameter array.
 *
 * Example (PostgreSQL):
 *   $1, $2, $3
 *
 * Example (MySQL):
 *   ?, ?, ?
 */
export default class ParamContext {
    /**
     * Internal ordered parameter collection.
     * The index position determines placeholder numbering.
     */
    private params: SQLParam[] = []

    /**
     * Creates a new ParamContext instance.
     *
     * @param dialect - SQL dialect implementation responsible
     * for generating parameter placeholders.
     */
    constructor(private dialect: Dialect) {}

    /**
     * Registers a parameter value and returns its
     * dialect-specific placeholder.
     *
     * @param value - The value to bind to the query.
     * @returns The placeholder token corresponding to the parameter position.
     *
     * @example
     * const placeholder = ctx.add('John')
     * // PostgreSQL: "$1"
     * // MySQL: "?"
     */
    add(value: SQLParam): string {
        this.params.push(value)
        return this.dialect.placeholder(this.params.length)
    }

    /**
     * Returns a frozen copy of the accumulated parameters.
     *
     * @returns A readonly array of SQL parameters.
     *
     * @remarks
     * A shallow clone is returned to prevent accidental mutation
     * of the internal state.
     */
    getParams(): readonly SQLParam[] {
        return Object.freeze([...this.params])
    }

    /**
     * Creates a shallow copy of the current ParamContext.
     *
     * @returns A new ParamContext instance preserving
     * the same dialect and parameter ordering.
     *
     * @remarks
     * Useful when branching query construction logic
     * without mutating the original parameter state.
     */
    clone(): ParamContext {
        const ctx = new ParamContext(this.dialect)
        ctx.params = [...this.params]
        return ctx
    }
}