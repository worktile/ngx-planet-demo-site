import { SandboxOptions } from './sandbox';
import { ProxySandbox } from './proxy/proxy-sandbox';
import { SnapshotSandbox } from './snapshot/snapshot-sandbox';
export { Sandbox } from './sandbox';
export declare function createSandbox(app: string, options?: SandboxOptions): ProxySandbox | SnapshotSandbox;
export declare function getSandboxInstance(): any;
//# sourceMappingURL=index.d.ts.map