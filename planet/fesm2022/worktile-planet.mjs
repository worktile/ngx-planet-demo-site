import * as i0 from '@angular/core';
import { InjectionToken, Injectable, NgZone, NgModuleRef, signal, Inject, Optional, Component, ChangeDetectionStrategy, Injector, createComponent, reflectComponentType, EventEmitter, Directive, Input, Output, inject, NgModule } from '@angular/core';
import * as i3 from '@angular/router';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import * as i1 from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { map, concatAll, switchMap, take, shareReplay, filter, distinctUntilChanged, catchError, tap, share, startWith, delayWhen, takeUntil } from 'rxjs/operators';
import { Observable, of, concat, forkJoin, from, Subject, timer } from 'rxjs';
import { DOCUMENT } from '@angular/common';

var SwitchModes;
(function (SwitchModes) {
    SwitchModes["default"] = "default";
    SwitchModes["coexist"] = "coexist";
})(SwitchModes || (SwitchModes = {}));
const PLANET_APPLICATIONS = new InjectionToken('PLANET_APPLICATIONS');

const ELEMENT_NODE_TYPE = 1;
function hashCode(str) {
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
function getHTMLElement(selector) {
    if (selector instanceof HTMLElement) {
        return selector;
    }
    else {
        return document.querySelector(selector);
    }
}
function getTagNameByTemplate(template) {
    const element = createElementByTemplate(template);
    return element ? element.nodeName : '';
}
function createElementByTemplate(template) {
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
function coerceArray(value) {
    return Array.isArray(value) ? value : [value];
}
function isEmpty(value) {
    if (!value || value.length === 0) {
        return true;
    }
    else {
        return false;
    }
}
function isFunction(value) {
    const type = typeof value;
    return !!value && type === 'function';
}
function isObject(value) {
    return value && typeof value === 'object';
}
/**
 * Get file name from path
 * 1. "main.js" => "main.js"
 * 2. "assets/scripts/main.js" => "main.js"
 * @param path path
 */
function getResourceFileName(path) {
    const lastSlashIndex = path.lastIndexOf('/');
    if (lastSlashIndex >= 0) {
        return path.slice(lastSlashIndex + 1);
    }
    else {
        return path;
    }
}
function getExtName(name) {
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
function buildResourceFilePath(resourceFilePath, manifestResult) {
    const fileName = getResourceFileName(resourceFilePath);
    if (manifestResult[fileName]) {
        return resourceFilePath.replace(fileName, manifestResult[fileName].src);
    }
    else {
        return resourceFilePath;
    }
}
function buildFullPath(path, basePath) {
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
function getAssetsBasePath(app) {
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
function toAssetsTagItem(src) {
    return {
        src: src
    };
}
function toAssetsTagItems(src) {
    return src.map(item => toAssetsTagItem(item));
}
function getScriptsAndStylesAssets(app, basePath, manifestResult) {
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

const PLANET_SANDBOX_WINDOW_WHITELIST = window['___PLANET_SANDBOX_WINDOW_WHITELIST___'];
const PLANET_SANDBOX_DOCUMENT_WHITELIST = window['___PLANET_SANDBOX_DOCUMENT_WHITELIST___'];
const SANDBOX_INSTANCE = Symbol.for('PLANET_SANDBOX_INSTANCE');
const RAW_NODE = Symbol.for('PLANET_RAW_NODE');
const WINDOW_BIND_FN = Symbol.for('PLANET_WINDOW_BIND_FN');
const DOCUMENT_BIND_FN = Symbol.for('PLANET_DOCUMENT_BIND_FN');

const rawHasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwnProp(obj, key) {
    return rawHasOwnProperty.call(obj, key);
}
function isValueDescriptor(desc) {
    if (desc === undefined) {
        return false;
    }
    return 'value' in desc || 'writable' in desc;
}
function isAccessorDescriptor(desc) {
    if (desc === undefined) {
        return false;
    }
    return 'get' in desc || 'set' in desc;
}
function isNonWriteableValue(desc) {
    return desc && desc.configurable === false && 'value' in desc && desc.writable === false;
}
function isInvalidSetAccessor(desc) {
    if (desc && desc.configurable === false && 'set' in desc && desc.set === undefined) {
        return true;
    }
    else {
        return false;
    }
}
function isInvalidGetAccessor(desc) {
    if (desc && desc.configurable === false && 'get' in desc && desc.get === undefined) {
        return true;
    }
    else {
        return false;
    }
}
function transferParams(args) {
    args = Array.isArray(args) ? args : Array.from(args);
    return args.map(arg => {
        return arg[RAW_NODE] ? arg[RAW_NODE] : arg;
    });
}
const buildInProps = ['length', 'caller', 'callee', 'arguments', 'prototype', Symbol.hasInstance];
function transferProps(o, n) {
    for (const key of Reflect.ownKeys(o)) {
        if (buildInProps.includes(key)) {
            continue;
        }
        const desc = Object.getOwnPropertyDescriptor(n, key);
        if (desc && desc.writable) {
            n[key] = o[key];
        }
    }
}
function bind(fn, context) {
    const fNOP = function () { };
    function bound() {
        const args = transferParams(arguments);
        if (this instanceof bound) {
            const obj = new fn(...args);
            Object.setPrototypeOf(obj, bound.prototype);
            return obj;
        }
        else {
            return fn.apply(context, args);
        }
    }
    bound.$native = fn;
    transferProps(fn, bound);
    if (fn.prototype) {
        fNOP.prototype = fn.prototype;
    }
    bound.prototype = new fNOP();
    if (Symbol.hasInstance) {
        Object.defineProperty(bound, Symbol.hasInstance, {
            configurable: true,
            value(instance) {
                const op = fn.prototype;
                return isObject(op) || typeof op === 'function' ? instance instanceof fn : false;
            }
        });
    }
    return bound;
}
function createFakeObject(target, writableKeys) {
    const fakeObject = {};
    const propertyMap = {};
    const storageBox = Object.create(null);
    const propertyNames = Object.getOwnPropertyNames(target);
    const def = (p) => {
        const descriptor = Object.getOwnPropertyDescriptor(target, p);
        if (descriptor?.configurable) {
            const hasGetter = hasOwnProp(descriptor, 'get');
            const hasSetter = hasOwnProp(descriptor, 'set');
            const canWritable = writableKeys && writableKeys.length > 0 && writableKeys.includes(p);
            if (hasGetter) {
                descriptor.get = () => (hasOwnProp(storageBox, p) ? storageBox[p] : target[p]);
            }
            if (hasSetter) {
                descriptor.set = val => {
                    storageBox[p] = val;
                    return true;
                };
            }
            if (canWritable) {
                if (descriptor.writable === false) {
                    descriptor.writable = true;
                }
                else if (hasGetter) {
                    descriptor.set = val => {
                        storageBox[p] = val;
                        return true;
                    };
                }
            }
            Object.defineProperty(fakeObject, p, Object.freeze(descriptor));
        }
    };
    propertyNames.forEach(p => {
        propertyMap[p] = true;
        def(p);
    });
    // 再次循环是为了处理原型链中的属性
    for (const prop in target) {
        if (!propertyMap[prop]) {
            def(prop);
        }
    }
    return fakeObject;
}

const esGlobalFunctions = ('eval,isFinite,isNaN,parseFloat,parseInt,' +
    // URL handling functions
    'decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    // Constructor properties of the global object
    'Array,ArrayBuffer,BigInt,BigInt64Array,BigUint64Array,Boolean,DataView,Date,Error,EvalError,' +
    'FinalizationRegistry,Float32Array,Float64Array,Function,Int8Array,Int16Array,Int32Array,Map,Number,' +
    'Object,Promise,Proxy,RangeError,ReferenceError,RegExp,Set,SharedArrayBuffer,String,Symbol,SyntaxError,' +
    'TypeError,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,URIError,WeakMap,WeakRef,WeakSet,' +
    // Other Properties of the Global Object
    'Atomics,JSON,Math,Reflect').split(',');
const whitelistVariables = PLANET_SANDBOX_WINDOW_WHITELIST || [];
function isConstructor(fn) {
    const fp = fn.prototype;
    const hasConstructor = fp && fp.constructor === fn && Object.getOwnPropertyNames(fp).length > 1;
    const functionStr = !hasConstructor && fn.toString();
    return hasConstructor || /^function\s+[A-Z]/.test(functionStr) || /^class\b/.test(functionStr);
}
const unscopables = {
    undefined: true,
    Array: true,
    Object: true,
    String: true,
    Boolean: true,
    Math: true,
    Number: true,
    Symbol: true,
    parseFloat: true,
    Float32Array: true
};
class ProxyWindow {
    constructor(sandbox) {
        this.sandbox = sandbox;
        this.definedVariables = new Set();
    }
    createGetter() {
        return (target, key, receiver) => {
            if (key === Symbol.unscopables) {
                return unscopables;
            }
            if (key === SANDBOX_INSTANCE) {
                return this.sandbox;
            }
            let value = null;
            if (whitelistVariables.includes(key)) {
                return Reflect.get(window, key);
            }
            else {
                value = hasOwnProp(target, key) ? Reflect.get(target, key, receiver) : Reflect.get(window, key);
            }
            if (isFunction(value)) {
                if (esGlobalFunctions.includes(key) ||
                    whitelistVariables.includes(key) ||
                    this.sandbox.rewriteVariables.includes(key) ||
                    this.definedVariables.has(key) ||
                    isConstructor(value)) {
                    return value;
                }
                else {
                    const newValue = hasOwnProp(value, WINDOW_BIND_FN) ? value[WINDOW_BIND_FN] : bind(value, window);
                    const desc = Object.getOwnPropertyDescriptor(target, key);
                    if (isNonWriteableValue(desc)) {
                        return value;
                    }
                    if (isInvalidGetAccessor(desc)) {
                        return undefined;
                    }
                    value[WINDOW_BIND_FN] = newValue;
                    return newValue;
                }
            }
            else {
                return value;
            }
        };
    }
    createSetter() {
        return (target, key, value, receiver) => {
            const desc = Object.getOwnPropertyDescriptor(whitelistVariables.includes(key) ? window : receiver ? receiver : target, key);
            if (desc && isNonWriteableValue(desc)) {
                if (!Object.is(value, desc.value)) {
                    return false;
                }
                else {
                    return true;
                }
            }
            if (isInvalidSetAccessor(desc)) {
                return false;
            }
            if (whitelistVariables.includes(key)) {
                return Reflect.set(window, key, value);
            }
            else {
                const success = Reflect.set(target, key, value, receiver);
                if (success) {
                    if (this.sandbox.running) {
                        this.definedVariables.add(key);
                    }
                }
                return success;
            }
        };
    }
    createDefineProperty() {
        return (target, p, descriptor) => {
            if (whitelistVariables.includes(p)) {
                return Reflect.defineProperty(window, p, descriptor);
            }
            else {
                const success = Reflect.defineProperty(target, p, descriptor);
                if (this.sandbox.running && success) {
                    this.definedVariables.add(p);
                }
                return success;
            }
        };
    }
    createDeleteProperty() {
        return (target, p) => {
            if (hasOwnProp(target, p)) {
                delete target[p];
                if (this.sandbox.running && this.definedVariables.has(p)) {
                    this.definedVariables.delete(p);
                }
            }
            return true;
        };
    }
    createHas() {
        return (_target, key) => {
            return !whitelistVariables.includes(key);
        };
    }
    create() {
        const fakeWindow = createFakeObject(window, this.sandbox.rewriteVariables);
        const baseHandlers = {
            get: this.createGetter(),
            set: this.createSetter(),
            defineProperty: this.createDefineProperty(),
            deleteProperty: this.createDeleteProperty()
        };
        const proxy = new Proxy(fakeWindow, {
            ...baseHandlers,
            has: this.createHas()
        });
        const subProxy = new Proxy(fakeWindow, baseHandlers);
        proxy.self = subProxy;
        proxy.window = subProxy;
        proxy.globalThis = subProxy;
        proxy.top = window.top === window ? subProxy : window.top;
        proxy.parent = window.parent === window ? subProxy : window.top;
        return proxy;
    }
}

function eventListenerPatch(sandbox) {
    const rawAddEventListener = window.addEventListener;
    const rawRemoveEventListener = window.removeEventListener;
    const listenerSubscriptions = new Map();
    function addEventListener(type, listener, options) {
        const observable = new Observable(() => {
            rawAddEventListener.call(this, type, listener, options);
            return () => {
                rawRemoveEventListener.call(this, type, listener, options);
            };
        });
        const subscription = observable.subscribe(() => { });
        listenerSubscriptions.set(listener, subscription);
    }
    function removeEventListener(type, listener) {
        const subscription = listenerSubscriptions.get(listener);
        if (subscription) {
            subscription.unsubscribe();
            listenerSubscriptions.delete(listener);
        }
    }
    return {
        rewrite: {
            addEventListener: addEventListener.bind(window),
            removeEventListener: removeEventListener.bind(window)
        },
        init() {
            const fakeDocument = sandbox.global['document'];
            if (fakeDocument) {
                fakeDocument.addEventListener = addEventListener.bind(document);
                fakeDocument.removeEventListener = removeEventListener.bind(document);
            }
        },
        destroy() {
            listenerSubscriptions.forEach(subscription => subscription.unsubscribe());
            listenerSubscriptions.clear();
        }
    };
}

const rawDocument = Document;
const whitelist = ['cookie', 'title', 'location', ...(PLANET_SANDBOX_DOCUMENT_WHITELIST || [])];
class ProxyDocument {
    constructor() { }
    createGetter() {
        return (target, p, receiver) => {
            const value = hasOwnProp(target, p) ? Reflect.get(target, p, receiver) : Reflect.get(document, p);
            if (p === 'activeElement') {
                return Reflect.get(document, p);
            }
            // TODO: 处理动态节点
            // if (p === 'createElement') {
            //     return function(tagName: string, options: ElementCreationOptions) {
            //         const created = value.call(document, tagName, options);
            //         if (isObject(created)) {
            //             created[SANDBOX_INSTANCE] = sandbox;
            //         }
            //         return created;
            //     };
            // }
            if (isFunction(value)) {
                let newValue = hasOwnProp(value, DOCUMENT_BIND_FN) ? value[DOCUMENT_BIND_FN] : null;
                if (!newValue) {
                    newValue = bind(value, document);
                }
                const desc = Object.getOwnPropertyDescriptor(target, p);
                if (desc && isNonWriteableValue(desc)) {
                    if (!Object.is(newValue, desc.value)) {
                        return value;
                    }
                }
                if (isInvalidGetAccessor(desc)) {
                    return undefined;
                }
                value[DOCUMENT_BIND_FN] = newValue;
                return newValue;
            }
            return value;
        };
    }
    createSetter() {
        return (target, p, value, receiver) => {
            const desc = Object.getOwnPropertyDescriptor(whitelist.includes(p) ? document : receiver || target, p);
            if (desc && isNonWriteableValue(desc)) {
                if (Object.is(value, desc.value)) {
                    return true;
                }
                else {
                    return false;
                }
            }
            if (isInvalidSetAccessor(desc)) {
                return false;
            }
            return whitelist.includes(p) ? Reflect.set(document, p, value) : Reflect.set(target, p, value, receiver);
        };
    }
    createDefineProperty() {
        return (target, p, descriptor) => {
            return whitelist.includes(p)
                ? Reflect.defineProperty(document, p, descriptor)
                : Reflect.defineProperty(target, p, descriptor);
        };
    }
    create() {
        let proxyDocument = null;
        const fakeDocument = createFakeObject(document);
        const getter = this.createGetter();
        const fakeDocumentProto = new Proxy(fakeDocument, {
            get: (...args) => {
                return getter(...args);
            }
        });
        const fakeDocumentCtor = function Document() {
            if (!(this instanceof fakeDocumentCtor)) {
                throw new TypeError(`Failed to construct 'Document': Please use the 'new' operator.`);
            }
            const docInstance = new rawDocument();
            Object.setPrototypeOf(docInstance, fakeDocument);
            return docInstance;
        };
        fakeDocumentCtor.prototype = fakeDocumentProto;
        fakeDocumentCtor.prototype.constructor = fakeDocumentCtor;
        if (Symbol.hasInstance) {
            Object.defineProperty(fakeDocumentCtor, Symbol.hasInstance, {
                configurable: true,
                value(value) {
                    let proto = value;
                    if (proto === document) {
                        return true;
                    }
                    while ((proto = Object.getPrototypeOf(proto))) {
                        if (proto === fakeDocumentProto) {
                            return true;
                        }
                    }
                    const cloned = function () { };
                    cloned.prototype = fakeDocument;
                    return value instanceof cloned;
                }
            });
        }
        proxyDocument = new Proxy(Object.create(fakeDocumentProto, {
            currentScript: {
                value: null,
                writable: true
            },
            [RAW_NODE]: {
                writable: false,
                configurable: false,
                value: document
            }
        }), {
            set: this.createSetter(),
            defineProperty: this.createDefineProperty()
        });
        return {
            document: proxyDocument,
            Document: fakeDocumentCtor
        };
    }
}

function documentPatch() {
    const proxyDocument = new ProxyDocument();
    const { document, Document } = proxyDocument.create();
    return {
        rewrite: {
            document,
            Document
        }
    };
}

const rawSetTimeout = window.setTimeout;
const rawClearTimeout = window.clearTimeout;
const rawSetInterval = window.setInterval;
const rawClearInterval = window.clearInterval;
function timerPatch() {
    const timeout = new Set();
    const interval = new Set();
    function rewriteSetTimeout(handler, ms, ...args) {
        const timeoutId = rawSetTimeout(handler, ms, ...args);
        timeout.add(timeoutId);
        return timeoutId;
    }
    function rewriteClearTimeout(timeoutId) {
        timeout.delete(timeoutId);
        rawClearTimeout(timeoutId);
    }
    function rewriteSetInterval(handler, ms, ...args) {
        const intervalId = rawSetInterval(handler, ms, ...args);
        interval.add(intervalId);
        return intervalId;
    }
    function rewriteClearInterval(intervalId) {
        interval.delete(intervalId);
        rawClearInterval(intervalId);
    }
    return {
        rewrite: {
            setTimeout: rewriteSetTimeout,
            clearTimeout: rewriteClearTimeout,
            setInterval: rewriteSetInterval,
            clearInterval: rewriteClearInterval
        },
        destroy: () => {
            timeout.forEach(timeoutId => {
                rawClearTimeout(timeoutId);
            });
            interval.forEach(intervalId => {
                rawClearInterval(intervalId);
            });
        }
    };
}

const PLANET_STORAGE_PREFIX = '__planet-storage-';
class RewriteStorage {
    constructor(app, rawStorage) {
        this.rawStorage = rawStorage;
        this.prefix = `${PLANET_STORAGE_PREFIX}${app}__:`;
    }
    get length() {
        return this.getKeys().length;
    }
    getKeys() {
        return Object.keys(this.rawStorage).filter(key => key.startsWith(this.prefix));
    }
    key(n) {
        const key = this.getKeys()[n];
        return key ? key.substring(this.prefix.length) : null;
    }
    getItem(key) {
        return this.rawStorage.getItem(`${this.prefix + key}`);
    }
    setItem(key, value) {
        this.rawStorage.setItem(`${this.prefix + key}`, value);
    }
    removeItem(key) {
        this.rawStorage.removeItem(`${this.prefix + key}`);
    }
    clear() {
        this.getKeys().forEach(key => {
            this.rawStorage.removeItem(key);
        });
    }
}
function storagePatch(sandbox) {
    return {
        rewrite: {
            localStorage: new RewriteStorage(sandbox.app, localStorage),
            sessionStorage: new RewriteStorage(sandbox.app, sessionStorage)
        }
    };
}

const sandboxPatches = [documentPatch, eventListenerPatch, timerPatch, storagePatch];
function getSandboxPatchHandlers(sandbox) {
    return sandboxPatches.map(patch => {
        return patch(sandbox);
    });
}

function execScript(code, url, global, strictGlobal) {
    const sourceUrl = '//# sourceURL='.concat(url, '\n');
    const window = (0, eval)('window');
    window.tempGlobal = global;
    code = strictGlobal
        ? ';(function(window, self, globalThis){with(window){;'
            .concat(code, '\n')
            .concat(sourceUrl, '}}).bind(window.tempGlobal)(window.tempGlobal, window.tempGlobal, window.tempGlobal);')
        : ';(function(window, self, globalThis){;'
            .concat(code, '\n')
            .concat(sourceUrl, '}).bind(window.tempGlobal)(window.tempGlobal, window.tempGlobal, window.tempGlobal);');
    (0, eval)(code);
    delete window.tempGlobal;
}

class Sandbox {
    execScript(code, url = '') {
        execScript(code, url, this.global, !!this.options.strictGlobal);
    }
}

class ProxySandbox extends Sandbox {
    constructor(app, options) {
        super();
        this.app = app;
        this.options = options;
        this.running = false;
        this.patchHandlers = [];
        this.patchHandlers = getSandboxPatchHandlers(this);
        this.start();
    }
    start() {
        this.running = true;
        this.rewriteVariables = this.getPatchRewriteVariables();
        const proxyWindow = new ProxyWindow(this);
        this.global = proxyWindow.create();
        this.execPatchHandlers();
    }
    destroy() {
        this.running = false;
        this.patchHandlers.forEach(handler => {
            if (handler.destroy) {
                handler.destroy();
            }
        });
    }
    getPatchRewriteVariables() {
        return this.patchHandlers.reduce((pre, cur) => {
            return [...pre, ...(cur.rewrite ? Object.keys(cur.rewrite) : [])];
        }, []);
    }
    execPatchHandlers() {
        this.patchHandlers.forEach(handler => {
            if (handler.rewrite) {
                for (const key in handler.rewrite) {
                    if (handler.rewrite[key]) {
                        this.global[key] = handler.rewrite[key];
                    }
                }
            }
            if (handler.init) {
                handler?.init();
            }
        });
    }
}

class SnapshotSandbox extends Sandbox {
    constructor(app, options) {
        super();
        this.app = app;
        this.options = options;
        this.start();
    }
    start() { }
    destroy() { }
}

const defaultOptions = {
    strictGlobal: false
};
function createSandbox(app, options) {
    options = Object.assign({}, defaultOptions, options || {});
    if (window.Proxy) {
        return new ProxySandbox(app, options);
    }
    else {
        return new SnapshotSandbox(app, options);
    }
}
function getSandboxInstance() {
    return window[SANDBOX_INSTANCE];
}

const STYLE_LINK_OR_SCRIPT_REG = /<[script|link].*?>/gi;
const LINK_OR_SRC_REG = /(src|href)=["'](.*?[\.js|\.css])["']/i;
const TAG_ATTRS_REG = /(type|defer|async)((=["'].*?["'])|\s|\>)/gi;
class AssetsLoader {
    constructor(http) {
        this.http = http;
        this.loadedSources = [];
    }
    loadScript(src, tagAttributes) {
        const id = hashCode(src);
        if (this.loadedSources.includes(id)) {
            return of({
                src: src,
                hashCode: id,
                loaded: true,
                status: 'Loaded'
            });
        }
        return new Observable((observer) => {
            const script = document.createElement('script');
            script.type = tagAttributes?.type || 'text/javascript';
            script.src = src;
            if (!tagAttributes?.defer || tagAttributes?.defer !== 'false') {
                script.defer = true;
            }
            if (!tagAttributes?.async && tagAttributes?.async === 'false') {
                script.async = true;
            }
            if (script['readyState']) {
                // IE
                script['onreadystatechange'] = () => {
                    if (script['readyState'] === 'loaded' || script['readyState'] === 'complete') {
                        script['onreadystatechange'] = null;
                        observer.next({
                            src: src,
                            hashCode: id,
                            loaded: true,
                            status: 'Loaded'
                        });
                        observer.complete();
                        this.loadedSources.push(id);
                    }
                };
            }
            else {
                // Others
                script.onload = () => {
                    observer.next({
                        src: src,
                        hashCode: id,
                        loaded: true,
                        status: 'Loaded'
                    });
                    observer.complete();
                    this.loadedSources.push(id);
                };
            }
            script.onerror = error => {
                observer.error({
                    src: src,
                    hashCode: id,
                    loaded: false,
                    status: 'Error',
                    error: error
                });
                observer.complete();
            };
            document.body.appendChild(script);
        });
    }
    loadScriptWithSandbox(app, src) {
        const id = hashCode(src);
        if (this.loadedSources.includes(id)) {
            return of({
                src: src,
                hashCode: id,
                loaded: true,
                status: 'Loaded'
            });
        }
        return new Observable((observer) => {
            this.http.get(src, { responseType: 'text' }).subscribe((code) => {
                this.loadedSources.push(id);
                const sandbox = createSandbox(app);
                sandbox.execScript(code, src);
                observer.next({
                    src: src,
                    hashCode: id,
                    loaded: true,
                    status: 'Loaded'
                });
                observer.complete();
            }, error => {
                observer.error({
                    src: src,
                    hashCode: id,
                    loaded: false,
                    status: 'Error',
                    error: error
                });
                observer.complete();
            });
        });
    }
    loadStyle(src) {
        const id = hashCode(src);
        if (this.loadedSources.includes(id)) {
            return of({
                src: src,
                hashCode: id,
                loaded: true,
                status: 'Loaded'
            });
        }
        return new Observable((observer) => {
            const head = document.getElementsByTagName('head')[0];
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = src;
            link.media = 'all';
            link.onload = () => {
                observer.next({
                    src: src,
                    hashCode: id,
                    loaded: true,
                    status: 'Loaded'
                });
                observer.complete();
                this.loadedSources.push(id);
            };
            link.onerror = error => {
                observer.error({
                    src: src,
                    hashCode: id,
                    loaded: true,
                    status: 'Loaded',
                    error: error
                });
                observer.complete();
            };
            head.appendChild(link);
        });
    }
    loadScripts(sources, options = {
        serial: false,
        sandbox: false
    }) {
        if (isEmpty(sources)) {
            return of(null);
        }
        const observables = sources.map(source => {
            // TODO: 暂时只支持Proxy沙箱
            if (options.sandbox && window.Proxy) {
                return this.loadScriptWithSandbox(options.app, source.src);
            }
            else {
                return this.loadScript(source.src, source.attributes);
            }
        });
        if (options.serial) {
            const a = concat(...observables).pipe(map(item => {
                return of([item]);
            }), concatAll());
            return a;
        }
        else {
            return forkJoin(observables).pipe();
        }
    }
    loadStyles(sources) {
        if (isEmpty(sources)) {
            return of(null);
        }
        return forkJoin(sources.map(source => {
            return this.loadStyle(source.src);
        }));
    }
    loadScriptsAndStyles(scripts = [], styles = [], options) {
        return forkJoin([this.loadScripts(scripts, options), this.loadStyles(styles)]);
    }
    /**
     * <script type="module" src="http://127.0.0.1:3001/main.js" async defer></script>
     * => [`type="module"`, "async ", "defer>"] as attributeStrMatchArr
     * => { type: "module", async: "async", defer: "defer" } as attributes
     */
    parseTagAttributes(tag) {
        const attributeStrMatchArr = tag.match(TAG_ATTRS_REG);
        if (attributeStrMatchArr) {
            const attributes = {};
            attributeStrMatchArr.forEach(item => {
                const equalSignIndex = item.indexOf('=');
                if (equalSignIndex > 0) {
                    // 'type="module"' => { type: "module" }
                    const key = item.slice(0, equalSignIndex);
                    attributes[key] = item.slice(equalSignIndex + 2, item.length - 1);
                }
                else {
                    // 'async ' => 'async'
                    // 'defer>' => 'defer'
                    const key = item.slice(0, item.length - 1);
                    attributes[key] = key;
                }
            });
            return attributes;
        }
        return undefined;
    }
    parseManifestFromHTML(html) {
        const result = {};
        const matchResult = html.match(STYLE_LINK_OR_SCRIPT_REG);
        matchResult.forEach(item => {
            const linkOrSrcResult = item.match(LINK_OR_SRC_REG);
            if (linkOrSrcResult && linkOrSrcResult[2]) {
                const src = linkOrSrcResult[2];
                const hashName = getResourceFileName(src);
                let barSplitIndex = hashName.indexOf('-');
                let dotSplitIndex = hashName.indexOf('.');
                const splitIndex = barSplitIndex > -1 ? barSplitIndex : dotSplitIndex;
                if (splitIndex > -1) {
                    const name = hashName.slice(0, splitIndex);
                    const ext = getExtName(hashName);
                    const assetsTag = {
                        src: src
                    };
                    result[ext ? `${name}.${ext}` : name] = assetsTag;
                    const attributes = this.parseTagAttributes(item);
                    if (attributes) {
                        assetsTag.attributes = attributes;
                    }
                    // const typeTagResult = item.match(TAG_TYPE_REG);
                    // if (typeTagResult && typeTagResult[1]) {
                    //     assetsTag.attributes = {
                    //         type: typeTagResult[1]
                    //     };
                    // }
                }
            }
        });
        return result;
    }
    loadAppAssets(app) {
        const basePath = getAssetsBasePath(app);
        const manifest = app.entry ? (isObject(app.entry) ? app.entry.manifest : app.entry) : app.manifest;
        if (manifest) {
            const manifestExt = getExtName(manifest);
            const isHtml = manifestExt === 'html';
            const responseType = isHtml ? 'text' : 'json';
            return this.loadManifest(`${manifest}?t=${new Date().getTime()}`, responseType).pipe(switchMap(manifestResult => {
                const { scripts, styles } = getScriptsAndStylesAssets(app, basePath, manifestResult);
                return this.loadScriptsAndStyles(scripts, styles, {
                    app: app.name,
                    sandbox: app.sandbox,
                    serial: app.loadSerial
                });
            }));
        }
        else {
            const { scripts, styles } = getScriptsAndStylesAssets(app, basePath);
            return this.loadScriptsAndStyles(scripts, styles, {
                app: app.name,
                sandbox: app.sandbox,
                serial: app.loadSerial
            });
        }
    }
    loadManifest(url, responseType = 'json') {
        return this.http
            .get(url, {
            responseType: responseType
        })
            .pipe(map((response) => {
            if (responseType === 'text') {
                return this.parseManifestFromHTML(response);
            }
            else {
                const result = {};
                Object.keys(response).forEach(key => {
                    result[key] = {
                        src: response[key]
                    };
                });
                return result;
            }
        }));
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: AssetsLoader, deps: [{ token: i1.HttpClient }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: AssetsLoader, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: AssetsLoader, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }] });

class NgPlanetApplicationRef {
    get selector() {
        return this.innerSelector;
    }
    get ngZone() {
        return (this.injector || this.appModuleRef?.injector)?.get(NgZone);
    }
    get sandbox() {
        return getSandboxInstance();
    }
    get bootstrapped() {
        return !!(this.appModuleRef || this.appRef);
    }
    constructor(name, options) {
        this.name = name;
        if (options) {
            this.template = options.template;
            this.innerSelector = this.template ? getTagNameByTemplate(this.template) : '';
            this.appModuleBootstrap = options.bootstrap;
        }
        // This is a hack, since NgZone doesn't allow you to configure the property that identifies your zone.
        // See https://github.com/PlaceMe-SAS/single-spa-angular-cli/issues/33,
        // NgZone.isInAngularZone = () => {
        //     // @ts-ignore
        //     return window.Zone.current._properties[`ngx-planet-${name}`] === true;
        // };
    }
    // 子应用路由变化后同步修改 portal 的 Route
    syncPortalRouteWhenNavigationEnd() {
        const router = (this.injector || this.appModuleRef?.injector)?.get(Router);
        if (router) {
            router.events.subscribe(event => {
                if (event instanceof NavigationEnd) {
                    this.ngZone?.onStable
                        .asObservable()
                        .pipe(take(1))
                        .subscribe(() => {
                        this.portalApp.ngZone.run(() => {
                            this.portalApp.router.navigateByUrl(event.url);
                        });
                    });
                }
            });
        }
    }
    bootstrap(app) {
        if (!this.appModuleBootstrap) {
            throw new Error(`app(${this.name}) is not defined`);
        }
        this.portalApp = app;
        return from(this.appModuleBootstrap(app).then(appModuleRef => {
            if (appModuleRef['instance']) {
                this.appModuleRef = appModuleRef;
                this.appModuleRef.instance.appName = this.name;
                this.injector = this.appModuleRef.injector;
            }
            else {
                this.appRef = appModuleRef;
                this.injector = this.appRef.injector;
                const moduleRef = this.appRef.injector.get(NgModuleRef);
                moduleRef.instance = { appName: this.name };
            }
            this.syncPortalRouteWhenNavigationEnd();
            return this;
        }));
    }
    getRouter() {
        return (this.injector || this.appModuleRef?.injector)?.get(Router);
    }
    getCurrentRouterStateUrl() {
        return this.getRouter()?.routerState.snapshot.url;
    }
    navigateByUrl(url) {
        const router = this.getRouter();
        this.ngZone?.run(() => {
            router?.navigateByUrl(url);
        });
    }
    getComponentFactory() {
        return this.componentFactory;
    }
    registerComponentFactory(componentFactory) {
        this.componentFactory = componentFactory;
    }
    destroy() {
        if (this.appModuleRef || this.appRef) {
            const router = (this.injector || this.appModuleRef?.injector)?.get(Router);
            if (router) {
                router.dispose();
            }
            if (this.sandbox) {
                this.sandbox.destroy();
            }
            this.appModuleRef?.destroy();
            this.appModuleRef = undefined;
            this.appRef?.destroy();
            this.appRef = undefined;
            this.injector = undefined;
        }
    }
}

const globalPlanet = (window.planet = window.planet || {
    apps: {}
});
function defineApplication(name, options) {
    if (globalPlanet.apps[name]) {
        throw new Error(`${name} application has exist.`);
    }
    if (isFunction(options)) {
        options = {
            template: '',
            bootstrap: options
        };
    }
    const appRef = new NgPlanetApplicationRef(name, options);
    globalPlanet.apps[name] = appRef;
}
function getPlanetApplicationRef(appName) {
    if (globalPlanet && globalPlanet.apps && globalPlanet.apps[appName]) {
        return globalPlanet.apps[appName];
    }
    else {
        return null;
    }
}
function getBootstrappedPlanetApplicationRef(appName) {
    const plantAppRef = getPlanetApplicationRef(appName);
    if (plantAppRef) {
        // 兼容之前的版本，之前是通过 appModuleRef 来判断是否启用的
        if (plantAppRef.bootstrapped || plantAppRef['appModuleRef']) {
            return plantAppRef;
        }
    }
    return null;
}
function setPortalApplicationData(data) {
    if (globalPlanet.portalApplication) {
        globalPlanet.portalApplication.data = data;
    }
}
function getPortalApplicationData() {
    return globalPlanet.portalApplication?.data;
}
function setApplicationLoader(loader) {
    globalPlanet.applicationLoader = loader;
}
function getApplicationLoader() {
    return globalPlanet.applicationLoader;
}
function setApplicationService(service) {
    globalPlanet.applicationService = service;
}
function getApplicationService() {
    return globalPlanet.applicationService;
}
function clearGlobalPlanet() {
    window.planet.apps = {};
    window.planet.portalApplication = null;
    window.planet.applicationLoader = null;
    window.planet.applicationService = null;
}

class PlanetApplicationService {
    constructor(http, assetsLoader) {
        this.http = http;
        this.assetsLoader = assetsLoader;
        this.apps = [];
        this.appsMap = {};
        if (getApplicationService()) {
            throw new Error('PlanetApplicationService has been injected in the portal, repeated injection is not allowed');
        }
    }
    register(appOrApps) {
        const apps = coerceArray(appOrApps);
        apps.forEach(app => {
            if (this.appsMap[app.name]) {
                throw new Error(`${app.name} has be registered.`);
            }
            this.apps.push(app);
            this.appsMap[app.name] = app;
        });
    }
    registerByUrl(url) {
        const result = this.http.get(`${url}`).pipe(map(apps => {
            if (apps && Array.isArray(apps)) {
                this.register(apps);
            }
            else {
                this.register(apps);
            }
        }), shareReplay());
        result.subscribe();
        return result;
    }
    unregister(name) {
        if (this.appsMap[name]) {
            delete this.appsMap[name];
            this.apps = this.apps.filter(app => {
                return app.name !== name;
            });
        }
    }
    getAppsByMatchedUrl(url) {
        return this.getApps().filter(app => {
            if (app.routerPathPrefix instanceof RegExp) {
                return app.routerPathPrefix.test(url);
            }
            else {
                return url.startsWith(app.routerPathPrefix);
            }
        });
    }
    getAppByName(name) {
        return this.appsMap[name];
    }
    getAppsToPreload(excludeAppNames) {
        return this.getApps().filter(app => {
            if (excludeAppNames) {
                return app.preload && !excludeAppNames.includes(app.name);
            }
            else {
                return app.preload;
            }
        });
    }
    getApps() {
        return this.apps;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationService, deps: [{ token: i1.HttpClient }, { token: AssetsLoader }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationService, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: AssetsLoader }] });

class PlanetPortalApplication {
    navigateByUrl(url, extras) {
        return this.ngZone.run(() => {
            return this.router.navigateByUrl(url, extras);
        });
    }
    run(fn) {
        return this.ngZone.run(() => {
            return fn();
        });
    }
    tick() {
        this.applicationRef.tick();
    }
}

const CUSTOM_EVENT_NAME = 'PLANET_GLOBAL_EVENT_DISPATCHER';
class GlobalEventDispatcher {
    addGlobalEventListener() {
        this.hasAddGlobalEventListener = true;
        window.addEventListener(CUSTOM_EVENT_NAME, this.globalEventListener);
    }
    removeGlobalEventListener() {
        this.hasAddGlobalEventListener = false;
        window.removeEventListener(CUSTOM_EVENT_NAME, this.globalEventListener);
    }
    constructor(ngZone) {
        this.ngZone = ngZone;
        this.subject$ = new Subject();
        this.hasAddGlobalEventListener = false;
        this.subscriptionCount = 0;
        this.globalEventListener = (event) => {
            this.subject$.next(event.detail);
        };
    }
    dispatch(name, payload) {
        window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, {
            detail: {
                name: name,
                payload: payload
            }
        }));
    }
    register(eventName) {
        return new Observable(observer => {
            if (!this.hasAddGlobalEventListener) {
                this.addGlobalEventListener();
            }
            this.subscriptionCount++;
            const subscription = this.subject$
                .pipe(filter(event => {
                return event.name === eventName;
            }), map(event => {
                return event.payload;
            }))
                .subscribe(payload => {
                this.ngZone.run(() => {
                    observer.next(payload);
                });
            });
            return () => {
                this.subscriptionCount--;
                subscription.unsubscribe();
                if (!this.subscriptionCount) {
                    this.removeGlobalEventListener();
                }
            };
        });
    }
    getSubscriptionCount() {
        return this.subscriptionCount;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: GlobalEventDispatcher, deps: [{ token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: GlobalEventDispatcher, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: GlobalEventDispatcher, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i0.NgZone }] });

/**
 * Debug factory for debug module
 */
let _debugFactory;
let _debuggerMap = {};
function createDebug(namespace) {
    const key = `planet:${namespace}`;
    return function (formatter, ...args) {
        if (_debugFactory) {
            let debugDebugger = _debuggerMap[key];
            if (!debugDebugger) {
                debugDebugger = _debugFactory(key);
                _debuggerMap[key] = debugDebugger;
            }
            debugDebugger(formatter, args);
        }
    };
}
function setDebugFactory(debug) {
    if (debug && !isFunction(debug)) {
        throw new Error('debug factory type is invalid, must be function');
    }
    _debugFactory = debug;
}
function clearDebugFactory() {
    _debugFactory = undefined;
    _debuggerMap = {};
}
function getDebugFactory() {
    return _debugFactory;
}

const debug = createDebug('app-loader');
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus[ApplicationStatus["assetsLoading"] = 1] = "assetsLoading";
    ApplicationStatus[ApplicationStatus["assetsLoaded"] = 2] = "assetsLoaded";
    ApplicationStatus[ApplicationStatus["bootstrapping"] = 3] = "bootstrapping";
    ApplicationStatus[ApplicationStatus["bootstrapped"] = 4] = "bootstrapped";
    ApplicationStatus[ApplicationStatus["active"] = 5] = "active";
    ApplicationStatus[ApplicationStatus["loadError"] = 10] = "loadError";
})(ApplicationStatus || (ApplicationStatus = {}));
class PlanetApplicationLoader {
    get appStatusChange() {
        return this.appStatusChange$.asObservable();
    }
    get appsLoadingStart() {
        return this.appsLoadingStart$.asObservable();
    }
    constructor(assetsLoader, planetApplicationService, ngZone, router, injector, applicationRef) {
        this.assetsLoader = assetsLoader;
        this.planetApplicationService = planetApplicationService;
        this.ngZone = ngZone;
        this.firstLoad = true;
        this.inProgressAppAssetsLoads = new Map();
        this.appsStatus = new Map();
        this.portalApp = new PlanetPortalApplication();
        this.routeChange$ = new Subject();
        this.appStatusChange$ = new Subject();
        this.appsLoadingStart$ = new Subject();
        this.innerLoading = signal(false);
        /**
         * @deprecated please use loading signal
         */
        this.loadingDone = false;
        this.loading = this.innerLoading.asReadonly();
        if (getApplicationLoader()) {
            throw new Error('PlanetApplicationLoader has been injected in the portal, repeated injection is not allowed');
        }
        this.options = {
            switchMode: SwitchModes.default,
            errorHandler: (error) => {
                console.error(error);
            }
        };
        this.portalApp.ngZone = ngZone;
        this.portalApp.applicationRef = applicationRef;
        this.portalApp.router = router;
        this.portalApp.injector = injector;
        this.portalApp.globalEventDispatcher = injector.get(GlobalEventDispatcher);
        globalPlanet.portalApplication = this.portalApp;
        this.setupRouteChange();
    }
    setAppStatus(app, status) {
        this.ngZone.run(() => {
            const fromStatus = this.appsStatus.get(app);
            debug(`app(${app.name}) status change: ${fromStatus ? ApplicationStatus[fromStatus] : 'empty'} => ${ApplicationStatus[status]}`);
            this.appsStatus.set(app, status);
            this.appStatusChange$.next({
                app: app,
                status: status
            });
        });
    }
    getAppStatusChange$(app, status = ApplicationStatus.bootstrapped) {
        return this.appStatusChange.pipe(filter(event => {
            return event.app === app && event.status === status;
        }), map(() => {
            return app;
        }));
    }
    switchModeIsCoexist(app) {
        if (app && app.switchMode) {
            return app.switchMode === SwitchModes.coexist;
        }
        else {
            return this.options.switchMode === SwitchModes.coexist;
        }
    }
    errorHandler(error) {
        this.ngZone.run(() => {
            this.options.errorHandler(error);
        });
    }
    setLoadingDone() {
        this.ngZone.run(() => {
            this.loadingDone = true;
            this.innerLoading.set(false);
        });
    }
    getAppNames(apps) {
        return apps.length === 0
            ? `[]`
            : apps.map(item => {
                return item.name;
            });
    }
    setupRouteChange() {
        this.routeChange$
            .pipe(distinctUntilChanged((x, y) => {
            return (x && x.url) === (y && y.url);
        }), 
        // Using switchMap so we cancel executing loading when a new one comes in
        switchMap(event => {
            // Return new observable use of and catchError,
            // in order to prevent routeChange$ completed which never trigger new route change
            return of(event).pipe(
            // unload apps and return should load apps
            map(() => {
                debug(`route change, url is: ${event.url}`);
                this.startRouteChangeEvent = event;
                const shouldLoadApps = this.planetApplicationService.getAppsByMatchedUrl(event.url);
                debug(`should load apps: ${this.getAppNames(shouldLoadApps)}`);
                const shouldUnloadApps = this.getUnloadApps(shouldLoadApps);
                this.appsLoadingStart$.next({
                    shouldLoadApps,
                    shouldUnloadApps
                });
                this.unloadApps(shouldUnloadApps, event);
                debug(`unload apps: ${this.getAppNames(shouldUnloadApps)}`);
                return shouldLoadApps;
            }), 
            // Load app assets (static resources)
            switchMap(shouldLoadApps => {
                let hasAppsNeedLoadingAssets = false;
                const loadApps$ = shouldLoadApps.map(app => {
                    const appStatus = this.appsStatus.get(app);
                    if (!appStatus ||
                        appStatus === ApplicationStatus.assetsLoading ||
                        appStatus === ApplicationStatus.loadError) {
                        debug(`app(${app.name}) status is ${ApplicationStatus[appStatus]}, start load assets`);
                        hasAppsNeedLoadingAssets = true;
                        return this.ngZone.runOutsideAngular(() => {
                            return this.startLoadAppAssets(app);
                        });
                    }
                    else {
                        return of(app);
                    }
                });
                if (hasAppsNeedLoadingAssets) {
                    this.loadingDone = false;
                    this.innerLoading.set(true);
                }
                return loadApps$.length > 0 ? forkJoin(loadApps$) : of([]);
            }), 
            // Bootstrap or show apps
            map(apps => {
                const apps$ = apps.map(app => {
                    return of(app).pipe(switchMap(app => {
                        const appStatus = this.appsStatus.get(app);
                        if (appStatus === ApplicationStatus.bootstrapped) {
                            debug(`[routeChange] app(${app.name}) status is bootstrapped, show app and active`);
                            this.showApp(app);
                            const appRef = getPlanetApplicationRef(app.name);
                            appRef?.navigateByUrl(event.url);
                            this.setAppStatus(app, ApplicationStatus.active);
                            this.setLoadingDone();
                            return of(app);
                        }
                        else if (appStatus === ApplicationStatus.assetsLoaded) {
                            debug(`[routeChange] app(${app.name}) status is assetsLoaded, start bootstrapping`);
                            return this.bootstrapApp(app).pipe(map(() => {
                                debug(`app(${app.name}) bootstrapped success, active it`);
                                this.setAppStatus(app, ApplicationStatus.active);
                                this.setLoadingDone();
                                return app;
                            }));
                        }
                        else if (appStatus === ApplicationStatus.active) {
                            debug(`[routeChange] app(${app.name}) is active, do nothings`);
                            const appRef = getPlanetApplicationRef(app.name);
                            // Backwards compatibility sub app use old version which has not getCurrentRouterStateUrl
                            const currentUrl = appRef?.getCurrentRouterStateUrl ? appRef.getCurrentRouterStateUrl() : '';
                            if (currentUrl !== event.url) {
                                appRef?.navigateByUrl(event.url);
                            }
                            return of(app);
                        }
                        else {
                            debug(`[routeChange] app(${app.name}) status is ${ApplicationStatus[appStatus]}`);
                            return this.getAppStatusChange$(app).pipe(take(1), map(() => {
                                debug(`app(${app.name}) status is bootstrapped by subscribe status change, active it`);
                                this.setAppStatus(app, ApplicationStatus.active);
                                this.showApp(app);
                                return app;
                            }));
                        }
                    }));
                });
                if (apps$.length > 0) {
                    debug(`start load and active apps: ${this.getAppNames(apps)}`);
                    // 切换到应用后会有闪烁现象，所以使用 setTimeout 后启动应用
                    // example: redirect to app1's dashboard from portal's about page
                    // If app's route has redirect, it doesn't work, it ok just in setTimeout, I don't know why.
                    // TODO:: remove it, it is ok in version Angular 9.x
                    setTimeout(() => {
                        // 此处判断是因为如果静态资源加载完毕还未启动被取消，还是会启动之前的应用，虽然可能性比较小，但是无法排除这种可能性，所以只有当 Event 是最后一个才会启动
                        if (this.startRouteChangeEvent === event) {
                            // runOutsideAngular for fix error: `Expected to not be in Angular Zone, but it is!`
                            this.ngZone.runOutsideAngular(() => {
                                forkJoin(apps$).subscribe(() => {
                                    this.setLoadingDone();
                                    this.ensurePreloadApps(apps);
                                });
                            });
                        }
                    });
                }
                else {
                    debug(`no apps need to be loaded, ensure preload apps`);
                    this.ensurePreloadApps(apps);
                    this.setLoadingDone();
                }
            }), 
            // Error handler
            catchError(error => {
                debug(`apps loader error: ${error}`);
                this.errorHandler(error);
                return [];
            }));
        }))
            .subscribe();
    }
    startLoadAppAssets(app) {
        if (this.inProgressAppAssetsLoads.get(app.name)) {
            return this.inProgressAppAssetsLoads.get(app.name);
        }
        else {
            const loadApp$ = this.assetsLoader.loadAppAssets(app).pipe(tap(() => {
                this.inProgressAppAssetsLoads.delete(app.name);
                this.setAppStatus(app, ApplicationStatus.assetsLoaded);
            }), map(() => {
                return app;
            }), catchError(error => {
                this.inProgressAppAssetsLoads.delete(app.name);
                this.setAppStatus(app, ApplicationStatus.loadError);
                throw error;
            }), share());
            this.inProgressAppAssetsLoads.set(app.name, loadApp$);
            this.setAppStatus(app, ApplicationStatus.assetsLoading);
            return loadApp$;
        }
    }
    hideApp(planetApp) {
        const appRef = getPlanetApplicationRef(planetApp.name);
        const appRootElement = document.querySelector(appRef?.selector || planetApp.selector);
        if (appRootElement) {
            appRootElement.setAttribute('style', 'display:none;');
        }
    }
    showApp(planetApp) {
        const appRef = getPlanetApplicationRef(planetApp.name);
        const appRootElement = document.querySelector(appRef?.selector || planetApp.selector);
        if (appRootElement) {
            appRootElement.setAttribute('style', '');
        }
    }
    destroyApp(planetApp) {
        const appRef = getPlanetApplicationRef(planetApp.name);
        if (appRef) {
            appRef.destroy();
        }
        const container = getHTMLElement(planetApp.hostParent);
        const appRootElement = container?.querySelector((appRef && appRef.selector) || planetApp.selector);
        if (appRootElement) {
            container?.removeChild(appRootElement);
        }
    }
    bootstrapApp(app, defaultStatus = 'display') {
        debug(`app(${app.name}) start bootstrapping`);
        this.setAppStatus(app, ApplicationStatus.bootstrapping);
        const appRef = getPlanetApplicationRef(app.name);
        if (appRef && appRef.bootstrap) {
            const container = getHTMLElement(app.hostParent);
            let appRootElement;
            if (container) {
                appRootElement = container.querySelector(appRef.selector || app.selector);
                if (!appRootElement) {
                    if (appRef.template) {
                        appRootElement = createElementByTemplate(appRef.template);
                    }
                    else {
                        appRootElement = document.createElement(app.selector);
                    }
                    appRootElement.setAttribute('style', 'display:none;');
                    if (app.hostClass) {
                        appRootElement.classList.add(...coerceArray(app.hostClass));
                    }
                    if (app.stylePrefix) {
                        appRootElement.classList.add(...coerceArray(app.stylePrefix));
                    }
                    container.appendChild(appRootElement);
                }
            }
            let result = appRef.bootstrap(this.portalApp);
            // Backwards compatibility promise for bootstrap
            if (result['then']) {
                result = from(result);
            }
            return result.pipe(tap(() => {
                debug(`app(${app.name}) bootstrapped success for ${defaultStatus}`);
                this.setAppStatus(app, ApplicationStatus.bootstrapped);
                if (defaultStatus === 'display' && appRootElement) {
                    appRootElement.removeAttribute('style');
                }
            }), map(() => {
                return appRef;
            }));
        }
        else {
            throw new Error(`[${app.name}] not found, make sure that the app has the correct name defined use defineApplication(${app.name}) and runtimeChunk and vendorChunk are set to true, details see https://github.com/worktile/ngx-planet#throw-error-cannot-read-property-call-of-undefined-at-__webpack_require__-bootstrap79`);
        }
    }
    getUnloadApps(activeApps) {
        const unloadApps = [];
        this.appsStatus.forEach((value, app) => {
            if (value === ApplicationStatus.active && !activeApps.find(item => item.name === app.name)) {
                unloadApps.push(app);
            }
        });
        return unloadApps;
    }
    unloadApps(shouldUnloadApps, event) {
        const hideApps = [];
        const destroyApps = [];
        shouldUnloadApps.forEach(app => {
            if (this.switchModeIsCoexist(app)) {
                debug(`hide app(${app.name}) for coexist mode`);
                hideApps.push(app);
                this.hideApp(app);
                this.setAppStatus(app, ApplicationStatus.bootstrapped);
            }
            else {
                destroyApps.push(app);
                // 销毁之前先隐藏，否则会出现闪烁，因为 destroy 是延迟执行的
                // 如果销毁不延迟执行，会出现切换到主应用的时候会有视图卡顿现象
                this.hideApp(app);
                this.setAppStatus(app, ApplicationStatus.assetsLoaded);
            }
        });
        if (hideApps.length > 0 || destroyApps.length > 0) {
            // 从其他应用切换到主应用的时候会有视图卡顿现象，所以先等主应用渲染完毕后再加载其他应用
            // 此处尝试使用 this.ngZone.onStable.pipe(take(1)) 应用之间的切换会出现闪烁
            setTimeout(() => {
                hideApps.forEach(app => {
                    const appRef = getPlanetApplicationRef(app.name);
                    if (appRef) {
                        appRef.navigateByUrl(event.url);
                    }
                });
                destroyApps.forEach(app => {
                    debug(`destroy app(${app.name})`);
                    this.destroyApp(app);
                });
            });
        }
    }
    preloadApps(activeApps) {
        setTimeout(() => {
            const toPreloadApps = this.planetApplicationService.getAppsToPreload(activeApps ? activeApps.map(item => item.name) : undefined);
            debug(`start preload apps: ${this.getAppNames(toPreloadApps)}`);
            const loadApps$ = toPreloadApps.map(preloadApp => {
                return this.preloadInternal(preloadApp);
            });
            forkJoin(loadApps$).subscribe({
                error: error => {
                    this.errorHandler(error);
                }
            });
        });
    }
    ensurePreloadApps(activeApps) {
        // Start preload apps
        // Start preload when first time app loaded
        if (this.firstLoad) {
            this.preloadApps(activeApps);
            this.firstLoad = false;
        }
    }
    setOptions(options) {
        this.options = {
            ...this.options,
            ...options
        };
    }
    /**
     * reset route by current router
     */
    reroute(event) {
        this.routeChange$.next(event);
    }
    preloadInternal(app, immediate) {
        const status = this.appsStatus.get(app);
        if (!status || status === ApplicationStatus.loadError) {
            debug(`preload app(${app.name}), status is empty, start to load assets`);
            return this.startLoadAppAssets(app).pipe(switchMap(() => {
                debug(`preload app(${app.name}), assets loaded, start bootstrap app, immediate: ${!!immediate}`);
                if (immediate) {
                    return this.bootstrapApp(app, 'hidden');
                }
                else {
                    return this.ngZone.runOutsideAngular(() => {
                        return this.bootstrapApp(app, 'hidden');
                    });
                }
            }), catchError(error => {
                this.errorHandler(error);
                return of(null);
            }), map(() => {
                return getPlanetApplicationRef(app.name);
            }));
        }
        else if ([ApplicationStatus.assetsLoading, ApplicationStatus.assetsLoaded, ApplicationStatus.bootstrapping].includes(status)) {
            debug(`preload app(${app.name}), status is ${ApplicationStatus[status]}, return until bootstrapped`);
            return this.getAppStatusChange$(app).pipe(take(1), map(() => {
                return getPlanetApplicationRef(app.name);
            }));
        }
        else {
            const appRef = getPlanetApplicationRef(app.name);
            if (!appRef) {
                throw new Error(`${app.name}'s status is ${ApplicationStatus[status]}, planetApplicationRef is null.`);
            }
            return of(appRef);
        }
    }
    /**
     * Preload planet application
     * @param app app
     * @param immediate bootstrap on stable by default, setting immediate is true, it will bootstrap immediate
     */
    preload(app, immediate) {
        return this.preloadInternal(app, immediate);
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationLoader, deps: [{ token: AssetsLoader }, { token: PlanetApplicationService }, { token: i0.NgZone }, { token: i3.Router }, { token: i0.Injector }, { token: i0.ApplicationRef }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationLoader, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationLoader, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: AssetsLoader }, { type: PlanetApplicationService }, { type: i0.NgZone }, { type: i3.Router }, { type: i0.Injector }, { type: i0.ApplicationRef }] });

class Planet {
    get planetApplicationLoader() {
        return getApplicationLoader();
    }
    get planetApplicationService() {
        return getApplicationService();
    }
    /**
     * @deprecated please use loading signal
     */
    get loadingDone() {
        return this.planetApplicationLoader.loadingDone;
    }
    get loading() {
        return this.planetApplicationLoader.loading;
    }
    get appStatusChange() {
        return this.planetApplicationLoader.appStatusChange;
    }
    get appsLoadingStart() {
        return this.planetApplicationLoader.appsLoadingStart;
    }
    constructor(injector, router, planetApplications) {
        this.injector = injector;
        this.router = router;
        if (!this.planetApplicationLoader) {
            setApplicationLoader(this.injector.get(PlanetApplicationLoader));
        }
        if (!this.planetApplicationService) {
            setApplicationService(this.injector.get(PlanetApplicationService));
        }
        if (planetApplications) {
            this.registerApps(planetApplications);
        }
    }
    setOptions(options) {
        this.planetApplicationLoader.setOptions(options);
        if (options.debugFactory) {
            setDebugFactory(options.debugFactory);
        }
    }
    setPortalAppData(data) {
        setPortalApplicationData(data);
    }
    registerApp(app) {
        this.planetApplicationService.register(app);
    }
    registerApps(apps) {
        this.planetApplicationService.register(apps);
    }
    unregisterApp(name) {
        this.planetApplicationService.unregister(name);
    }
    getApps() {
        return this.planetApplicationService.getApps();
    }
    start() {
        this.subscription = this.router.events
            .pipe(filter(event => {
            return event instanceof NavigationEnd;
        }), map(event => {
            return event.urlAfterRedirects || event.url;
        }), startWith(location.pathname), distinctUntilChanged())
            .subscribe((url) => {
            this.planetApplicationLoader.reroute({
                url: url
            });
        });
    }
    stop() {
        this.subscription?.unsubscribe();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: Planet, deps: [{ token: i0.Injector }, { token: i3.Router }, { token: PLANET_APPLICATIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: Planet, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: Planet, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i0.Injector }, { type: i3.Router }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [PLANET_APPLICATIONS]
                }, {
                    type: Optional
                }] }] });

