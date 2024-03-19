import { Global } from '../types';
export interface ProxySandboxInstance {
    app: string;
    running: boolean;
    global: Global;
    rewriteVariables: PropertyKey[];
}
export interface SandboxPatchHandler {
    rewrite?: Record<PropertyKey, any>;
    init?: () => void;
    destroy?: () => void;
}
export type SandboxPatch = (sandbox?: ProxySandboxInstance) => SandboxPatchHandler;
//# sourceMappingURL=types.d.ts.map