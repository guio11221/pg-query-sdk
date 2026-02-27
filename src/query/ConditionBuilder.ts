import ParamContext from '../core/ParamContext'
import QueryBuilder from "../builders/QueryBuilder"

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
    | 'IN'
    | 'NOT IN'
    | 'BETWEEN'
    | 'EXISTS'

type ConditionValue =
    | any
    | {
    op: Operator
    value: any
}

type ConditionNode = {
    type: 'AND' | 'OR'
    expression: string
}

/**
 * Fluent builder for constructing SQL WHERE and HAVING clauses.
 *
 * Responsibilities:
 * - Compose structured conditions
 * - Support nested logical groups
 * - Bind parameters through ParamContext
 * - Produce SQL fragments (no execution responsibility)
 *
 * @remarks
 * - Parameter ordering is delegated to ParamContext.
 * - This class does not sanitize column names.
 * - Raw expressions must be used cautiously.
 */
export default class ConditionBuilder {

    /**
     * Internal ordered list of condition nodes.
     */
    private parts: ConditionNode[] = []

    /**
     * Creates a new ConditionBuilder.
     *
     * @param ctx - Shared ParamContext used for parameter binding.
     *
     * @remarks
     * The same context should be reused across the full query lifecycle
     * to maintain placeholder consistency.
     */
    constructor(private ctx: ParamContext) {}

    /**
     * Adds conditions using either:
     * - Object notation
     * - Nested callback builder
     *
     * @param obj - Condition object or nested builder function.
     * @returns The current builder instance.
     *
     * @example
     * qb.where({ id: 1 })
     * qb.where({ age: { op: '>=', value: 18 } })
     */
    where(obj: Record<string, any> | ((qb: ConditionBuilder) => void)) {

        if (typeof obj === 'function') {

            const nested = new ConditionBuilder(this.ctx)

            obj(nested)

            const built = nested.build()

            if (built) {
                this.add(`(${built.replace(/^WHERE\s/, '')})`)
            }

            return this
        }

        Object.entries(obj).forEach(([key, condition]) => {

            if (condition === null) {
                this.add(`${key} IS NULL`)
                return
            }

            if (
                typeof condition === 'object'
                && condition !== null
                && 'op' in condition
            ) {

                const { op, value } = condition as any

                this.handleOperator(key, op, value)
                return
            }

            const placeholder = this.ctx.add(condition)
            this.add(`${key} = ${placeholder}`)
        })

        return this
    }

    /**
     * Handles operator-specific SQL generation.
     *
     * @param key - Column name.
     * @param op - Comparison operator.
     * @param value - Value associated with the operator.
     *
     * @throws Error if operator is invalid or value shape is incorrect.
     */
    private handleOperator(key: string, op: Operator, value: any) {

        const allowed: Operator[] = [
            '=', '>', '<', '>=', '<=', '!=', '<>',
            'LIKE', 'ILIKE',
            'IN', 'NOT IN',
            'BETWEEN', 'EXISTS'
        ]

        if (!allowed.includes(op)) {
            throw new Error(`Invalid operator ${op}`)
        }

        switch (op) {

            case 'IN':
            case 'NOT IN': {

                if (!Array.isArray(value)) {
                    throw new Error(`${op} expects array`)
                }

                const placeholders =
                    value.map(v => this.ctx.add(v)).join(', ')

                this.add(`${key} ${op} (${placeholders})`)
                break
            }

            case 'BETWEEN': {

                if (!Array.isArray(value) || value.length !== 2) {
                    throw new Error('BETWEEN expects [min,max]')
                }

                const p1 = this.ctx.add(value[0])
                const p2 = this.ctx.add(value[1])

                this.add(`${key} BETWEEN ${p1} AND ${p2}`)
                break
            }

            case 'EXISTS': {

                if (!(value instanceof QueryBuilder)) {
                    throw new Error('EXISTS expects QueryBuilder')
                }

                const { query, params } = value.build()
                params.forEach(p => this.ctx.add(p))

                this.add(`EXISTS (${query})`)
                break
            }

            default: {
                const placeholder = this.ctx.add(value)
                this.add(`${key} ${op} ${placeholder}`)
            }
        }
    }

    /**
     * Adds a condition expression with logical connector.
     *
     * @param expression - SQL condition fragment.
     * @param type - Logical operator (default: AND).
     */
    private add(expression: string, type: 'AND' | 'OR' = 'AND') {
        this.parts.push({ type, expression })
    }

    /**
     * Adds a raw SQL expression.
     *
     * @param expression - Raw SQL fragment.
     * @returns The current builder instance.
     *
     * @remarks
     * No validation or sanitization is performed.
     */
    raw(expression: string) {
        this.add(expression)
        return this
    }

    /**
     * Creates an AND logical group.
     *
     * @param cb - Nested condition callback.
     * @returns The current builder instance.
     */
    andGroup(cb: (qb: ConditionBuilder) => void) {

        const nested = new ConditionBuilder(this.ctx)
        cb(nested)

        const built = nested.build()
        if (!built) return this

        this.add(`(${built.replace(/^WHERE\s/, '')})`, 'AND')

        return this
    }

    /**
     * Creates an OR logical group.
     *
     * @param cb - Nested condition callback.
     * @returns The current builder instance.
     */
    orGroup(cb: (qb: ConditionBuilder) => void) {

        const nested = new ConditionBuilder(this.ctx)
        cb(nested)

        const built = nested.build()
        if (!built) return this

        this.add(`(${built.replace(/^WHERE\s/, '')})`, 'OR')

        return this
    }

    /**
     * Creates a shallow clone of the current builder.
     *
     * @remarks
     * Shares the same ParamContext instance.
     */
    clone(): ConditionBuilder {

        const cloned = new ConditionBuilder(this.ctx)

        cloned.parts = this.parts.map(p => ({
            ...p
        }))

        return cloned
    }

    /**
     * Builds the final SQL clause.
     *
     * @param prefix - Clause prefix (default: "WHERE").
     * @returns SQL fragment or empty string if no conditions exist.
     *
     * @example
     * WHERE id = $1 AND active = $2
     */
    build(prefix = 'WHERE'): string {

        if (!this.parts.length) return ''

        let sql = ''

        this.parts.forEach((part, index) => {

            if (index === 0) {
                sql += part.expression
            } else {
                sql += ` ${part.type} ${part.expression}`
            }

        })

        return `${prefix} ${sql}`
    }
}