import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PlanetApplication } from './planet.class';
import * as i0 from "@angular/core";
export interface AssetsLoadResult {
    src: string;
    hashCode: number;
    loaded: boolean;
    status: string;
}
export declare class AssetsLoader {
    private http;
    private loadedSources;
    constructor(http: HttpClient);
    loadScript(src: string): Observable<AssetsLoadResult>;
    loadScriptWithSandbox(app: string, src: string): Observable<AssetsLoadResult>;
    loadStyle(src: string): Observable<AssetsLoadResult>;
    loadScripts(sources: string[], options?: {
        app?: string;
        sandbox?: boolean;
        serial?: boolean;
    }): Observable<AssetsLoadResult[]>;
    loadStyles(sources: string[]): Observable<AssetsLoadResult[]>;
    loadScriptsAndStyles(scripts?: string[], styles?: string[], options?: {
        app?: string;
        sandbox?: boolean;
        serial?: boolean;
    }): Observable<[AssetsLoadResult[], AssetsLoadResult[]]>;
    loadAppAssets(app: PlanetApplication): Observable<[AssetsLoadResult[], AssetsLoadResult[]]>;
    loadManifest(url: string): Observable<{
        [key: string]: string;
    }>;
    static ɵfac: i0.ɵɵFactoryDeclaration<AssetsLoader, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<AssetsLoader>;
}
//# sourceMappingURL=assets-loader.d.ts.map