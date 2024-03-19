export interface ScriptTagAttributes {
    type: 'module' | 'text/script' | undefined;
    async?: string;
    defer?: string;
}
export interface StyleTagAttributes {
}
export interface AssetsTagItem {
    src: string;
    attributes?: ScriptTagAttributes | StyleTagAttributes;
}
//# sourceMappingURL=inner-types.d.ts.map