import {Dialect} from "../dialects/Dialect";

type SQLParam = string | number | boolean | Date | null | Buffer | any[]

/**
 * Manages parameters for SQL queries, ensuring proper dialect-specific placeholders.
 */
export default class ParamContext {
    private params: SQLParam[] = []

    /**
     * Creates an instance of ParamContext.
     * @param dialect - The dialect to use for generating parameter placeholders.
     */
    constructor(private dialect: Dialect) {
    }

    /**
     * Adds a value to the parameter list and returns its dialect-specific placeholder.
     * @param value - The value to add.
     * @returns The placeholder string for the added parameter.
     */
    add(value: any) {
        this.params.push(value)
        return this.dialect.placeholder(this.params.length)
    }

    /**
     * Retrieves the list of accumulated parameters.
     * @returns An array of parameters.
     */
    getParams() {
        return Object.freeze([...this.params])
    }

    clone(): ParamContext {
        const ctx = new ParamContext(this.dialect)
        ctx.params = [...this.params]
        return ctx
    }
}