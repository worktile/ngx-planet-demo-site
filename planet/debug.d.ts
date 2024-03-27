export interface Debugger {
    (formatter: any, ...args: any[]): void;
}
export interface Formatters {
    [formatter: string]: (v: any) => string;
}
export interface Debug {
    (namespace: string): Debugger;
    coerce: (val: any) => any;
    disable: () => string;
    enable: (namespaces: string) => void;
    enabled: (namespaces: string) => boolean;
    log: (...args: any[]) => any;
    names: RegExp[];
    skips: RegExp[];
    formatters: Formatters;
}
export declare function createDebug(namespace: string): Debugger;
export declare function setDebugFactory(debug: Debug): void;
export declare function clearDebugFactory(): void;
export declare function getDebugFactory(): Debug;
//# sourceMappingURL=debug.d.ts.map