import { InjectionToken } from '@angular/core';
import { Debug } from './debug';
export interface PlanetOptions {
    switchMode?: SwitchModes;
    errorHandler: (error: Error) => void;
    debugFactory?: Debug;
}
export interface PlanetApplication<TExtra = any> {
    name: string;
    hostParent: string | HTMLElement;
    /**
     * @deprecated please use new defineApplication to set selector
     */
    selector?: string;
    routerPathPrefix: string | RegExp;
    hostClass?: string | string[];
    preload?: boolean;
    sandbox?: boolean;
    switchMode?: SwitchModes;
    resourcePathPrefix?: string;
    stylePrefix?: string;
    styles?: string[];
    scripts?: string[];
    loadSerial?: boolean;
    themeStylesPath?: string;
    manifest?: string;
    extra?: TExtra;
}
export declare enum SwitchModes {
    default = "default",
    coexist = "coexist"
}
export interface PlanetRouterEvent {
    url: string;
}
declare const PLANET_APPLICATIONS: InjectionToken<PlanetApplication<any>>;
export { PLANET_APPLICATIONS };
//# sourceMappingURL=planet.class.d.ts.map