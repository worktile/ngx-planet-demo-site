const ELEMENT_NODE_TYPE = 1;
export function hashCode(str) {
    let hash = 0;
    let chr;
    if (str.length === 0) {
        return hash;
    }
    for (let i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
export function getHTMLElement(selector) {
    if (selector instanceof HTMLElement) {
        return selector;
    }
    else {
        return document.querySelector(selector);
    }
}
export function getTagNameByTemplate(template) {
    const element = createElementByTemplate(template);
    return element ? element.nodeName : '';
}
export function createElementByTemplate(template) {
    if (!template) {
        return null;
    }
    const element = document.createRange().createContextualFragment(template).firstChild;
    if (element && element.nodeType === ELEMENT_NODE_TYPE) {
        return element;
    }
    else {
        throw new Error(`invalid template '${template}'`);
    }
}
export function coerceArray(value) {
    return Array.isArray(value) ? value : [value];
}
export function isEmpty(value) {
    if (!value || value.length === 0) {
        return true;
    }
    else {
        return false;
    }
}
export function isFunction(value) {
    const type = typeof value;
    return !!value && type === 'function';
}
export function isObject(value) {
    return value && typeof value === 'object';
}
/**
 * Get file name from path
 * 1. "main.js" => "main.js"
 * 2. "assets/scripts/main.js" => "main.js"
 * @param path path
 */
export function getResourceFileName(path) {
    const lastSlashIndex = path.lastIndexOf('/');
    if (lastSlashIndex >= 0) {
        return path.slice(lastSlashIndex + 1);
    }
    else {
        return path;
    }
}
export function getExtName(name) {
    const lastDotIndex = name.lastIndexOf('.');
    if (lastDotIndex >= 0) {
        return name.slice(lastDotIndex + 1);
    }
    else {
        return '';
    }
}
/**
 * Build resource path by manifest
 * if manifest is { "main.js": "main.h2sh23abee.js"}
 * 1. "main.js" => "main.h2sh23abee.js"
 * 2. "assets/scripts/main.js" =>"assets/scripts/main.h2sh23abee.js"
 * @param resourceFilePath Resource File Path
 * @param manifestResult manifest
 */
export function buildResourceFilePath(resourceFilePath, manifestResult) {
    const fileName = getResourceFileName(resourceFilePath);
    if (manifestResult[fileName]) {
        return resourceFilePath.replace(fileName, manifestResult[fileName].src);
    }
    else {
        return resourceFilePath;
    }
}
export function buildFullPath(path, basePath) {
    if (basePath) {
        if (path.startsWith(basePath)) {
            return path;
        }
        else {
            return `${basePath}${path}`;
        }
    }
    return path;
}
function getDefinedAssets(app) {
    if (app.entry) {
        return {
            scripts: isObject(app.entry) ? app.entry.scripts : undefined,
            styles: isObject(app.entry) ? app.entry.styles : undefined
        };
    }
    return {
        scripts: app.scripts,
        styles: app.styles
    };
}
export function getAssetsBasePath(app) {
    let basePath;
    if (app.entry) {
        if (isObject(app.entry)) {
            basePath = app.entry.basePath;
        }
        else {
            const lastDotIndex = app.entry.lastIndexOf('/');
            basePath = lastDotIndex > 0 ? app.entry.slice(0, lastDotIndex + 1) : undefined;
        }
    }
    return basePath || app.resourcePathPrefix;
}
function getAssetsByDefined(definedPaths, manifest, ext) {
    if (definedPaths) {
        return definedPaths.map(definedPath => {
            const fileName = getResourceFileName(definedPath);
            const assetsTagItem = manifest[fileName];
            return {
                ...assetsTagItem,
                src: definedPath.replace(fileName, assetsTagItem.src)
            };
        });
    }
    else {
        return Object.keys(manifest)
            .filter(key => {
            return getExtName(key) === ext;
        })
            .map(key => {
            return manifest[key];
        });
    }
}
export function toAssetsTagItem(src) {
    return {
        src: src
    };
}
export function toAssetsTagItems(src) {
    return src.map(item => toAssetsTagItem(item));
}
export function getScriptsAndStylesAssets(app, basePath, manifestResult) {
    const result = { scripts: [], styles: [] };
    let { scripts, styles } = getDefinedAssets(app);
    // combine resource path by manifest
    if (manifestResult) {
        result.scripts = getAssetsByDefined(scripts, manifestResult, 'js');
        result.styles = getAssetsByDefined(styles, manifestResult, 'css');
    }
    else {
        result.scripts = toAssetsTagItems(scripts);
        result.styles = toAssetsTagItems(styles);
    }
    if (basePath) {
        result.scripts.forEach(item => {
            item.src = buildFullPath(item.src, basePath);
        });
        result.styles.forEach(item => {
            item.src = buildFullPath(item.src, basePath);
        });
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3BhY2thZ2VzL3BsYW5ldC9zcmMvaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUU1QixNQUFNLFVBQVUsUUFBUSxDQUFDLEdBQVc7SUFDaEMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsSUFBSSxHQUFXLENBQUM7SUFDaEIsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ25CLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ2xDLEdBQUcsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQywyQkFBMkI7SUFDMUMsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLFFBQThCO0lBQ3pELElBQUksUUFBUSxZQUFZLFdBQVcsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7U0FBTSxDQUFDO1FBQ0osT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLENBQUM7QUFDTCxDQUFDO0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLFFBQWdCO0lBQ2pELE1BQU0sT0FBTyxHQUFHLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2xELE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDM0MsQ0FBQztBQUVELE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxRQUFnQjtJQUNwRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDWixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0QsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDLFVBQVUsQ0FBQztJQUNyRixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLGlCQUFpQixFQUFFLENBQUM7UUFDcEQsT0FBTyxPQUFzQixDQUFDO0lBQ2xDLENBQUM7U0FBTSxDQUFDO1FBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsUUFBUSxHQUFHLENBQUMsQ0FBQztJQUN0RCxDQUFDO0FBQ0wsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUksS0FBYztJQUN6QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQsTUFBTSxVQUFVLE9BQU8sQ0FBQyxLQUFVO0lBQzlCLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUMvQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO1NBQU0sQ0FBQztRQUNKLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7QUFDTCxDQUFDO0FBRUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxLQUFVO0lBQ2pDLE1BQU0sSUFBSSxHQUFHLE9BQU8sS0FBSyxDQUFDO0lBQzFCLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLEtBQUssVUFBVSxDQUFDO0FBQzFDLENBQUM7QUFFRCxNQUFNLFVBQVUsUUFBUSxDQUFtQixLQUFVO0lBQ2pELE9BQU8sS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQztBQUM5QyxDQUFDO0FBQ0Q7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsSUFBWTtJQUM1QyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzdDLElBQUksY0FBYyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDMUMsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0FBQ0wsQ0FBQztBQUVELE1BQU0sVUFBVSxVQUFVLENBQUMsSUFBWTtJQUNuQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzNDLElBQUksWUFBWSxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDeEMsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLEVBQUUsQ0FBQztJQUNkLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxnQkFBd0IsRUFBRSxjQUE2QztJQUN6RyxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZELElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDM0IsT0FBTyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1RSxDQUFDO1NBQU0sQ0FBQztRQUNKLE9BQU8sZ0JBQWdCLENBQUM7SUFDNUIsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLFVBQVUsYUFBYSxDQUFDLElBQVksRUFBRSxRQUFpQjtJQUN6RCxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ1gsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDNUIsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLEdBQUcsUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDO1FBQ2hDLENBQUM7SUFDTCxDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsR0FBc0I7SUFDNUMsSUFBSSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWixPQUFPO1lBQ0gsT0FBTyxFQUFFLFFBQVEsQ0FBeUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztZQUNwRixNQUFNLEVBQUUsUUFBUSxDQUF5QixHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTO1NBQ3JGLENBQUM7SUFDTixDQUFDO0lBQ0QsT0FBTztRQUNILE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTztRQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU07S0FDckIsQ0FBQztBQUNOLENBQUM7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsR0FBc0I7SUFDcEQsSUFBSSxRQUFnQixDQUFDO0lBQ3JCLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ1osSUFBSSxRQUFRLENBQXlCLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzlDLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUNsQyxDQUFDO2FBQU0sQ0FBQztZQUNKLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELFFBQVEsR0FBRyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDbkYsQ0FBQztJQUNMLENBQUM7SUFDRCxPQUFPLFFBQVEsSUFBSSxHQUFHLENBQUMsa0JBQWtCLENBQUM7QUFDOUMsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsWUFBc0IsRUFBRSxRQUF1QyxFQUFFLEdBQWlCO0lBQzFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFDZixPQUFPLFlBQVksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDbEMsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDbEQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pDLE9BQU87Z0JBQ0gsR0FBRyxhQUFhO2dCQUNoQixHQUFHLEVBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQzthQUN4RCxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO1NBQU0sQ0FBQztRQUNKLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7YUFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ1YsT0FBTyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDO1FBQ25DLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNQLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEdBQVc7SUFDdkMsT0FBTztRQUNILEdBQUcsRUFBRSxHQUFHO0tBQ1gsQ0FBQztBQUNOLENBQUM7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsR0FBYTtJQUMxQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxHQUFzQixFQUN0QixRQUFnQixFQUNoQixjQUE4QztJQUU5QyxNQUFNLE1BQU0sR0FBMEQsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUNsRyxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hELG9DQUFvQztJQUNwQyxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuRSxNQUFNLENBQUMsTUFBTSxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdEUsQ0FBQztTQUFNLENBQUM7UUFDSixNQUFNLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUNELElBQUksUUFBUSxFQUFFLENBQUM7UUFDWCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMxQixJQUFJLENBQUMsR0FBRyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDekIsSUFBSSxDQUFDLEdBQUcsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXNzZXRzVGFnSXRlbSB9IGZyb20gJy4vaW5uZXItdHlwZXMnO1xuaW1wb3J0IHsgUGxhbmV0QXBwbGljYXRpb24sIFBsYW5ldEFwcGxpY2F0aW9uRW50cnkgfSBmcm9tICcuL3BsYW5ldC5jbGFzcyc7XG5cbmNvbnN0IEVMRU1FTlRfTk9ERV9UWVBFID0gMTtcblxuZXhwb3J0IGZ1bmN0aW9uIGhhc2hDb2RlKHN0cjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBsZXQgaGFzaCA9IDA7XG4gICAgbGV0IGNocjogbnVtYmVyO1xuICAgIGlmIChzdHIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBoYXNoO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICBjaHIgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgICAgaGFzaCA9IChoYXNoIDw8IDUpIC0gaGFzaCArIGNocjtcbiAgICAgICAgaGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcbiAgICB9XG4gICAgcmV0dXJuIGhhc2g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRIVE1MRWxlbWVudChzZWxlY3Rvcjogc3RyaW5nIHwgSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgIGlmIChzZWxlY3RvciBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBzZWxlY3RvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGFnTmFtZUJ5VGVtcGxhdGUodGVtcGxhdGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgZWxlbWVudCA9IGNyZWF0ZUVsZW1lbnRCeVRlbXBsYXRlKHRlbXBsYXRlKTtcbiAgICByZXR1cm4gZWxlbWVudCA/IGVsZW1lbnQubm9kZU5hbWUgOiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnRCeVRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcpIHtcbiAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKS5jcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQodGVtcGxhdGUpLmZpcnN0Q2hpbGQ7XG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PT0gRUxFTUVOVF9OT0RFX1RZUEUpIHtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHRlbXBsYXRlICcke3RlbXBsYXRlfSdgKTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2VyY2VBcnJheTxUPih2YWx1ZTogVCB8IFRbXSk6IFRbXSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiBbdmFsdWVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKCF2YWx1ZSB8fCB2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWU6IGFueSk6IHZhbHVlIGlzIEZ1bmN0aW9uIHtcbiAgICBjb25zdCB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICAgIHJldHVybiAhIXZhbHVlICYmIHR5cGUgPT09ICdmdW5jdGlvbic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc09iamVjdDxUIGV4dGVuZHMgb2JqZWN0Pih2YWx1ZTogYW55KTogdmFsdWUgaXMgVCB7XG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCc7XG59XG4vKipcbiAqIEdldCBmaWxlIG5hbWUgZnJvbSBwYXRoXG4gKiAxLiBcIm1haW4uanNcIiA9PiBcIm1haW4uanNcIlxuICogMi4gXCJhc3NldHMvc2NyaXB0cy9tYWluLmpzXCIgPT4gXCJtYWluLmpzXCJcbiAqIEBwYXJhbSBwYXRoIHBhdGhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJlc291cmNlRmlsZU5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBsYXN0U2xhc2hJbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy8nKTtcbiAgICBpZiAobGFzdFNsYXNoSW5kZXggPj0gMCkge1xuICAgICAgICByZXR1cm4gcGF0aC5zbGljZShsYXN0U2xhc2hJbmRleCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4dE5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbGFzdERvdEluZGV4ID0gbmFtZS5sYXN0SW5kZXhPZignLicpO1xuICAgIGlmIChsYXN0RG90SW5kZXggPj0gMCkge1xuICAgICAgICByZXR1cm4gbmFtZS5zbGljZShsYXN0RG90SW5kZXggKyAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG4vKipcbiAqIEJ1aWxkIHJlc291cmNlIHBhdGggYnkgbWFuaWZlc3RcbiAqIGlmIG1hbmlmZXN0IGlzIHsgXCJtYWluLmpzXCI6IFwibWFpbi5oMnNoMjNhYmVlLmpzXCJ9XG4gKiAxLiBcIm1haW4uanNcIiA9PiBcIm1haW4uaDJzaDIzYWJlZS5qc1wiXG4gKiAyLiBcImFzc2V0cy9zY3JpcHRzL21haW4uanNcIiA9PlwiYXNzZXRzL3NjcmlwdHMvbWFpbi5oMnNoMjNhYmVlLmpzXCJcbiAqIEBwYXJhbSByZXNvdXJjZUZpbGVQYXRoIFJlc291cmNlIEZpbGUgUGF0aFxuICogQHBhcmFtIG1hbmlmZXN0UmVzdWx0IG1hbmlmZXN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFJlc291cmNlRmlsZVBhdGgocmVzb3VyY2VGaWxlUGF0aDogc3RyaW5nLCBtYW5pZmVzdFJlc3VsdDogUmVjb3JkPHN0cmluZywgQXNzZXRzVGFnSXRlbT4pIHtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGdldFJlc291cmNlRmlsZU5hbWUocmVzb3VyY2VGaWxlUGF0aCk7XG4gICAgaWYgKG1hbmlmZXN0UmVzdWx0W2ZpbGVOYW1lXSkge1xuICAgICAgICByZXR1cm4gcmVzb3VyY2VGaWxlUGF0aC5yZXBsYWNlKGZpbGVOYW1lLCBtYW5pZmVzdFJlc3VsdFtmaWxlTmFtZV0uc3JjKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcmVzb3VyY2VGaWxlUGF0aDtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZ1bGxQYXRoKHBhdGg6IHN0cmluZywgYmFzZVBhdGg/OiBzdHJpbmcpIHtcbiAgICBpZiAoYmFzZVBhdGgpIHtcbiAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aChiYXNlUGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGAke2Jhc2VQYXRofSR7cGF0aH1gO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXRoO1xufVxuXG5mdW5jdGlvbiBnZXREZWZpbmVkQXNzZXRzKGFwcDogUGxhbmV0QXBwbGljYXRpb24pIHtcbiAgICBpZiAoYXBwLmVudHJ5KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY3JpcHRzOiBpc09iamVjdDxQbGFuZXRBcHBsaWNhdGlvbkVudHJ5PihhcHAuZW50cnkpID8gYXBwLmVudHJ5LnNjcmlwdHMgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBzdHlsZXM6IGlzT2JqZWN0PFBsYW5ldEFwcGxpY2F0aW9uRW50cnk+KGFwcC5lbnRyeSkgPyBhcHAuZW50cnkuc3R5bGVzIDogdW5kZWZpbmVkXG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHNjcmlwdHM6IGFwcC5zY3JpcHRzLFxuICAgICAgICBzdHlsZXM6IGFwcC5zdHlsZXNcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXNzZXRzQmFzZVBhdGgoYXBwOiBQbGFuZXRBcHBsaWNhdGlvbik6IHN0cmluZyB7XG4gICAgbGV0IGJhc2VQYXRoOiBzdHJpbmc7XG4gICAgaWYgKGFwcC5lbnRyeSkge1xuICAgICAgICBpZiAoaXNPYmplY3Q8UGxhbmV0QXBwbGljYXRpb25FbnRyeT4oYXBwLmVudHJ5KSkge1xuICAgICAgICAgICAgYmFzZVBhdGggPSBhcHAuZW50cnkuYmFzZVBhdGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0RG90SW5kZXggPSBhcHAuZW50cnkubGFzdEluZGV4T2YoJy8nKTtcbiAgICAgICAgICAgIGJhc2VQYXRoID0gbGFzdERvdEluZGV4ID4gMCA/IGFwcC5lbnRyeS5zbGljZSgwLCBsYXN0RG90SW5kZXggKyAxKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYmFzZVBhdGggfHwgYXBwLnJlc291cmNlUGF0aFByZWZpeDtcbn1cblxuZnVuY3Rpb24gZ2V0QXNzZXRzQnlEZWZpbmVkKGRlZmluZWRQYXRoczogc3RyaW5nW10sIG1hbmlmZXN0OiBSZWNvcmQ8c3RyaW5nLCBBc3NldHNUYWdJdGVtPiwgZXh0OiAnanMnIHwgJ2NzcycpOiBBc3NldHNUYWdJdGVtW10ge1xuICAgIGlmIChkZWZpbmVkUGF0aHMpIHtcbiAgICAgICAgcmV0dXJuIGRlZmluZWRQYXRocy5tYXAoZGVmaW5lZFBhdGggPT4ge1xuICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBnZXRSZXNvdXJjZUZpbGVOYW1lKGRlZmluZWRQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0c1RhZ0l0ZW0gPSBtYW5pZmVzdFtmaWxlTmFtZV07XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLmFzc2V0c1RhZ0l0ZW0sXG4gICAgICAgICAgICAgICAgc3JjOiBkZWZpbmVkUGF0aC5yZXBsYWNlKGZpbGVOYW1lLCBhc3NldHNUYWdJdGVtLnNyYylcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhtYW5pZmVzdClcbiAgICAgICAgICAgIC5maWx0ZXIoa2V5ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RXh0TmFtZShrZXkpID09PSBleHQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm1hcChrZXkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYW5pZmVzdFtrZXldO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9Bc3NldHNUYWdJdGVtKHNyYzogc3RyaW5nKTogQXNzZXRzVGFnSXRlbSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3JjOiBzcmNcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9Bc3NldHNUYWdJdGVtcyhzcmM6IHN0cmluZ1tdKTogQXNzZXRzVGFnSXRlbVtdIHtcbiAgICByZXR1cm4gc3JjLm1hcChpdGVtID0+IHRvQXNzZXRzVGFnSXRlbShpdGVtKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTY3JpcHRzQW5kU3R5bGVzQXNzZXRzKFxuICAgIGFwcDogUGxhbmV0QXBwbGljYXRpb24sXG4gICAgYmFzZVBhdGg6IHN0cmluZyxcbiAgICBtYW5pZmVzdFJlc3VsdD86IFJlY29yZDxzdHJpbmcsIEFzc2V0c1RhZ0l0ZW0+XG4pOiB7IHNjcmlwdHM6IEFzc2V0c1RhZ0l0ZW1bXTsgc3R5bGVzOiBBc3NldHNUYWdJdGVtW10gfSB7XG4gICAgY29uc3QgcmVzdWx0OiB7IHNjcmlwdHM6IEFzc2V0c1RhZ0l0ZW1bXTsgc3R5bGVzOiBBc3NldHNUYWdJdGVtW10gfSA9IHsgc2NyaXB0czogW10sIHN0eWxlczogW10gfTtcbiAgICBsZXQgeyBzY3JpcHRzLCBzdHlsZXMgfSA9IGdldERlZmluZWRBc3NldHMoYXBwKTtcbiAgICAvLyBjb21iaW5lIHJlc291cmNlIHBhdGggYnkgbWFuaWZlc3RcbiAgICBpZiAobWFuaWZlc3RSZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0LnNjcmlwdHMgPSBnZXRBc3NldHNCeURlZmluZWQoc2NyaXB0cywgbWFuaWZlc3RSZXN1bHQsICdqcycpO1xuICAgICAgICByZXN1bHQuc3R5bGVzID0gZ2V0QXNzZXRzQnlEZWZpbmVkKHN0eWxlcywgbWFuaWZlc3RSZXN1bHQsICdjc3MnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQuc2NyaXB0cyA9IHRvQXNzZXRzVGFnSXRlbXMoc2NyaXB0cyk7XG4gICAgICAgIHJlc3VsdC5zdHlsZXMgPSB0b0Fzc2V0c1RhZ0l0ZW1zKHN0eWxlcyk7XG4gICAgfVxuICAgIGlmIChiYXNlUGF0aCkge1xuICAgICAgICByZXN1bHQuc2NyaXB0cy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgaXRlbS5zcmMgPSBidWlsZEZ1bGxQYXRoKGl0ZW0uc3JjLCBiYXNlUGF0aCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXN1bHQuc3R5bGVzLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICBpdGVtLnNyYyA9IGJ1aWxkRnVsbFBhdGgoaXRlbS5zcmMsIGJhc2VQYXRoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG4iXX0=