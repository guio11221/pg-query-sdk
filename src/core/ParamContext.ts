import {Dialect} from "../dialects/Dialect";

export default class ParamContext {
    private params: any[] = []

    constructor(private dialect: Dialect) {}

    add(value: any) {
        this.params.push(value)
        return this.dialect.placeholder(this.params.length)
    }

    getParams() {
        return this.params
    }
}