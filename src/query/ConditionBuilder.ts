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

export default class ConditionBuilder {
    private parts: string[] = []

    constructor(private ctx: ParamContext) {
    }

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

    raw(expression: string) {
        this.parts.push(expression)
        return this
    }

    andGroup(cb: (qb: ConditionBuilder) => void) {
        const nested = new ConditionBuilder(this.ctx)
        cb(nested)

        const built = nested.build()
        if (built) {
            this.parts.push(`(${built.replace(/^WHERE\s/, '')})`)
        }

        return this
    }

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