class EmptyComponent {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: EmptyComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.2.3", type: EmptyComponent, isStandalone: true, selector: "empty-component", ngImport: i0, template: ``, isInline: true, changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: EmptyComponent, decorators: [{
            type: Component,
            args: [{
                    // eslint-disable-next-line @angular-eslint/component-selector
                    selector: 'empty-component',
                    template: ``,
                    changeDetection: ChangeDetectionStrategy.OnPush,
                    standalone: true
                }]
        }] });

class PlanetComponentRef {
}

const componentWrapperClass = 'planet-component-wrapper';
function isComponentType(component) {
    return typeof component === 'function' && component.constructor === Function;
}
class PlanetComponentLoader {
    get applicationLoader() {
        return getApplicationLoader();
    }
    get applicationService() {
        return getApplicationService();
    }
    constructor(applicationRef, ngModuleRef, ngZone, document) {
        this.applicationRef = applicationRef;
        this.ngModuleRef = ngModuleRef;
        this.ngZone = ngZone;
        this.document = document;
    }
    getPlantAppRef(name) {
        const plantAppRef = getBootstrappedPlanetApplicationRef(name);
        if (plantAppRef) {
            return of(plantAppRef);
        }
        else {
            const app = this.applicationService.getAppByName(name);
            return this.applicationLoader.preload(app, true).pipe(map(() => {
                return getPlanetApplicationRef(name);
            }));
        }
    }
    createInjector(parentInjector, componentRef) {
        return Injector.create({
            providers: [
                {
                    provide: PlanetComponentRef,
                    useValue: componentRef
                }
            ],
            parent: parentInjector
        });
    }
    getContainerElement(config) {
        if (!config.container) {
            throw new Error(`config 'container' cannot be null`);
        }
        else {
            if (config.container.nativeElement) {
                return config.container.nativeElement;
            }
            else {
                return config.container;
            }
        }
    }
    insertComponentRootNodeToContainer(container, componentRootNode, hostClass) {
        const subApp = this.applicationService.getAppByName(this.ngModuleRef.instance.appName);
        componentRootNode.classList.add(componentWrapperClass);
        componentRootNode.setAttribute('planet-inline', '');
        if (hostClass) {
            componentRootNode.classList.add(hostClass);
        }
        if (subApp && subApp.stylePrefix) {
            componentRootNode.classList.add(subApp.stylePrefix);
        }
        // container 是注释则在前方插入，否则在元素内部插入
        if (container.nodeType === 8) {
            container.parentElement.insertBefore(componentRootNode, container);
        }
        else {
            container.appendChild(componentRootNode);
        }
    }
    attachComponent(component, environmentInjector, config) {
        const plantComponentRef = new PlanetComponentRef();
        const appRef = this.applicationRef;
        const injector = this.createInjector(environmentInjector, plantComponentRef);
        const container = this.getContainerElement(config);
        const componentRef = createComponent(component, {
            environmentInjector: environmentInjector,
            elementInjector: injector
        });
        appRef.attachView(componentRef.hostView);
        const componentRootNode = this.getComponentRootNode(componentRef);
        this.insertComponentRootNodeToContainer(container, componentRootNode, config.hostClass || config.wrapperClass);
        if (config.initialState) {
            Object.assign(componentRef.instance, config.initialState);
        }
        plantComponentRef.componentInstance = componentRef.instance;
        plantComponentRef.componentRef = componentRef;
        plantComponentRef.hostElement = componentRootNode;
        plantComponentRef.dispose = () => {
            if (appRef.viewCount > 0) {
                appRef.detachView(componentRef.hostView);
            }
            componentRef?.destroy();
            componentRootNode.remove();
        };
        return plantComponentRef;
    }
    /** Gets the root HTMLElement for an instantiated component. */
    getComponentRootNode(componentRef) {
        return componentRef.hostView.rootNodes[0];
    }
    registerComponentFactory(componentOrComponents) {
        const app = this.ngModuleRef.instance.appName;
        this.getPlantAppRef(app).subscribe((appRef) => {
            appRef.registerComponentFactory((componentName, config) => {
                const components = coerceArray(componentOrComponents);
                const planetComponent = components.find(item => {
                    return isComponentType(item)
                        ? reflectComponentType(item).selector.includes(componentName)
                        : item.name === componentName;
                });
                if (planetComponent) {
                    return this.ngZone.run(() => {
                        const componentRef = this.attachComponent(isComponentType(planetComponent) ? planetComponent : planetComponent.component, appRef.appModuleRef.injector, config);
                        return componentRef;
                    });
                }
                else {
                    throw Error(`unregistered component ${componentName} in app ${app}`);
                }
            });
        });
    }
    register(components) {
        setTimeout(() => {
            this.registerComponentFactory(components);
        });
    }
    load(app, componentName, config) {
        const result = this.getPlantAppRef(app).pipe(delayWhen((appRef) => {
            if (appRef.getComponentFactory()) {
                return of('');
            }
            else {
                // Because register use 'setTimeout',so timer 20
                return timer(20);
            }
        }), map(appRef => {
            const componentFactory = appRef.getComponentFactory();
            if (componentFactory) {
                return componentFactory(componentName, config);
            }
            else {
                throw new Error(`${app}'s component(${componentName}) is not registered`);
            }
        }), shareReplay());
        result.subscribe();
        return result;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetComponentLoader, deps: [{ token: i0.ApplicationRef }, { token: i0.NgModuleRef }, { token: i0.NgZone }, { token: DOCUMENT }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetComponentLoader, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetComponentLoader, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i0.ApplicationRef }, { type: i0.NgModuleRef }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }] });

