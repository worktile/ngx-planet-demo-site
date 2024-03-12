import { Global } from '../types';
import { Sandbox, SandboxOptions } from '../sandbox';
export declare class ProxySandbox extends Sandbox {
    app: string;
    options: SandboxOptions;
    running: boolean;
    global: Global;
    rewriteVariables: PropertyKey[];
    private patchHandlers;
    constructor(app: string, options: SandboxOptions);
    start(): void;
    destroy(): void;
    private getPatchRewriteVariables;
    private execPatchHandlers;
}
//# sourceMappingURL=proxy-sandbox.d.ts.map