import ParamContext from "../core/ParamContext";

export default class ConditionBuilder {
    private conditions: string[] = []

    constructor(private ctx: ParamContext) {}

    where(obj: Record<string, any>) {
        Object.entries(obj).forEach(([key, value]) => {
            const placeholder = this.ctx.add(value)
            this.conditions.push(`${key} = ${placeholder}`)
        })
        return this
    }

    raw(expression: string) {
        this.conditions.push(expression)
        return this
    }

    andGroup(callback: (qb: ConditionBuilder) => void) {
        const nested = new ConditionBuilder(this.ctx)
        callback(nested)
        const built = nested.build()
        if (built) {
            this.conditions.push(`(${built.replace(/^WHERE /, '')})`)
        }
        return this
    }

    orGroup(callback: (qb: ConditionBuilder) => void) {
        const nested = new ConditionBuilder(this.ctx)
        callback(nested)
        const built = nested.build()
        if (built) {
            this.conditions.push(`OR (${built.replace(/^WHERE /, '')})`)
        }
        return this
    }

    build(prefix = 'WHERE') {
        if (!this.conditions.length) return ''
        return `${prefix} ${this.conditions.join(' AND ')}`
    }
}