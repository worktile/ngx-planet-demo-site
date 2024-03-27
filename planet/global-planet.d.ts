import { PlanetApplicationRef } from './application/planet-application-ref';
import { PlanetPortalApplication } from './application/portal-application';
import { PlanetApplicationLoader } from './application/planet-application-loader';
import { PlanetApplicationService } from './application/planet-application.service';
import { NgBootstrapAppModule, NgBootstrapOptions } from './application/ng-planet-application-ref';
export interface GlobalPlanet {
    apps: {
        [key: string]: PlanetApplicationRef;
    };
    portalApplication?: PlanetPortalApplication;
    applicationLoader: PlanetApplicationLoader;
    applicationService: PlanetApplicationService;
}
export declare const globalPlanet: GlobalPlanet;
export declare function defineApplication<TOptions extends NgBootstrapAppModule | NgBootstrapOptions>(name: string, options: TOptions): void;
export declare function getPlanetApplicationRef(appName: string): PlanetApplicationRef | null;
export declare function getBootstrappedPlanetApplicationRef(appName: string): PlanetApplicationRef | null;
export declare function setPortalApplicationData<T>(data: T): void;
export declare function getPortalApplicationData<TData>(): TData;
export declare function setApplicationLoader(loader: PlanetApplicationLoader): void;
export declare function getApplicationLoader(): PlanetApplicationLoader;
export declare function setApplicationService(service: PlanetApplicationService): void;
export declare function getApplicationService(): PlanetApplicationService;
export declare function clearGlobalPlanet(): void;
//# sourceMappingURL=global-planet.d.ts.map