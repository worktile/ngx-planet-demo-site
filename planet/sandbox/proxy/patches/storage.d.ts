import { ProxySandboxInstance, SandboxPatchHandler } from '../types';
export declare class RewriteStorage {
    prefix: string;
    rawStorage: Storage;
    constructor(app: string, rawStorage: Storage);
    get length(): number;
    private getKeys;
    key(n: number): string;
    getItem(key: string): string;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}
export declare function storagePatch(sandbox: ProxySandboxInstance): SandboxPatchHandler;
//# sourceMappingURL=storage.d.ts.map