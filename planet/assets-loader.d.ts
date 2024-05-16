import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PlanetApplication } from './planet.class';
import { AssetsTagItem, ScriptTagAttributes } from './inner-types';
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
    loadScript(src: string, tagAttributes?: ScriptTagAttributes): Observable<AssetsLoadResult>;
    loadScriptWithSandbox(app: string, src: string): Observable<AssetsLoadResult>;
    loadStyle(src: string): Observable<AssetsLoadResult>;
    loadScripts(sources: AssetsTagItem[], options?: {
        app?: string;
        sandbox?: boolean;
        serial?: boolean;
    }): Observable<AssetsLoadResult[]>;
    loadStyles(sources: AssetsTagItem[]): Observable<AssetsLoadResult[]>;
    loadScriptsAndStyles(scripts?: AssetsTagItem[], styles?: AssetsTagItem[], options?: {
        app?: string;
        sandbox?: boolean;
        serial?: boolean;
    }): Observable<[AssetsLoadResult[], AssetsLoadResult[]]>;
    /**
     * <script type="module" src="http://127.0.0.1:3001/main.js" async defer></script>
     * => [`type="module"`, "async ", "defer>"] as attributeStrMatchArr
     * => { type: "module", async: "async", defer: "defer" } as attributes
     */
    parseTagAttributes(tag: string): Record<string, string>;
    parseManifestFromHTML(html: string): Record<string, AssetsTagItem>;
    loadAppAssets(app: PlanetApplication): Observable<[AssetsLoadResult[], AssetsLoadResult[]]>;
    loadManifest(url: string, responseType?: 'text' | 'json'): Observable<Record<string, AssetsTagItem>>;
    static ɵfac: i0.ɵɵFactoryDeclaration<AssetsLoader, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<AssetsLoader>;
}
//# sourceMappingURL=assets-loader.d.ts.map