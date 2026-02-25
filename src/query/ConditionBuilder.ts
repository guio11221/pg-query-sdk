import ParamContext from '../core/ParamContext'

type Operator =
    | '='
    | '>'
    | '<'
    | '>='
    | '<='
    | '!='
    | '<>'
    | 'LIKE'
    | 'ILIKE'

/**
 * A builder for constructing SQL WHERE and HAVING clauses.
 */
export default class ConditionBuilder {
    private parts: string[] = []

    /**
     * Creates an instance of ConditionBuilder.
     * @param ctx - The ParamContext to manage query parameters.
     */
    constructor(private ctx: ParamContext) {
    }

    /**
     * Adds one or more WHERE conditions based on an object.
     * Supports direct equality, `null` checks, and custom operators.
     * @param obj - An object where keys are column names and values are the desired values or an object with `op` and `value`.
     * @returns The current ConditionBuilder instance.
     */
    where(obj: Record<string, any>) {
        Object.entries(obj).forEach(([key, value]) => {
            if (value === null) {
                this.parts.push(`${key} IS NULL`)
                return
            }

            if (typeof value === 'object' && value !== null && 'op' in value) {
                const {op, value: v} = value as {
                    op: Operator
                    value: any
                }

                const placeholder = this.ctx.add(v)
                this.parts.push(`${key} ${op} ${placeholder}`)
                return
            }

            const placeholder = this.ctx.add(value)
            this.parts.push(`${key} = ${placeholder}`)
        })

        return this
    }

    /**
     * Adds a raw SQL expression to the conditions.
     * @param expression - The raw SQL expression.
     * @returns The current ConditionBuilder instance.
     */
    raw(expression: string) {
        this.parts.push(expression)
        return this
    }

    /**
     * Adds a group of conditions connected by AND.
     * @param cb - A callback function that receives a nested ConditionBuilder to define conditions within the group.
     * @returns The current ConditionBuilder instance.
     */
    andGroup(cb: (qb: ConditionBuilder) => void) {
        const nested = new ConditionBuilder(this.ctx)
        cb(nested)

        const built = nested.build()
        if (built) {
            this.parts.push(`(${built.replace(/^WHERE\s/, '')})`)
        }

        return this
    }

    /**
     * Adds a group of conditions connected by OR.
     * @param cb - A callback function that receives a nested ConditionBuilder to define conditions within the group.
     * @returns The current ConditionBuilder instance.
     */
    orGroup(cb: (qb: ConditionBuilder) => void) {
        const nested = new ConditionBuilder(this.ctx)
        cb(nested)

        const built = nested.build()
        if (built) {
            const clean = built.replace(/^WHERE\s/, '')
            this.parts.push(`OR (${clean})`)
        }

        return this
    }

    /**
     * Builds the SQL condition string.
     * @param prefix - The prefix for the condition (e.g., 'WHERE', 'HAVING'). Defaults to 'WHERE'.
     * @returns The built SQL condition string, or an empty string if no conditions were added.
     */
    build(prefix = 'WHERE'): string {
        if (!this.parts.length) return ''

        const normalized: string[] = []

        this.parts.forEach((part, index) => {
            if (index === 0) {
                normalized.push(part)
                return
            }

            if (part.startsWith('OR ')) {
                normalized.push(part)
            } else {
                normalized.push(`AND ${part}`)
            }
        })

        return `${prefix} ${normalized.join(' ')}`
    }
}