import { PlanetApplication } from '../planet.class';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetsLoader } from '../assets-loader';
import * as i0 from "@angular/core";
export declare class PlanetApplicationService {
    private http;
    private assetsLoader;
    private apps;
    private appsMap;
    constructor(http: HttpClient, assetsLoader: AssetsLoader);
    register<TExtra>(appOrApps: PlanetApplication<TExtra> | PlanetApplication<TExtra>[]): void;
    registerByUrl(url: string): Observable<void>;
    unregister(name: string): void;
    getAppsByMatchedUrl<TExtra = unknown>(url: string): PlanetApplication<TExtra>[];
    getAppByName(name: string): PlanetApplication<any>;
    getAppsToPreload(excludeAppNames?: string[]): PlanetApplication<any>[];
    getApps(): PlanetApplication<any>[];
    static ɵfac: i0.ɵɵFactoryDeclaration<PlanetApplicationService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<PlanetApplicationService>;
}
//# sourceMappingURL=planet-application.service.d.ts.map