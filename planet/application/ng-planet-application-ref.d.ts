import { ApplicationRef, NgModuleRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PlanetPortalApplication } from './portal-application';
import { PlantComponentConfig } from '../component/plant-component.config';
import { PlanetComponentRef } from '../component/planet-component-ref';
import { Sandbox } from '../sandbox/';
import { PlanetApplicationRef } from './planet-application-ref';
export type NgBootstrapAppModule = (portalApp: PlanetPortalApplication) => Promise<NgModuleRef<any> | void | ApplicationRef | undefined | null>;
export interface NgBootstrapOptions {
    template: string;
    bootstrap: NgBootstrapAppModule;
}
/**
 * @deprecated please use NgBootstrapAppModule
 */
export type BootstrapAppModule = NgBootstrapAppModule;
/**
 * @deprecated please use NgBootstrapOptions
 */
export interface BootstrapOptions extends NgBootstrapOptions {
}
export type PlantComponentFactory = <TData, TComp>(componentName: string, config: PlantComponentConfig<TData>) => PlanetComponentRef<TComp>;
export declare class NgPlanetApplicationRef implements PlanetApplicationRef {
    private injector?;
    private appRef?;
    appModuleRef?: NgModuleRef<any>;
    template?: string;
    private innerSelector?;
    private name;
    private portalApp;
    private appModuleBootstrap?;
    private componentFactory?;
    get selector(): string;
    get ngZone(): NgZone | undefined;
    get sandbox(): Sandbox;
    get bootstrapped(): boolean;
    constructor(name: string, options?: BootstrapOptions);
    private syncPortalRouteWhenNavigationEnd;
    bootstrap(app: PlanetPortalApplication): Observable<this>;
    getRouter(): Router;
    getCurrentRouterStateUrl(): string;
    navigateByUrl(url: string): void;
    getComponentFactory(): PlantComponentFactory;
    registerComponentFactory(componentFactory: PlantComponentFactory): void;
    destroy(): void;
}
//# sourceMappingURL=ng-planet-application-ref.d.ts.map