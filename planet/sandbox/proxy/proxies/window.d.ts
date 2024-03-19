import { ProxySandboxInstance } from '../types';
export declare class ProxyWindow {
    private sandbox;
    constructor(sandbox: ProxySandboxInstance);
    private definedVariables;
    private createGetter;
    private createSetter;
    private createDefineProperty;
    private createDeleteProperty;
    private createHas;
    create(): any;
}
//# sourceMappingURL=window.d.ts.map