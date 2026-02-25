export interface Dialect {
    placeholder(index: number): string
    wrapIdentifier(identifier: string): string
}