import { Router, UrlTree, NavigationExtras } from '@angular/router';
import { NgZone, Injector, ApplicationRef } from '@angular/core';
import { PlantComponentFactory } from '../component/planet-component-types';
import { GlobalEventDispatcher } from '../global-event-dispatcher';
export declare class PlanetPortalApplication<TData = any> {
    applicationRef?: ApplicationRef;
    injector?: Injector;
    router?: Router;
    ngZone?: NgZone;
    globalEventDispatcher?: GlobalEventDispatcher;
    data?: TData;
    name?: string;
    private componentFactory?;
    navigateByUrl(url: string | UrlTree, extras?: NavigationExtras): Promise<boolean>;
    run<T>(fn: (...args: any[]) => T): T;
    tick(): void;
    getComponentFactory(): PlantComponentFactory;
    registerComponentFactory(componentFactory: PlantComponentFactory): void;
}
//# sourceMappingURL=portal-application.d.ts.map