// eslint-disable-next-line @angular-eslint/directive-class-suffix
class PlanetComponentOutlet {
    constructor(elementRef, planetComponentLoader, ngZone) {
        this.elementRef = elementRef;
        this.planetComponentLoader = planetComponentLoader;
        this.ngZone = ngZone;
        this.planetComponentLoaded = new EventEmitter();
        this.destroyed$ = new Subject();
    }
    ngOnChanges(changes) {
        if (this.planetComponentOutlet && !changes['planetComponentOutlet'].isFirstChange()) {
            this.loadComponent();
        }
    }
    ngAfterViewInit() {
        this.loadComponent();
    }
    loadComponent() {
        this.clear();
        if (this.planetComponentOutlet && this.planetComponentOutletApp) {
            this.planetComponentLoader
                .load(this.planetComponentOutletApp, this.planetComponentOutlet, {
                container: this.elementRef.nativeElement,
                initialState: this.planetComponentOutletInitialState
            })
                .pipe(takeUntil(this.destroyed$))
                .subscribe(componentRef => {
                this.componentRef = componentRef;
                this.ngZone.run(() => {
                    Promise.resolve().then(() => {
                        this.planetComponentLoaded.emit(this.componentRef);
                    });
                });
            });
        }
    }
    ngOnDestroy() {
        this.clear();
        this.destroyed$.complete();
    }
    clear() {
        this.componentRef?.dispose();
        this.destroyed$.next();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetComponentOutlet, deps: [{ token: i0.ElementRef }, { token: PlanetComponentLoader }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.2.3", type: PlanetComponentOutlet, isStandalone: true, selector: "[planetComponentOutlet]", inputs: { planetComponentOutlet: "planetComponentOutlet", planetComponentOutletApp: "planetComponentOutletApp", planetComponentOutletInitialState: "planetComponentOutletInitialState" }, outputs: { planetComponentLoaded: "planetComponentLoaded" }, usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetComponentOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: '[planetComponentOutlet]',
                    standalone: true
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: PlanetComponentLoader }, { type: i0.NgZone }], propDecorators: { planetComponentOutlet: [{
                type: Input
            }], planetComponentOutletApp: [{
                type: Input
            }], planetComponentOutletInitialState: [{
                type: Input
            }], planetComponentLoaded: [{
                type: Output
            }] } });

