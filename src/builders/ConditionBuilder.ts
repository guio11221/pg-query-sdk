import ParamContext from "../core/ParamContext";

/**
 * A builder for constructing SQL WHERE and HAVING clauses.
 * This builder is specifically designed for the `builders` directory and might have a different scope or feature set
 * compared to other ConditionBuilder implementations in the project.
 */
export default class ConditionBuilder {
    private conditions: string[] = []

    /**
     * Creates an instance of ConditionBuilder.
     * @param ctx - The ParamContext to manage query parameters.
     */
    constructor(private ctx: ParamContext) {
    }

    /**
     * Adds one or more WHERE conditions based on an object.
     * @param obj - An object where keys are column names and values are the desired values.
     * @returns The current ConditionBuilder instance.
     */
    where(obj: Record<string, any>) {
        Object.entries(obj).forEach(([key, value]) => {
            const placeholder = this.ctx.add(value)
            this.conditions.push(`${key} = ${placeholder}`)
        })
        return this
    }

    /**
     * Adds a raw SQL expression to the conditions.
     * @param expression - The raw SQL expression.
     * @returns The current ConditionBuilder instance.
     */
    raw(expression: string) {
        this.conditions.push(expression)
        return this
    }

    /**
     * Adds a group of conditions connected by AND.
     * @param callback - A callback function that receives a nested ConditionBuilder to define conditions within the group.
     * @returns The current ConditionBuilder instance.
     */
    andGroup(callback: (qb: ConditionBuilder) => void) {
        const nested = new ConditionBuilder(this.ctx)
        callback(nested)
        const built = nested.build()
        if (built) {
            this.conditions.push(`(${built.replace(/^WHERE /, '')})`)
        }
        return this
    }

    /**
     * Adds a group of conditions connected by OR.
     * @param callback - A callback function that receives a nested ConditionBuilder to define conditions within the group.
     * @returns The current ConditionBuilder instance.
     */
    orGroup(callback: (qb: ConditionBuilder) => void) {
        const nested = new ConditionBuilder(this.ctx)
        callback(nested)
        const built = nested.build()
        if (built) {
            this.conditions.push(`OR (${built.replace(/^WHERE /, '')})`)
        }
        return this
    }

    /**
     * Builds the SQL condition string.
     * @param prefix - The prefix for the condition (e.g., 'WHERE', 'HAVING'). Defaults to 'WHERE'.
     * @returns The built SQL condition string, or an empty string if no conditions were added.
     */
    build(prefix = 'WHERE') {
        if (!this.conditions.length) return ''
        return `${prefix} ${this.conditions.join(' AND ')}`
    }
}