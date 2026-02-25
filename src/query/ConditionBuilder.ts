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
 * A builder for constructing SQL WHERE and HAVING clauses.
 */
export default class ConditionBuilder {

    private parts: ConditionNode[] = []

    constructor(private ctx: ParamContext) {}

    where(
        obj: Record<string, any> | ((qb: ConditionBuilder) => void)
    ) {

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

    private add(expression: string, type: 'AND' | 'OR' = 'AND') {
        this.parts.push({ type, expression })
    }

    raw(expression: string) {
        this.add(expression)
        return this
    }

    andGroup(cb: (qb: ConditionBuilder) => void) {

        const nested = new ConditionBuilder(this.ctx)
        cb(nested)

        const built = nested.build()
        if (!built) return this

        this.add(`(${built.replace(/^WHERE\s/, '')})`, 'AND')

        return this
    }

    orGroup(cb: (qb: ConditionBuilder) => void) {

        const nested = new ConditionBuilder(this.ctx)
        cb(nested)

        const built = nested.build()
        if (!built) return this

        this.add(`(${built.replace(/^WHERE\s/, '')})`, 'OR')

        return this
    }

    clone(): ConditionBuilder {

        const cloned = new ConditionBuilder(this.ctx)

        cloned.parts = this.parts.map(p => ({
            ...p
        }))

        return cloned
    }

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