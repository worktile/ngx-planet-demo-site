import { ApplicationRef, NgModuleRef, NgZone, Type } from '@angular/core';
import { PlanetComponentRef } from './planet-component-ref';
import { PlantComponentConfig } from './plant-component.config';
import { Observable } from 'rxjs';
import * as i0 from "@angular/core";
export type PlanetComponent<T = unknown> = {
    name: string;
    component: Type<T>;
} | Type<T>;
export declare class PlanetComponentLoader {
    private applicationRef;
    private ngModuleRef;
    private ngZone;
    private document;
    private get applicationLoader();
    private get applicationService();
    constructor(applicationRef: ApplicationRef, ngModuleRef: NgModuleRef<any>, ngZone: NgZone, document: any);
    private getPlantAppRef;
    private createInjector;
    private getContainerElement;
    private insertComponentRootNodeToContainer;
    private attachComponent;
    /** Gets the root HTMLElement for an instantiated component. */
    private getComponentRootNode;
    private registerComponentFactory;
    register(components: PlanetComponent | PlanetComponent[]): void;
    load<TComp = unknown, TData = unknown>(app: string, componentName: string, config: PlantComponentConfig<TData>): Observable<PlanetComponentRef<TComp>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<PlanetComponentLoader, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<PlanetComponentLoader>;
}
//# sourceMappingURL=planet-component-loader.d.ts.map