class RouteRedirect {
    constructor(redirectTo) {
        this.activatedRoute = inject(ActivatedRoute);
        this.router = inject(Router);
        const finalRedirectTo = redirectTo || this.activatedRoute.snapshot.data['redirectTo'];
        if (finalRedirectTo) {
            const activatedRouteUrl = this.activatedRoute.pathFromRoot
                .filter(route => {
                return route.snapshot.url?.length > 0;
            })
                .map(route => {
                return route.snapshot.url.join('/');
            })
                .join('/');
            if (this.router.isActive(activatedRouteUrl, {
                matrixParams: 'exact',
                paths: 'exact',
                queryParams: 'exact',
                fragment: 'exact'
            })) {
                this.router.navigate([`${finalRedirectTo}`], 
                // By replacing the current URL in the history, we keep the Browser's Back
                // Button behavior in tact. This will allow the user to easily navigate back
                // to the previous URL without getting caught in a redirect.
                {
                    replaceUrl: true,
                    relativeTo: this.activatedRoute
                });
            }
        }
    }
}
function routeRedirect(redirectTo) {
    return new RouteRedirect(redirectTo);
}
class RedirectToRouteComponent {
    constructor() {
        this.routeRedirect = routeRedirect();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: RedirectToRouteComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.2.3", type: RedirectToRouteComponent, isStandalone: true, selector: "planet-redirect-to-route", ngImport: i0, template: '', isInline: true }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: RedirectToRouteComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'planet-redirect-to-route',
                    template: '',
                    standalone: true
                }]
        }] });
