import { AssetsTagItem } from './inner-types';
import { PlanetApplication } from './planet.class';
export declare function hashCode(str: string): number;
export declare function getHTMLElement(selector: string | HTMLElement): HTMLElement | null;
export declare function getTagNameByTemplate(template: string): string;
export declare function createElementByTemplate(template: string): HTMLElement;
export declare function coerceArray<T>(value: T | T[]): T[];
export declare function isEmpty(value: any): boolean;
export declare function isFunction(value: any): value is Function;
export declare function isObject<T extends object>(value: any): value is T;
/**
 * Get file name from path
 * 1. "main.js" => "main.js"
 * 2. "assets/scripts/main.js" => "main.js"
 * @param path path
 */
export declare function getResourceFileName(path: string): string;
export declare function getExtName(name: string): string;
/**
 * Build resource path by manifest
 * if manifest is { "main.js": "main.h2sh23abee.js"}
 * 1. "main.js" => "main.h2sh23abee.js"
 * 2. "assets/scripts/main.js" =>"assets/scripts/main.h2sh23abee.js"
 * @param resourceFilePath Resource File Path
 * @param manifestResult manifest
 */
export declare function buildResourceFilePath(resourceFilePath: string, manifestResult: Record<string, AssetsTagItem>): string;
export declare function buildFullPath(path: string, basePath?: string): string;
export declare function getAssetsBasePath(app: PlanetApplication): string;
export declare function toAssetsTagItem(src: string): AssetsTagItem;
export declare function toAssetsTagItems(src: string[]): AssetsTagItem[];
export declare function getScriptsAndStylesAssets(app: PlanetApplication, basePath: string, manifestResult?: Record<string, AssetsTagItem>): {
    scripts: AssetsTagItem[];
    styles: AssetsTagItem[];
};
//# sourceMappingURL=helpers.d.ts.map