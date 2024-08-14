import { Global } from './types';
export interface SandboxOptions {
    strictGlobal?: boolean;
}
export declare abstract class Sandbox {
    options: SandboxOptions;
    global: Global;
    abstract start(): void;
    abstract destroy(): void;
    execScript(code: string, url?: string): void;
}
//# sourceMappingURL=sandbox.d.ts.map