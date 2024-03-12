import { Injector } from '@angular/core';
import { Router } from '@angular/router';
import { PlanetOptions, PlanetApplication } from './planet.class';
import { AppsLoadingStartEvent, AppStatusChangeEvent } from './application/planet-application-loader';
import { Observable } from 'rxjs';
import * as i0 from "@angular/core";
export declare class Planet {
    private injector;
    private router;
    private get planetApplicationLoader();
    private get planetApplicationService();
    get loadingDone(): boolean;
    get appStatusChange(): Observable<AppStatusChangeEvent>;
    get appsLoadingStart(): Observable<AppsLoadingStartEvent>;
    private subscription?;
    constructor(injector: Injector, router: Router, planetApplications: PlanetApplication[]);
    setOptions(options: Partial<PlanetOptions>): void;
    setPortalAppData<T>(data: T): void;
    registerApp<TExtra>(app: PlanetApplication<TExtra>): void;
    registerApps<TExtra>(apps: PlanetApplication<TExtra>[]): void;
    unregisterApp(name: string): void;
    getApps(): PlanetApplication<any>[];
    start(): void;
    stop(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<Planet, [null, null, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<Planet>;
}
//# sourceMappingURL=planet.d.ts.map