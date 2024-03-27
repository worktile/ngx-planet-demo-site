import { Sandbox, SandboxOptions } from '../sandbox';
export declare class SnapshotSandbox extends Sandbox {
    app: string;
    options: SandboxOptions;
    constructor(app: string, options: SandboxOptions);
    start(): void;
    destroy(): void;
}
//# sourceMappingURL=snapshot-sandbox.d.ts.map