function redirectToRoute(redirectTo) {
    return {
        path: '',
        component: RedirectToRouteComponent,
        data: {
            redirectTo: redirectTo
        }
    };
}

class NgxPlanetModule {
    static forRoot(apps) {
        return {
            ngModule: NgxPlanetModule,
            providers: [
                {
                    provide: PLANET_APPLICATIONS,
                    useValue: apps
                }
            ]
        };
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: NgxPlanetModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "17.2.3", ngImport: i0, type: NgxPlanetModule, imports: [HttpClientModule, PlanetComponentOutlet, EmptyComponent, RedirectToRouteComponent], exports: [HttpClientModule, EmptyComponent, PlanetComponentOutlet] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: NgxPlanetModule, imports: [HttpClientModule, HttpClientModule] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: NgxPlanetModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [],
                    imports: [HttpClientModule, PlanetComponentOutlet, EmptyComponent, RedirectToRouteComponent],
                    providers: [],
                    exports: [HttpClientModule, EmptyComponent, PlanetComponentOutlet]
                }]
        }] });

class PlantComponentConfig {
    constructor() {
        /** Data being injected into the child component. */
        this.initialState = null;
    }
}

/*
 * Public API Surface of core
 */

/**
 * Generated bundle index. Do not edit.
 */

export { ApplicationStatus, AssetsLoader, EmptyComponent, GlobalEventDispatcher, NgxPlanetModule, PLANET_APPLICATIONS, Planet, PlanetApplicationLoader, PlanetApplicationService, PlanetComponentLoader, PlanetComponentOutlet, PlanetComponentRef, PlanetPortalApplication, PlantComponentConfig, RedirectToRouteComponent, SwitchModes, defineApplication, getPlanetApplicationRef, getPortalApplicationData, redirectToRoute, routeRedirect };
//# sourceMappingURL=worktile-planet.mjs.map
