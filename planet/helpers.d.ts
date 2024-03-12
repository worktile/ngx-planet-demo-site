import { PlanetApplication } from './planet.class';
export declare function hashCode(str: string): number;
export declare function getHTMLElement(selector: string | HTMLElement): HTMLElement | null;
export declare function getTagNameByTemplate(template: string): string;
export declare function createElementByTemplate(template: string): HTMLElement;
export declare function coerceArray<T>(value: T | T[]): T[];
export declare function isEmpty(value: any): boolean;
export declare function isFunction(value: any): value is Function;
export declare function isObject(val: any): boolean;
/**
 * Get file name from path
 * 1. "main.js" => "main.js"
 * 2. "assets/scripts/main.js" => "main.js"
 * @param path path
 */
export declare function getResourceFileName(path: string): string;
/**
 * Build resource path by manifest
 * if manifest is { "main.js": "main.h2sh23abee.js"}
 * 1. "main.js" => "main.h2sh23abee.js"
 * 2. "assets/scripts/main.js" =>"assets/scripts/main.h2sh23abee.js"
 * @param resourceFilePath Resource File Path
 * @param manifestResult manifest
 */
export declare function buildResourceFilePath(resourceFilePath: string, manifestResult: {
    [key: string]: string;
}): string;
/**
 * Get static resource full path
 * @param app PlanetApplication
 * @param manifestResult manifest
 */
export declare function getScriptsAndStylesFullPaths(app: PlanetApplication, manifestResult?: {
    [key: string]: string;
}): {
    scripts: string[];
    styles: string[];
};
//# sourceMappingURL=helpers.d.ts.map