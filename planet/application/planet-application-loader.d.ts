import { NgZone, ApplicationRef, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { AssetsLoader } from '../assets-loader';
import { PlanetApplication, PlanetRouterEvent, PlanetOptions } from '../planet.class';
import { PlanetApplicationRef } from './planet-application-ref';
import { PlanetApplicationService } from './planet-application.service';
import { Router } from '@angular/router';
import * as i0 from "@angular/core";
export declare enum ApplicationStatus {
    assetsLoading = 1,
    assetsLoaded = 2,
    bootstrapping = 3,
    bootstrapped = 4,
    active = 5,
    loadError = 10
}
export interface AppsLoadingStartEvent {
    shouldLoadApps: PlanetApplication[];
    shouldUnloadApps: PlanetApplication[];
}
export interface AppStatusChangeEvent {
    app: PlanetApplication;
    status: ApplicationStatus;
}
export declare class PlanetApplicationLoader {
    private assetsLoader;
    private planetApplicationService;
    private ngZone;
    private firstLoad;
    private startRouteChangeEvent;
    private options;
    private inProgressAppAssetsLoads;
    private appsStatus;
    private portalApp;
    private routeChange$;
    private appStatusChange$;
    private appsLoadingStart$;
    get appStatusChange(): Observable<AppStatusChangeEvent>;
    get appsLoadingStart(): Observable<AppsLoadingStartEvent>;
    loadingDone: boolean;
    constructor(assetsLoader: AssetsLoader, planetApplicationService: PlanetApplicationService, ngZone: NgZone, router: Router, injector: Injector, applicationRef: ApplicationRef);
    private setAppStatus;
    private getAppStatusChange$;
    private switchModeIsCoexist;
    private errorHandler;
    private setLoadingDone;
    private getAppNames;
    private setupRouteChange;
    private startLoadAppAssets;
    private hideApp;
    private showApp;
    private destroyApp;
    private bootstrapApp;
    private getUnloadApps;
    private unloadApps;
    private preloadApps;
    private ensurePreloadApps;
    setOptions(options: Partial<PlanetOptions>): void;
    /**
     * reset route by current router
     */
    reroute(event: PlanetRouterEvent): void;
    private preloadInternal;
    /**
     * Preload planet application
     * @param app app
     * @param immediate bootstrap on stable by default, setting immediate is true, it will bootstrap immediate
     */
    preload(app: PlanetApplication, immediate?: boolean): Observable<PlanetApplicationRef>;
    static ɵfac: i0.ɵɵFactoryDeclaration<PlanetApplicationLoader, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<PlanetApplicationLoader>;
}
//# sourceMappingURL=planet-application-loader.d.ts.map