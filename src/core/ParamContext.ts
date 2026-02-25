import {Dialect} from "../dialects/Dialect";

/**
 * Manages parameters for SQL queries, ensuring proper dialect-specific placeholders.
 */
export default class ParamContext {
    private params: any[] = []

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
        return this.params
    }
}