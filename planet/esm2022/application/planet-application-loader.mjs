import { Injectable, NgZone, ApplicationRef, Injector, signal } from '@angular/core';
import { of, Subject, forkJoin, from } from 'rxjs';
import { AssetsLoader } from '../assets-loader';
import { SwitchModes } from '../planet.class';
import { switchMap, share, map, tap, distinctUntilChanged, take, filter, catchError } from 'rxjs/operators';
import { getHTMLElement, coerceArray, createElementByTemplate } from '../helpers';
import { PlanetPortalApplication } from './portal-application';
import { PlanetApplicationService } from './planet-application.service';
import { GlobalEventDispatcher } from '../global-event-dispatcher';
import { Router } from '@angular/router';
import { globalPlanet, getPlanetApplicationRef, getApplicationLoader } from '../global-planet';
import { createDebug } from '../debug';
import * as i0 from "@angular/core";
import * as i1 from "../assets-loader";
import * as i2 from "./planet-application.service";
import * as i3 from "@angular/router";
const debug = createDebug('app-loader');
export var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus[ApplicationStatus["assetsLoading"] = 1] = "assetsLoading";
    ApplicationStatus[ApplicationStatus["assetsLoaded"] = 2] = "assetsLoaded";
    ApplicationStatus[ApplicationStatus["bootstrapping"] = 3] = "bootstrapping";
    ApplicationStatus[ApplicationStatus["bootstrapped"] = 4] = "bootstrapped";
    ApplicationStatus[ApplicationStatus["active"] = 5] = "active";
    ApplicationStatus[ApplicationStatus["loadError"] = 10] = "loadError";
})(ApplicationStatus || (ApplicationStatus = {}));
export class PlanetApplicationLoader {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationLoader, deps: [{ token: i1.AssetsLoader }, { token: i2.PlanetApplicationService }, { token: i0.NgZone }, { token: i3.Router }, { token: i0.Injector }, { token: i0.ApplicationRef }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationLoader, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationLoader, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.AssetsLoader }, { type: i2.PlanetApplicationService }, { type: i0.NgZone }, { type: i3.Router }, { type: i0.Injector }, { type: i0.ApplicationRef }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbmV0LWFwcGxpY2F0aW9uLWxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL3BsYW5ldC9zcmMvYXBwbGljYXRpb24vcGxhbmV0LWFwcGxpY2F0aW9uLWxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFZLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMvRixPQUFPLEVBQUUsRUFBRSxFQUFjLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFjLE1BQU0sTUFBTSxDQUFDO0FBQzNFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNoRCxPQUFPLEVBQXdDLFdBQVcsRUFBaUIsTUFBTSxpQkFBaUIsQ0FBQztBQUNuRyxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUcsT0FBTyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFbEYsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDL0QsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDeEUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDbkUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBRSxZQUFZLEVBQUUsdUJBQXVCLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMvRixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sVUFBVSxDQUFDOzs7OztBQUN2QyxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFeEMsTUFBTSxDQUFOLElBQVksaUJBT1g7QUFQRCxXQUFZLGlCQUFpQjtJQUN6QiwyRUFBaUIsQ0FBQTtJQUNqQix5RUFBZ0IsQ0FBQTtJQUNoQiwyRUFBaUIsQ0FBQTtJQUNqQix5RUFBZ0IsQ0FBQTtJQUNoQiw2REFBVSxDQUFBO0lBQ1Ysb0VBQWMsQ0FBQTtBQUNsQixDQUFDLEVBUFcsaUJBQWlCLEtBQWpCLGlCQUFpQixRQU81QjtBQWVELE1BQU0sT0FBTyx1QkFBdUI7SUFxQmhDLElBQVcsZUFBZTtRQUN0QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNoRCxDQUFDO0lBRUQsSUFBVyxnQkFBZ0I7UUFDdkIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDakQsQ0FBQztJQVNELFlBQ1ksWUFBMEIsRUFDMUIsd0JBQWtELEVBQ2xELE1BQWMsRUFDdEIsTUFBYyxFQUNkLFFBQWtCLEVBQ2xCLGNBQThCO1FBTHRCLGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBQzFCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7UUFDbEQsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQXRDbEIsY0FBUyxHQUFHLElBQUksQ0FBQztRQU1qQiw2QkFBd0IsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztRQUU1RSxlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQXdDLENBQUM7UUFFN0QsY0FBUyxHQUFHLElBQUksdUJBQXVCLEVBQUUsQ0FBQztRQUUxQyxpQkFBWSxHQUFHLElBQUksT0FBTyxFQUFxQixDQUFDO1FBRWhELHFCQUFnQixHQUFHLElBQUksT0FBTyxFQUF3QixDQUFDO1FBRXZELHNCQUFpQixHQUFHLElBQUksT0FBTyxFQUF5QixDQUFDO1FBRXpELGlCQUFZLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBVXJDOztXQUVHO1FBQ0ksZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFFcEIsWUFBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7UUFVNUMsSUFBSSxvQkFBb0IsRUFBRSxFQUFFLENBQUM7WUFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyw0RkFBNEYsQ0FBQyxDQUFDO1FBQ2xILENBQUM7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHO1lBQ1gsVUFBVSxFQUFFLFdBQVcsQ0FBQyxPQUFPO1lBQy9CLFlBQVksRUFBRSxDQUFDLEtBQVksRUFBRSxFQUFFO2dCQUMzQixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLENBQUM7U0FDSixDQUFDO1FBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztRQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQzNFLFlBQVksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2hELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFTyxZQUFZLENBQUMsR0FBc0IsRUFBRSxNQUF5QjtRQUNsRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7WUFDakIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUMsS0FBSyxDQUNELE9BQU8sR0FBRyxDQUFDLElBQUksb0JBQW9CLFVBQVUsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sT0FBTyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUM1SCxDQUFDO1lBQ0YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7Z0JBQ3ZCLEdBQUcsRUFBRSxHQUFHO2dCQUNSLE1BQU0sRUFBRSxNQUFNO2FBQ2pCLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLG1CQUFtQixDQUFDLEdBQXNCLEVBQUUsTUFBTSxHQUFHLGlCQUFpQixDQUFDLFlBQVk7UUFDdkYsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FDNUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ1gsT0FBTyxLQUFLLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQztRQUN4RCxDQUFDLENBQUMsRUFDRixHQUFHLENBQUMsR0FBRyxFQUFFO1lBQ0wsT0FBTyxHQUFHLENBQUM7UUFDZixDQUFDLENBQUMsQ0FDTCxDQUFDO0lBQ04sQ0FBQztJQUVPLG1CQUFtQixDQUFDLEdBQXNCO1FBQzlDLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN4QixPQUFPLEdBQUcsQ0FBQyxVQUFVLEtBQUssV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUNsRCxDQUFDO2FBQU0sQ0FBQztZQUNKLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEtBQUssV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUMzRCxDQUFDO0lBQ0wsQ0FBQztJQUVPLFlBQVksQ0FBQyxLQUFZO1FBQzdCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtZQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxjQUFjO1FBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtZQUNqQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxXQUFXLENBQUMsSUFBeUI7UUFDekMsT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUM7WUFDcEIsQ0FBQyxDQUFDLElBQUk7WUFDTixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDWixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUM7SUFDYixDQUFDO0lBRU8sZ0JBQWdCO1FBQ3BCLElBQUksQ0FBQyxZQUFZO2FBQ1osSUFBSSxDQUNELG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFCLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUM7UUFDRix5RUFBeUU7UUFDekUsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2QsK0NBQStDO1lBQy9DLGtGQUFrRjtZQUNsRixPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJO1lBQ2pCLDBDQUEwQztZQUMxQyxHQUFHLENBQUMsR0FBRyxFQUFFO2dCQUNMLEtBQUssQ0FBQyx5QkFBeUIsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7Z0JBQ25DLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BGLEtBQUssQ0FBQyxxQkFBcUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDNUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQztvQkFDeEIsY0FBYztvQkFDZCxnQkFBZ0I7aUJBQ25CLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN6QyxLQUFLLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzVELE9BQU8sY0FBYyxDQUFDO1lBQzFCLENBQUMsQ0FBQztZQUNGLHFDQUFxQztZQUNyQyxTQUFTLENBQUMsY0FBYyxDQUFDLEVBQUU7Z0JBQ3ZCLElBQUksd0JBQXdCLEdBQUcsS0FBSyxDQUFDO2dCQUNyQyxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUN2QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDM0MsSUFDSSxDQUFDLFNBQVM7d0JBQ1YsU0FBUyxLQUFLLGlCQUFpQixDQUFDLGFBQWE7d0JBQzdDLFNBQVMsS0FBSyxpQkFBaUIsQ0FBQyxTQUFTLEVBQzNDLENBQUM7d0JBQ0MsS0FBSyxDQUNELE9BQU8sR0FBRyxDQUFDLElBQUksZUFBZSxpQkFBaUIsQ0FBQyxTQUE4QixDQUFDLHFCQUFxQixDQUN2RyxDQUFDO3dCQUNGLHdCQUF3QixHQUFHLElBQUksQ0FBQzt3QkFDaEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTs0QkFDdEMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ3hDLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUM7eUJBQU0sQ0FBQzt3QkFDSixPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDbkIsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLHdCQUF3QixFQUFFLENBQUM7b0JBQzNCLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO29CQUN6QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztnQkFDRCxPQUFPLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUF5QixDQUFDLENBQUM7WUFDdEYsQ0FBQyxDQUFDO1lBQ0YseUJBQXlCO1lBQ3pCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDUCxNQUFNLEtBQUssR0FBb0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDMUQsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUNmLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDWixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDM0MsSUFBSSxTQUFTLEtBQUssaUJBQWlCLENBQUMsWUFBWSxFQUFFLENBQUM7NEJBQy9DLEtBQUssQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLElBQUksK0NBQStDLENBQUMsQ0FBQzs0QkFDcEYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDbEIsTUFBTSxNQUFNLEdBQUcsdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNqRCxNQUFNLEVBQUUsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDakMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBQ2pELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzs0QkFDdEIsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ25CLENBQUM7NkJBQU0sSUFBSSxTQUFTLEtBQUssaUJBQWlCLENBQUMsWUFBWSxFQUFFLENBQUM7NEJBQ3RELEtBQUssQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLElBQUksK0NBQStDLENBQUMsQ0FBQzs0QkFDcEYsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FDOUIsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQ0FDTCxLQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxtQ0FBbUMsQ0FBQyxDQUFDO2dDQUMxRCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQ0FDakQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dDQUN0QixPQUFPLEdBQUcsQ0FBQzs0QkFDZixDQUFDLENBQUMsQ0FDTCxDQUFDO3dCQUNOLENBQUM7NkJBQU0sSUFBSSxTQUFTLEtBQUssaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUM7NEJBQ2hELEtBQUssQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLElBQUksMEJBQTBCLENBQUMsQ0FBQzs0QkFDL0QsTUFBTSxNQUFNLEdBQUcsdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNqRCx5RkFBeUY7NEJBQ3pGLE1BQU0sVUFBVSxHQUFHLE1BQU0sRUFBRSx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDN0YsSUFBSSxVQUFVLEtBQUssS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dDQUMzQixNQUFNLEVBQUUsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDckMsQ0FBQzs0QkFDRCxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDbkIsQ0FBQzs2QkFBTSxDQUFDOzRCQUNKLEtBQUssQ0FDRCxxQkFBcUIsR0FBRyxDQUFDLElBQUksZUFDekIsaUJBQWlCLENBQUMsU0FBOEIsQ0FDcEQsRUFBRSxDQUNMLENBQUM7NEJBQ0YsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUNyQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ1AsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQ0FDTCxLQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxnRUFBZ0UsQ0FBQyxDQUFDO2dDQUN2RixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQ0FDakQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQ0FDbEIsT0FBTyxHQUFHLENBQUM7NEJBQ2YsQ0FBQyxDQUFDLENBQ0wsQ0FBQzt3QkFDTixDQUFDO29CQUNMLENBQUMsQ0FBQyxDQUNMLENBQUM7Z0JBQ04sQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNuQixLQUFLLENBQUMsK0JBQStCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMvRCxxQ0FBcUM7b0JBQ3JDLGlFQUFpRTtvQkFDakUsNEZBQTRGO29CQUM1RixvREFBb0Q7b0JBQ3BELFVBQVUsQ0FBQyxHQUFHLEVBQUU7d0JBQ1osaUZBQWlGO3dCQUNqRixJQUFJLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxLQUFLLEVBQUUsQ0FBQzs0QkFDdkMsb0ZBQW9GOzRCQUNwRixJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtnQ0FDL0IsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7b0NBQzNCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQ0FDdEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO2dDQUNqQyxDQUFDLENBQUMsQ0FBQzs0QkFDUCxDQUFDLENBQUMsQ0FBQzt3QkFDUCxDQUFDO29CQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUNQLENBQUM7cUJBQU0sQ0FBQztvQkFDSixLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztvQkFDeEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUM3QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzFCLENBQUM7WUFDTCxDQUFDLENBQUM7WUFDRixnQkFBZ0I7WUFDaEIsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNmLEtBQUssQ0FBQyxzQkFBc0IsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDckMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDekIsT0FBTyxFQUFFLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FDTCxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQ0w7YUFDQSxTQUFTLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRU8sa0JBQWtCLENBQUMsR0FBc0I7UUFDN0MsSUFBSSxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzlDLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkQsQ0FBQzthQUFNLENBQUM7WUFDSixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQ3RELEdBQUcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ0wsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNELENBQUMsQ0FBQyxFQUNGLEdBQUcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ0wsT0FBTyxHQUFHLENBQUM7WUFDZixDQUFDLENBQUMsRUFDRixVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ2YsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNwRCxNQUFNLEtBQUssQ0FBQztZQUNoQixDQUFDLENBQUMsRUFDRixLQUFLLEVBQUUsQ0FDVixDQUFDO1lBQ0YsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3hELE9BQU8sUUFBUSxDQUFDO1FBQ3BCLENBQUM7SUFDTCxDQUFDO0lBRU8sT0FBTyxDQUFDLFNBQTRCO1FBQ3hDLE1BQU0sTUFBTSxHQUFHLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxRQUFRLElBQUssU0FBUyxDQUFDLFFBQW1CLENBQUMsQ0FBQztRQUNsRyxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ2pCLGNBQWMsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQzFELENBQUM7SUFDTCxDQUFDO0lBRU8sT0FBTyxDQUFDLFNBQTRCO1FBQ3hDLE1BQU0sTUFBTSxHQUFHLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxRQUFRLElBQUssU0FBUyxDQUFDLFFBQW1CLENBQUMsQ0FBQztRQUNsRyxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ2pCLGNBQWMsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLENBQUM7SUFDTCxDQUFDO0lBRU8sVUFBVSxDQUFDLFNBQTRCO1FBQzNDLE1BQU0sTUFBTSxHQUFHLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1QsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFDRCxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sY0FBYyxHQUFHLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFLLFNBQVMsQ0FBQyxRQUFtQixDQUFDLENBQUM7UUFDL0csSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNqQixTQUFTLEVBQUUsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzNDLENBQUM7SUFDTCxDQUFDO0lBRU8sWUFBWSxDQUFDLEdBQXNCLEVBQUUsZ0JBQXNDLFNBQVM7UUFDeEYsS0FBSyxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksdUJBQXVCLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN4RCxNQUFNLE1BQU0sR0FBRyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakQsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzdCLE1BQU0sU0FBUyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDakQsSUFBSSxjQUEyQixDQUFDO1lBQ2hDLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ1osY0FBYyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxHQUFHLENBQUMsUUFBUyxDQUFFLENBQUM7Z0JBQzVFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDbEIsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ2xCLGNBQWMsR0FBRyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFFLENBQUM7b0JBQy9ELENBQUM7eUJBQU0sQ0FBQzt3QkFDSixjQUFjLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUyxDQUFDLENBQUM7b0JBQzNELENBQUM7b0JBQ0QsY0FBYyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQ3RELElBQUksR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUNoQixjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDaEUsQ0FBQztvQkFDRCxJQUFJLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDbEIsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7b0JBQ2xFLENBQUM7b0JBQ0QsU0FBUyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDMUMsQ0FBQztZQUNMLENBQUM7WUFDRCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM5QyxnREFBZ0Q7WUFDaEQsSUFBSyxNQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQXFDLENBQUM7WUFDOUQsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FDZCxHQUFHLENBQUMsR0FBRyxFQUFFO2dCQUNMLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLDhCQUE4QixhQUFhLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxhQUFhLEtBQUssU0FBUyxJQUFJLGNBQWMsRUFBRSxDQUFDO29CQUNoRCxjQUFjLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLEVBQ0YsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQkFDTCxPQUFPLE1BQU0sQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FDTCxDQUFDO1FBQ04sQ0FBQzthQUFNLENBQUM7WUFDSixNQUFNLElBQUksS0FBSyxDQUNYLElBQUksR0FBRyxDQUFDLElBQUksMEZBQTBGLEdBQUcsQ0FBQyxJQUFJLDhMQUE4TCxDQUMvUyxDQUFDO1FBQ04sQ0FBQztJQUNMLENBQUM7SUFFTyxhQUFhLENBQUMsVUFBK0I7UUFDakQsTUFBTSxVQUFVLEdBQXdCLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNuQyxJQUFJLEtBQUssS0FBSyxpQkFBaUIsQ0FBQyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDekYsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QixDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLFVBQVUsQ0FBQztJQUN0QixDQUFDO0lBRU8sVUFBVSxDQUFDLGdCQUFxQyxFQUFFLEtBQXdCO1FBQzlFLE1BQU0sUUFBUSxHQUF3QixFQUFFLENBQUM7UUFDekMsTUFBTSxXQUFXLEdBQXdCLEVBQUUsQ0FBQztRQUM1QyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDM0IsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsS0FBSyxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksb0JBQW9CLENBQUMsQ0FBQztnQkFDaEQsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDM0QsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLG9DQUFvQztnQkFDcEMsaUNBQWlDO2dCQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzRCxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDaEQsNkNBQTZDO1lBQzdDLHlEQUF5RDtZQUN6RCxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNaLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ25CLE1BQU0sTUFBTSxHQUFHLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDakQsSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFDVCxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDcEMsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFDSCxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUN0QixLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztvQkFDbEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7SUFDTCxDQUFDO0lBRU8sV0FBVyxDQUFDLFVBQWdDO1FBQ2hELFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDWixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsZ0JBQWdCLENBQ2hFLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUM3RCxDQUFDO1lBQ0YsS0FBSyxDQUFDLHVCQUF1QixJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoRSxNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUM3QyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDNUMsQ0FBQyxDQUFDLENBQUM7WUFFSCxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUMxQixLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUU7b0JBQ1gsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDN0IsQ0FBQzthQUNKLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLGlCQUFpQixDQUFDLFVBQWdDO1FBQ3RELHFCQUFxQjtRQUNyQiwyQ0FBMkM7UUFDM0MsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUMzQixDQUFDO0lBQ0wsQ0FBQztJQUVNLFVBQVUsQ0FBQyxPQUErQjtRQUM3QyxJQUFJLENBQUMsT0FBTyxHQUFHO1lBQ1gsR0FBRyxJQUFJLENBQUMsT0FBTztZQUNmLEdBQUcsT0FBTztTQUNiLENBQUM7SUFDTixDQUFDO0lBRUQ7O09BRUc7SUFDSSxPQUFPLENBQUMsS0FBd0I7UUFDbkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVPLGVBQWUsQ0FBQyxHQUFzQixFQUFFLFNBQW1CO1FBQy9ELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxLQUFLLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3BELEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxJQUFJLDBDQUEwQyxDQUFDLENBQUM7WUFDekUsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUNwQyxTQUFTLENBQUMsR0FBRyxFQUFFO2dCQUNYLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxJQUFJLHFEQUFxRCxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztnQkFDakcsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDWixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO3FCQUFNLENBQUM7b0JBQ0osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTt3QkFDdEMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDNUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQztZQUNMLENBQUMsQ0FBQyxFQUNGLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDZixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6QixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQixDQUFDLENBQUMsRUFDRixHQUFHLENBQUMsR0FBRyxFQUFFO2dCQUNMLE9BQU8sdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUNMLENBQUM7UUFDTixDQUFDO2FBQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDN0gsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDLElBQUksZ0JBQWdCLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1lBQ3JHLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FDckMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNQLEdBQUcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ0wsT0FBTyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQ0wsQ0FBQztRQUNOLENBQUM7YUFBTSxDQUFDO1lBQ0osTUFBTSxNQUFNLEdBQUcsdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDVixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksZ0JBQWdCLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1lBQzNHLENBQUM7WUFDRCxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QixDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxPQUFPLENBQUMsR0FBc0IsRUFBRSxTQUFtQjtRQUN0RCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELENBQUM7OEdBL2VRLHVCQUF1QjtrSEFBdkIsdUJBQXVCLGNBRnBCLE1BQU07OzJGQUVULHVCQUF1QjtrQkFIbkMsVUFBVTttQkFBQztvQkFDUixVQUFVLEVBQUUsTUFBTTtpQkFDckIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBOZ1pvbmUsIEFwcGxpY2F0aW9uUmVmLCBJbmplY3RvciwgY29tcHV0ZWQsIHNpZ25hbCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgb2YsIE9ic2VydmFibGUsIFN1YmplY3QsIGZvcmtKb2luLCBmcm9tLCB0aHJvd0Vycm9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBBc3NldHNMb2FkZXIgfSBmcm9tICcuLi9hc3NldHMtbG9hZGVyJztcbmltcG9ydCB7IFBsYW5ldEFwcGxpY2F0aW9uLCBQbGFuZXRSb3V0ZXJFdmVudCwgU3dpdGNoTW9kZXMsIFBsYW5ldE9wdGlvbnMgfSBmcm9tICcuLi9wbGFuZXQuY2xhc3MnO1xuaW1wb3J0IHsgc3dpdGNoTWFwLCBzaGFyZSwgbWFwLCB0YXAsIGRpc3RpbmN0VW50aWxDaGFuZ2VkLCB0YWtlLCBmaWx0ZXIsIGNhdGNoRXJyb3IgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBnZXRIVE1MRWxlbWVudCwgY29lcmNlQXJyYXksIGNyZWF0ZUVsZW1lbnRCeVRlbXBsYXRlIH0gZnJvbSAnLi4vaGVscGVycyc7XG5pbXBvcnQgeyBQbGFuZXRBcHBsaWNhdGlvblJlZiB9IGZyb20gJy4vcGxhbmV0LWFwcGxpY2F0aW9uLXJlZic7XG5pbXBvcnQgeyBQbGFuZXRQb3J0YWxBcHBsaWNhdGlvbiB9IGZyb20gJy4vcG9ydGFsLWFwcGxpY2F0aW9uJztcbmltcG9ydCB7IFBsYW5ldEFwcGxpY2F0aW9uU2VydmljZSB9IGZyb20gJy4vcGxhbmV0LWFwcGxpY2F0aW9uLnNlcnZpY2UnO1xuaW1wb3J0IHsgR2xvYmFsRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnLi4vZ2xvYmFsLWV2ZW50LWRpc3BhdGNoZXInO1xuaW1wb3J0IHsgUm91dGVyIH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IGdsb2JhbFBsYW5ldCwgZ2V0UGxhbmV0QXBwbGljYXRpb25SZWYsIGdldEFwcGxpY2F0aW9uTG9hZGVyIH0gZnJvbSAnLi4vZ2xvYmFsLXBsYW5ldCc7XG5pbXBvcnQgeyBjcmVhdGVEZWJ1ZyB9IGZyb20gJy4uL2RlYnVnJztcbmNvbnN0IGRlYnVnID0gY3JlYXRlRGVidWcoJ2FwcC1sb2FkZXInKTtcblxuZXhwb3J0IGVudW0gQXBwbGljYXRpb25TdGF0dXMge1xuICAgIGFzc2V0c0xvYWRpbmcgPSAxLFxuICAgIGFzc2V0c0xvYWRlZCA9IDIsXG4gICAgYm9vdHN0cmFwcGluZyA9IDMsXG4gICAgYm9vdHN0cmFwcGVkID0gNCxcbiAgICBhY3RpdmUgPSA1LFxuICAgIGxvYWRFcnJvciA9IDEwXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwc0xvYWRpbmdTdGFydEV2ZW50IHtcbiAgICBzaG91bGRMb2FkQXBwczogUGxhbmV0QXBwbGljYXRpb25bXTtcbiAgICBzaG91bGRVbmxvYWRBcHBzOiBQbGFuZXRBcHBsaWNhdGlvbltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFwcFN0YXR1c0NoYW5nZUV2ZW50IHtcbiAgICBhcHA6IFBsYW5ldEFwcGxpY2F0aW9uO1xuICAgIHN0YXR1czogQXBwbGljYXRpb25TdGF0dXM7XG59XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgUGxhbmV0QXBwbGljYXRpb25Mb2FkZXIge1xuICAgIHByaXZhdGUgZmlyc3RMb2FkID0gdHJ1ZTtcblxuICAgIHByaXZhdGUgc3RhcnRSb3V0ZUNoYW5nZUV2ZW50ITogUGxhbmV0Um91dGVyRXZlbnQ7XG5cbiAgICBwcml2YXRlIG9wdGlvbnM6IFBsYW5ldE9wdGlvbnM7XG5cbiAgICBwcml2YXRlIGluUHJvZ3Jlc3NBcHBBc3NldHNMb2FkcyA9IG5ldyBNYXA8c3RyaW5nLCBPYnNlcnZhYmxlPFBsYW5ldEFwcGxpY2F0aW9uPj4oKTtcblxuICAgIHByaXZhdGUgYXBwc1N0YXR1cyA9IG5ldyBNYXA8UGxhbmV0QXBwbGljYXRpb24sIEFwcGxpY2F0aW9uU3RhdHVzPigpO1xuXG4gICAgcHJpdmF0ZSBwb3J0YWxBcHAgPSBuZXcgUGxhbmV0UG9ydGFsQXBwbGljYXRpb24oKTtcblxuICAgIHByaXZhdGUgcm91dGVDaGFuZ2UkID0gbmV3IFN1YmplY3Q8UGxhbmV0Um91dGVyRXZlbnQ+KCk7XG5cbiAgICBwcml2YXRlIGFwcFN0YXR1c0NoYW5nZSQgPSBuZXcgU3ViamVjdDxBcHBTdGF0dXNDaGFuZ2VFdmVudD4oKTtcblxuICAgIHByaXZhdGUgYXBwc0xvYWRpbmdTdGFydCQgPSBuZXcgU3ViamVjdDxBcHBzTG9hZGluZ1N0YXJ0RXZlbnQ+KCk7XG5cbiAgICBwcml2YXRlIGlubmVyTG9hZGluZyA9IHNpZ25hbChmYWxzZSk7XG5cbiAgICBwdWJsaWMgZ2V0IGFwcFN0YXR1c0NoYW5nZSgpOiBPYnNlcnZhYmxlPEFwcFN0YXR1c0NoYW5nZUV2ZW50PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwcFN0YXR1c0NoYW5nZSQuYXNPYnNlcnZhYmxlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBhcHBzTG9hZGluZ1N0YXJ0KCk6IE9ic2VydmFibGU8QXBwc0xvYWRpbmdTdGFydEV2ZW50PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwcHNMb2FkaW5nU3RhcnQkLmFzT2JzZXJ2YWJsZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXByZWNhdGVkIHBsZWFzZSB1c2UgbG9hZGluZyBzaWduYWxcbiAgICAgKi9cbiAgICBwdWJsaWMgbG9hZGluZ0RvbmUgPSBmYWxzZTtcblxuICAgIHB1YmxpYyBsb2FkaW5nID0gdGhpcy5pbm5lckxvYWRpbmcuYXNSZWFkb25seSgpO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgYXNzZXRzTG9hZGVyOiBBc3NldHNMb2FkZXIsXG4gICAgICAgIHByaXZhdGUgcGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlOiBQbGFuZXRBcHBsaWNhdGlvblNlcnZpY2UsXG4gICAgICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmUsXG4gICAgICAgIHJvdXRlcjogUm91dGVyLFxuICAgICAgICBpbmplY3RvcjogSW5qZWN0b3IsXG4gICAgICAgIGFwcGxpY2F0aW9uUmVmOiBBcHBsaWNhdGlvblJlZlxuICAgICkge1xuICAgICAgICBpZiAoZ2V0QXBwbGljYXRpb25Mb2FkZXIoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGFuZXRBcHBsaWNhdGlvbkxvYWRlciBoYXMgYmVlbiBpbmplY3RlZCBpbiB0aGUgcG9ydGFsLCByZXBlYXRlZCBpbmplY3Rpb24gaXMgbm90IGFsbG93ZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHN3aXRjaE1vZGU6IFN3aXRjaE1vZGVzLmRlZmF1bHQsXG4gICAgICAgICAgICBlcnJvckhhbmRsZXI6IChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5wb3J0YWxBcHAubmdab25lID0gbmdab25lO1xuICAgICAgICB0aGlzLnBvcnRhbEFwcC5hcHBsaWNhdGlvblJlZiA9IGFwcGxpY2F0aW9uUmVmO1xuICAgICAgICB0aGlzLnBvcnRhbEFwcC5yb3V0ZXIgPSByb3V0ZXI7XG4gICAgICAgIHRoaXMucG9ydGFsQXBwLmluamVjdG9yID0gaW5qZWN0b3I7XG4gICAgICAgIHRoaXMucG9ydGFsQXBwLmdsb2JhbEV2ZW50RGlzcGF0Y2hlciA9IGluamVjdG9yLmdldChHbG9iYWxFdmVudERpc3BhdGNoZXIpO1xuICAgICAgICBnbG9iYWxQbGFuZXQucG9ydGFsQXBwbGljYXRpb24gPSB0aGlzLnBvcnRhbEFwcDtcbiAgICAgICAgdGhpcy5zZXR1cFJvdXRlQ2hhbmdlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRBcHBTdGF0dXMoYXBwOiBQbGFuZXRBcHBsaWNhdGlvbiwgc3RhdHVzOiBBcHBsaWNhdGlvblN0YXR1cykge1xuICAgICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZnJvbVN0YXR1cyA9IHRoaXMuYXBwc1N0YXR1cy5nZXQoYXBwKTtcbiAgICAgICAgICAgIGRlYnVnKFxuICAgICAgICAgICAgICAgIGBhcHAoJHthcHAubmFtZX0pIHN0YXR1cyBjaGFuZ2U6ICR7ZnJvbVN0YXR1cyA/IEFwcGxpY2F0aW9uU3RhdHVzW2Zyb21TdGF0dXNdIDogJ2VtcHR5J30gPT4gJHtBcHBsaWNhdGlvblN0YXR1c1tzdGF0dXNdfWBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmFwcHNTdGF0dXMuc2V0KGFwcCwgc3RhdHVzKTtcbiAgICAgICAgICAgIHRoaXMuYXBwU3RhdHVzQ2hhbmdlJC5uZXh0KHtcbiAgICAgICAgICAgICAgICBhcHA6IGFwcCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1c1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0QXBwU3RhdHVzQ2hhbmdlJChhcHA6IFBsYW5ldEFwcGxpY2F0aW9uLCBzdGF0dXMgPSBBcHBsaWNhdGlvblN0YXR1cy5ib290c3RyYXBwZWQpOiBPYnNlcnZhYmxlPFBsYW5ldEFwcGxpY2F0aW9uPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwcFN0YXR1c0NoYW5nZS5waXBlKFxuICAgICAgICAgICAgZmlsdGVyKGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnQuYXBwID09PSBhcHAgJiYgZXZlbnQuc3RhdHVzID09PSBzdGF0dXM7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG1hcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFwcDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzd2l0Y2hNb2RlSXNDb2V4aXN0KGFwcDogUGxhbmV0QXBwbGljYXRpb24pIHtcbiAgICAgICAgaWYgKGFwcCAmJiBhcHAuc3dpdGNoTW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5zd2l0Y2hNb2RlID09PSBTd2l0Y2hNb2Rlcy5jb2V4aXN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zd2l0Y2hNb2RlID09PSBTd2l0Y2hNb2Rlcy5jb2V4aXN0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBlcnJvckhhbmRsZXIoZXJyb3I6IEVycm9yKSB7XG4gICAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZXJyb3JIYW5kbGVyKGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRMb2FkaW5nRG9uZSgpIHtcbiAgICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9hZGluZ0RvbmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5pbm5lckxvYWRpbmcuc2V0KGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRBcHBOYW1lcyhhcHBzOiBQbGFuZXRBcHBsaWNhdGlvbltdKTogc3RyaW5nIHwgc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gYXBwcy5sZW5ndGggPT09IDBcbiAgICAgICAgICAgID8gYFtdYFxuICAgICAgICAgICAgOiBhcHBzLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLm5hbWU7XG4gICAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0dXBSb3V0ZUNoYW5nZSgpIHtcbiAgICAgICAgdGhpcy5yb3V0ZUNoYW5nZSRcbiAgICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKCh4LCB5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoeCAmJiB4LnVybCkgPT09ICh5ICYmIHkudXJsKTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAvLyBVc2luZyBzd2l0Y2hNYXAgc28gd2UgY2FuY2VsIGV4ZWN1dGluZyBsb2FkaW5nIHdoZW4gYSBuZXcgb25lIGNvbWVzIGluXG4gICAgICAgICAgICAgICAgc3dpdGNoTWFwKGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIG5ldyBvYnNlcnZhYmxlIHVzZSBvZiBhbmQgY2F0Y2hFcnJvcixcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gb3JkZXIgdG8gcHJldmVudCByb3V0ZUNoYW5nZSQgY29tcGxldGVkIHdoaWNoIG5ldmVyIHRyaWdnZXIgbmV3IHJvdXRlIGNoYW5nZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2YoZXZlbnQpLnBpcGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB1bmxvYWQgYXBwcyBhbmQgcmV0dXJuIHNob3VsZCBsb2FkIGFwcHNcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcoYHJvdXRlIGNoYW5nZSwgdXJsIGlzOiAke2V2ZW50LnVybH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0Um91dGVDaGFuZ2VFdmVudCA9IGV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNob3VsZExvYWRBcHBzID0gdGhpcy5wbGFuZXRBcHBsaWNhdGlvblNlcnZpY2UuZ2V0QXBwc0J5TWF0Y2hlZFVybChldmVudC51cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBzaG91bGQgbG9hZCBhcHBzOiAke3RoaXMuZ2V0QXBwTmFtZXMoc2hvdWxkTG9hZEFwcHMpfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNob3VsZFVubG9hZEFwcHMgPSB0aGlzLmdldFVubG9hZEFwcHMoc2hvdWxkTG9hZEFwcHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwc0xvYWRpbmdTdGFydCQubmV4dCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZExvYWRBcHBzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG91bGRVbmxvYWRBcHBzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51bmxvYWRBcHBzKHNob3VsZFVubG9hZEFwcHMsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgdW5sb2FkIGFwcHM6ICR7dGhpcy5nZXRBcHBOYW1lcyhzaG91bGRVbmxvYWRBcHBzKX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hvdWxkTG9hZEFwcHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIExvYWQgYXBwIGFzc2V0cyAoc3RhdGljIHJlc291cmNlcylcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaE1hcChzaG91bGRMb2FkQXBwcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc0FwcHNOZWVkTG9hZGluZ0Fzc2V0cyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYWRBcHBzJCA9IHNob3VsZExvYWRBcHBzLm1hcChhcHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhcHBTdGF0dXMgPSB0aGlzLmFwcHNTdGF0dXMuZ2V0KGFwcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFhcHBTdGF0dXMgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcFN0YXR1cyA9PT0gQXBwbGljYXRpb25TdGF0dXMuYXNzZXRzTG9hZGluZyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwU3RhdHVzID09PSBBcHBsaWNhdGlvblN0YXR1cy5sb2FkRXJyb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgYXBwKCR7YXBwLm5hbWV9KSBzdGF0dXMgaXMgJHtBcHBsaWNhdGlvblN0YXR1c1thcHBTdGF0dXMgYXMgQXBwbGljYXRpb25TdGF0dXNdfSwgc3RhcnQgbG9hZCBhc3NldHNgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzQXBwc05lZWRMb2FkaW5nQXNzZXRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnRMb2FkQXBwQXNzZXRzKGFwcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvZihhcHApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0FwcHNOZWVkTG9hZGluZ0Fzc2V0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdEb25lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5uZXJMb2FkaW5nLnNldCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRBcHBzJC5sZW5ndGggPiAwID8gZm9ya0pvaW4obG9hZEFwcHMkKSA6IG9mKFtdIGFzIFBsYW5ldEFwcGxpY2F0aW9uW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCb290c3RyYXAgb3Igc2hvdyBhcHBzXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXAoYXBwcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXBwcyQ6IE9ic2VydmFibGU8UGxhbmV0QXBwbGljYXRpb24+W10gPSBhcHBzLm1hcChhcHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2YoYXBwKS5waXBlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoTWFwKGFwcCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXBwU3RhdHVzID0gdGhpcy5hcHBzU3RhdHVzLmdldChhcHApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcHBTdGF0dXMgPT09IEFwcGxpY2F0aW9uU3RhdHVzLmJvb3RzdHJhcHBlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgW3JvdXRlQ2hhbmdlXSBhcHAoJHthcHAubmFtZX0pIHN0YXR1cyBpcyBib290c3RyYXBwZWQsIHNob3cgYXBwIGFuZCBhY3RpdmVgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93QXBwKGFwcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFwcFJlZiA9IGdldFBsYW5ldEFwcGxpY2F0aW9uUmVmKGFwcC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwUmVmPy5uYXZpZ2F0ZUJ5VXJsKGV2ZW50LnVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QXBwU3RhdHVzKGFwcCwgQXBwbGljYXRpb25TdGF0dXMuYWN0aXZlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nRG9uZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2YoYXBwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFwcFN0YXR1cyA9PT0gQXBwbGljYXRpb25TdGF0dXMuYXNzZXRzTG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBbcm91dGVDaGFuZ2VdIGFwcCgke2FwcC5uYW1lfSkgc3RhdHVzIGlzIGFzc2V0c0xvYWRlZCwgc3RhcnQgYm9vdHN0cmFwcGluZ2ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ib290c3RyYXBBcHAoYXBwKS5waXBlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgYXBwKCR7YXBwLm5hbWV9KSBib290c3RyYXBwZWQgc3VjY2VzcywgYWN0aXZlIGl0YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBcHBTdGF0dXMoYXBwLCBBcHBsaWNhdGlvblN0YXR1cy5hY3RpdmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZ0RvbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXBwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFwcFN0YXR1cyA9PT0gQXBwbGljYXRpb25TdGF0dXMuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBbcm91dGVDaGFuZ2VdIGFwcCgke2FwcC5uYW1lfSkgaXMgYWN0aXZlLCBkbyBub3RoaW5nc2ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhcHBSZWYgPSBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZihhcHAubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHN1YiBhcHAgdXNlIG9sZCB2ZXJzaW9uIHdoaWNoIGhhcyBub3QgZ2V0Q3VycmVudFJvdXRlclN0YXRlVXJsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRVcmwgPSBhcHBSZWY/LmdldEN1cnJlbnRSb3V0ZXJTdGF0ZVVybCA/IGFwcFJlZi5nZXRDdXJyZW50Um91dGVyU3RhdGVVcmwoKSA6ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFVybCAhPT0gZXZlbnQudXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBSZWY/Lm5hdmlnYXRlQnlVcmwoZXZlbnQudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2YoYXBwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBbcm91dGVDaGFuZ2VdIGFwcCgke2FwcC5uYW1lfSkgc3RhdHVzIGlzICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXBwbGljYXRpb25TdGF0dXNbYXBwU3RhdHVzIGFzIEFwcGxpY2F0aW9uU3RhdHVzXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXBwU3RhdHVzQ2hhbmdlJChhcHApLnBpcGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWtlKDEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgYXBwKCR7YXBwLm5hbWV9KSBzdGF0dXMgaXMgYm9vdHN0cmFwcGVkIGJ5IHN1YnNjcmliZSBzdGF0dXMgY2hhbmdlLCBhY3RpdmUgaXRgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEFwcFN0YXR1cyhhcHAsIEFwcGxpY2F0aW9uU3RhdHVzLmFjdGl2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93QXBwKGFwcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcHBzJC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBzdGFydCBsb2FkIGFuZCBhY3RpdmUgYXBwczogJHt0aGlzLmdldEFwcE5hbWVzKGFwcHMpfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDliIfmjaLliLDlupTnlKjlkI7kvJrmnInpl6rng4HnjrDosaHvvIzmiYDku6Xkvb/nlKggc2V0VGltZW91dCDlkI7lkK/liqjlupTnlKhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhhbXBsZTogcmVkaXJlY3QgdG8gYXBwMSdzIGRhc2hib2FyZCBmcm9tIHBvcnRhbCdzIGFib3V0IHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgYXBwJ3Mgcm91dGUgaGFzIHJlZGlyZWN0LCBpdCBkb2Vzbid0IHdvcmssIGl0IG9rIGp1c3QgaW4gc2V0VGltZW91dCwgSSBkb24ndCBrbm93IHdoeS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzo6IHJlbW92ZSBpdCwgaXQgaXMgb2sgaW4gdmVyc2lvbiBBbmd1bGFyIDkueFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOatpOWkhOWIpOaWreaYr+WboOS4uuWmguaenOmdmeaAgei1hOa6kOWKoOi9veWujOavlei/mOacquWQr+WKqOiiq+WPlua2iO+8jOi/mOaYr+S8muWQr+WKqOS5i+WJjeeahOW6lOeUqO+8jOiZveeEtuWPr+iDveaAp+avlOi+g+Wwj++8jOS9huaYr+aXoOazleaOkumZpOi/meenjeWPr+iDveaAp++8jOaJgOS7peWPquacieW9kyBFdmVudCDmmK/mnIDlkI7kuIDkuKrmiY3kvJrlkK/liqhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXJ0Um91dGVDaGFuZ2VFdmVudCA9PT0gZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBydW5PdXRzaWRlQW5ndWxhciBmb3IgZml4IGVycm9yOiBgRXhwZWN0ZWQgdG8gbm90IGJlIGluIEFuZ3VsYXIgWm9uZSwgYnV0IGl0IGlzIWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmtKb2luKGFwcHMkKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRMb2FkaW5nRG9uZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnN1cmVQcmVsb2FkQXBwcyhhcHBzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBubyBhcHBzIG5lZWQgdG8gYmUgbG9hZGVkLCBlbnN1cmUgcHJlbG9hZCBhcHBzYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW5zdXJlUHJlbG9hZEFwcHMoYXBwcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZ0RvbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVycm9yIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoRXJyb3IoZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGBhcHBzIGxvYWRlciBlcnJvcjogJHtlcnJvcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9ySGFuZGxlcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhcnRMb2FkQXBwQXNzZXRzKGFwcDogUGxhbmV0QXBwbGljYXRpb24pOiBPYnNlcnZhYmxlPFBsYW5ldEFwcGxpY2F0aW9uPiB7XG4gICAgICAgIGlmICh0aGlzLmluUHJvZ3Jlc3NBcHBBc3NldHNMb2Fkcy5nZXQoYXBwLm5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pblByb2dyZXNzQXBwQXNzZXRzTG9hZHMuZ2V0KGFwcC5uYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGxvYWRBcHAkID0gdGhpcy5hc3NldHNMb2FkZXIubG9hZEFwcEFzc2V0cyhhcHApLnBpcGUoXG4gICAgICAgICAgICAgICAgdGFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pblByb2dyZXNzQXBwQXNzZXRzTG9hZHMuZGVsZXRlKGFwcC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBcHBTdGF0dXMoYXBwLCBBcHBsaWNhdGlvblN0YXR1cy5hc3NldHNMb2FkZWQpO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG1hcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcHA7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgY2F0Y2hFcnJvcihlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5Qcm9ncmVzc0FwcEFzc2V0c0xvYWRzLmRlbGV0ZShhcHAubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QXBwU3RhdHVzKGFwcCwgQXBwbGljYXRpb25TdGF0dXMubG9hZEVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgc2hhcmUoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuaW5Qcm9ncmVzc0FwcEFzc2V0c0xvYWRzLnNldChhcHAubmFtZSwgbG9hZEFwcCQpO1xuICAgICAgICAgICAgdGhpcy5zZXRBcHBTdGF0dXMoYXBwLCBBcHBsaWNhdGlvblN0YXR1cy5hc3NldHNMb2FkaW5nKTtcbiAgICAgICAgICAgIHJldHVybiBsb2FkQXBwJDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaGlkZUFwcChwbGFuZXRBcHA6IFBsYW5ldEFwcGxpY2F0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFwcFJlZiA9IGdldFBsYW5ldEFwcGxpY2F0aW9uUmVmKHBsYW5ldEFwcC5uYW1lKTtcbiAgICAgICAgY29uc3QgYXBwUm9vdEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGFwcFJlZj8uc2VsZWN0b3IgfHwgKHBsYW5ldEFwcC5zZWxlY3RvciBhcyBzdHJpbmcpKTtcbiAgICAgICAgaWYgKGFwcFJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBhcHBSb290RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6bm9uZTsnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd0FwcChwbGFuZXRBcHA6IFBsYW5ldEFwcGxpY2F0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFwcFJlZiA9IGdldFBsYW5ldEFwcGxpY2F0aW9uUmVmKHBsYW5ldEFwcC5uYW1lKTtcbiAgICAgICAgY29uc3QgYXBwUm9vdEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGFwcFJlZj8uc2VsZWN0b3IgfHwgKHBsYW5ldEFwcC5zZWxlY3RvciBhcyBzdHJpbmcpKTtcbiAgICAgICAgaWYgKGFwcFJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBhcHBSb290RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBkZXN0cm95QXBwKHBsYW5ldEFwcDogUGxhbmV0QXBwbGljYXRpb24pIHtcbiAgICAgICAgY29uc3QgYXBwUmVmID0gZ2V0UGxhbmV0QXBwbGljYXRpb25SZWYocGxhbmV0QXBwLm5hbWUpO1xuICAgICAgICBpZiAoYXBwUmVmKSB7XG4gICAgICAgICAgICBhcHBSZWYuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGdldEhUTUxFbGVtZW50KHBsYW5ldEFwcC5ob3N0UGFyZW50KTtcbiAgICAgICAgY29uc3QgYXBwUm9vdEVsZW1lbnQgPSBjb250YWluZXI/LnF1ZXJ5U2VsZWN0b3IoKGFwcFJlZiAmJiBhcHBSZWYuc2VsZWN0b3IpIHx8IChwbGFuZXRBcHAuc2VsZWN0b3IgYXMgc3RyaW5nKSk7XG4gICAgICAgIGlmIChhcHBSb290RWxlbWVudCkge1xuICAgICAgICAgICAgY29udGFpbmVyPy5yZW1vdmVDaGlsZChhcHBSb290RWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGJvb3RzdHJhcEFwcChhcHA6IFBsYW5ldEFwcGxpY2F0aW9uLCBkZWZhdWx0U3RhdHVzOiAnaGlkZGVuJyB8ICdkaXNwbGF5JyA9ICdkaXNwbGF5Jyk6IE9ic2VydmFibGU8UGxhbmV0QXBwbGljYXRpb25SZWY+IHtcbiAgICAgICAgZGVidWcoYGFwcCgke2FwcC5uYW1lfSkgc3RhcnQgYm9vdHN0cmFwcGluZ2ApO1xuICAgICAgICB0aGlzLnNldEFwcFN0YXR1cyhhcHAsIEFwcGxpY2F0aW9uU3RhdHVzLmJvb3RzdHJhcHBpbmcpO1xuICAgICAgICBjb25zdCBhcHBSZWYgPSBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZihhcHAubmFtZSk7XG4gICAgICAgIGlmIChhcHBSZWYgJiYgYXBwUmVmLmJvb3RzdHJhcCkge1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gZ2V0SFRNTEVsZW1lbnQoYXBwLmhvc3RQYXJlbnQpO1xuICAgICAgICAgICAgbGV0IGFwcFJvb3RFbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICBhcHBSb290RWxlbWVudCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGFwcFJlZi5zZWxlY3RvciB8fCBhcHAuc2VsZWN0b3IhKSE7XG4gICAgICAgICAgICAgICAgaWYgKCFhcHBSb290RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXBwUmVmLnRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBSb290RWxlbWVudCA9IGNyZWF0ZUVsZW1lbnRCeVRlbXBsYXRlKGFwcFJlZi50ZW1wbGF0ZSkhO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwUm9vdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGFwcC5zZWxlY3RvciEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFwcFJvb3RFbGVtZW50LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTpub25lOycpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXBwLmhvc3RDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwUm9vdEVsZW1lbnQuY2xhc3NMaXN0LmFkZCguLi5jb2VyY2VBcnJheShhcHAuaG9zdENsYXNzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFwcC5zdHlsZVByZWZpeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwUm9vdEVsZW1lbnQuY2xhc3NMaXN0LmFkZCguLi5jb2VyY2VBcnJheShhcHAuc3R5bGVQcmVmaXgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwUm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCByZXN1bHQgPSBhcHBSZWYuYm9vdHN0cmFwKHRoaXMucG9ydGFsQXBwKTtcbiAgICAgICAgICAgIC8vIEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHByb21pc2UgZm9yIGJvb3RzdHJhcFxuICAgICAgICAgICAgaWYgKChyZXN1bHQgYXMgYW55KVsndGhlbiddKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZnJvbShyZXN1bHQpIGFzIE9ic2VydmFibGU8UGxhbmV0QXBwbGljYXRpb25SZWY+O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5waXBlKFxuICAgICAgICAgICAgICAgIHRhcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBhcHAoJHthcHAubmFtZX0pIGJvb3RzdHJhcHBlZCBzdWNjZXNzIGZvciAke2RlZmF1bHRTdGF0dXN9YCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QXBwU3RhdHVzKGFwcCwgQXBwbGljYXRpb25TdGF0dXMuYm9vdHN0cmFwcGVkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlZmF1bHRTdGF0dXMgPT09ICdkaXNwbGF5JyAmJiBhcHBSb290RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwUm9vdEVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbWFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcFJlZjtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBgWyR7YXBwLm5hbWV9XSBub3QgZm91bmQsIG1ha2Ugc3VyZSB0aGF0IHRoZSBhcHAgaGFzIHRoZSBjb3JyZWN0IG5hbWUgZGVmaW5lZCB1c2UgZGVmaW5lQXBwbGljYXRpb24oJHthcHAubmFtZX0pIGFuZCBydW50aW1lQ2h1bmsgYW5kIHZlbmRvckNodW5rIGFyZSBzZXQgdG8gdHJ1ZSwgZGV0YWlscyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3dvcmt0aWxlL25neC1wbGFuZXQjdGhyb3ctZXJyb3ItY2Fubm90LXJlYWQtcHJvcGVydHktY2FsbC1vZi11bmRlZmluZWQtYXQtX193ZWJwYWNrX3JlcXVpcmVfXy1ib290c3RyYXA3OWBcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFVubG9hZEFwcHMoYWN0aXZlQXBwczogUGxhbmV0QXBwbGljYXRpb25bXSkge1xuICAgICAgICBjb25zdCB1bmxvYWRBcHBzOiBQbGFuZXRBcHBsaWNhdGlvbltdID0gW107XG4gICAgICAgIHRoaXMuYXBwc1N0YXR1cy5mb3JFYWNoKCh2YWx1ZSwgYXBwKSA9PiB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IEFwcGxpY2F0aW9uU3RhdHVzLmFjdGl2ZSAmJiAhYWN0aXZlQXBwcy5maW5kKGl0ZW0gPT4gaXRlbS5uYW1lID09PSBhcHAubmFtZSkpIHtcbiAgICAgICAgICAgICAgICB1bmxvYWRBcHBzLnB1c2goYXBwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB1bmxvYWRBcHBzO1xuICAgIH1cblxuICAgIHByaXZhdGUgdW5sb2FkQXBwcyhzaG91bGRVbmxvYWRBcHBzOiBQbGFuZXRBcHBsaWNhdGlvbltdLCBldmVudDogUGxhbmV0Um91dGVyRXZlbnQpIHtcbiAgICAgICAgY29uc3QgaGlkZUFwcHM6IFBsYW5ldEFwcGxpY2F0aW9uW10gPSBbXTtcbiAgICAgICAgY29uc3QgZGVzdHJveUFwcHM6IFBsYW5ldEFwcGxpY2F0aW9uW10gPSBbXTtcbiAgICAgICAgc2hvdWxkVW5sb2FkQXBwcy5mb3JFYWNoKGFwcCA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5zd2l0Y2hNb2RlSXNDb2V4aXN0KGFwcCkpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZyhgaGlkZSBhcHAoJHthcHAubmFtZX0pIGZvciBjb2V4aXN0IG1vZGVgKTtcbiAgICAgICAgICAgICAgICBoaWRlQXBwcy5wdXNoKGFwcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlQXBwKGFwcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBcHBTdGF0dXMoYXBwLCBBcHBsaWNhdGlvblN0YXR1cy5ib290c3RyYXBwZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXN0cm95QXBwcy5wdXNoKGFwcCk7XG4gICAgICAgICAgICAgICAgLy8g6ZSA5q+B5LmL5YmN5YWI6ZqQ6JeP77yM5ZCm5YiZ5Lya5Ye6546w6Zeq54OB77yM5Zug5Li6IGRlc3Ryb3kg5piv5bu26L+f5omn6KGM55qEXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c6ZSA5q+B5LiN5bu26L+f5omn6KGM77yM5Lya5Ye6546w5YiH5o2i5Yiw5Li75bqU55So55qE5pe25YCZ5Lya5pyJ6KeG5Zu+5Y2h6aG/546w6LGhXG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlQXBwKGFwcCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRBcHBTdGF0dXMoYXBwLCBBcHBsaWNhdGlvblN0YXR1cy5hc3NldHNMb2FkZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoaGlkZUFwcHMubGVuZ3RoID4gMCB8fCBkZXN0cm95QXBwcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyDku47lhbbku5blupTnlKjliIfmjaLliLDkuLvlupTnlKjnmoTml7blgJnkvJrmnInop4blm77ljaHpob/njrDosaHvvIzmiYDku6XlhYjnrYnkuLvlupTnlKjmuLLmn5Plrozmr5XlkI7lho3liqDovb3lhbbku5blupTnlKhcbiAgICAgICAgICAgIC8vIOatpOWkhOWwneivleS9v+eUqCB0aGlzLm5nWm9uZS5vblN0YWJsZS5waXBlKHRha2UoMSkpIOW6lOeUqOS5i+mXtOeahOWIh+aNouS8muWHuueOsOmXqueDgVxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaGlkZUFwcHMuZm9yRWFjaChhcHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcHBSZWYgPSBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZihhcHAubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcHBSZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcFJlZi5uYXZpZ2F0ZUJ5VXJsKGV2ZW50LnVybCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBkZXN0cm95QXBwcy5mb3JFYWNoKGFwcCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBkZXN0cm95IGFwcCgke2FwcC5uYW1lfSlgKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95QXBwKGFwcCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcHJlbG9hZEFwcHMoYWN0aXZlQXBwcz86IFBsYW5ldEFwcGxpY2F0aW9uW10pIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0b1ByZWxvYWRBcHBzID0gdGhpcy5wbGFuZXRBcHBsaWNhdGlvblNlcnZpY2UuZ2V0QXBwc1RvUHJlbG9hZChcbiAgICAgICAgICAgICAgICBhY3RpdmVBcHBzID8gYWN0aXZlQXBwcy5tYXAoaXRlbSA9PiBpdGVtLm5hbWUpIDogdW5kZWZpbmVkXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgZGVidWcoYHN0YXJ0IHByZWxvYWQgYXBwczogJHt0aGlzLmdldEFwcE5hbWVzKHRvUHJlbG9hZEFwcHMpfWApO1xuICAgICAgICAgICAgY29uc3QgbG9hZEFwcHMkID0gdG9QcmVsb2FkQXBwcy5tYXAocHJlbG9hZEFwcCA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJlbG9hZEludGVybmFsKHByZWxvYWRBcHApO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGZvcmtKb2luKGxvYWRBcHBzJCkuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9ySGFuZGxlcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZW5zdXJlUHJlbG9hZEFwcHMoYWN0aXZlQXBwcz86IFBsYW5ldEFwcGxpY2F0aW9uW10pIHtcbiAgICAgICAgLy8gU3RhcnQgcHJlbG9hZCBhcHBzXG4gICAgICAgIC8vIFN0YXJ0IHByZWxvYWQgd2hlbiBmaXJzdCB0aW1lIGFwcCBsb2FkZWRcbiAgICAgICAgaWYgKHRoaXMuZmlyc3RMb2FkKSB7XG4gICAgICAgICAgICB0aGlzLnByZWxvYWRBcHBzKGFjdGl2ZUFwcHMpO1xuICAgICAgICAgICAgdGhpcy5maXJzdExvYWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRPcHRpb25zKG9wdGlvbnM6IFBhcnRpYWw8UGxhbmV0T3B0aW9ucz4pIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgICAgICAgLi4udGhpcy5vcHRpb25zLFxuICAgICAgICAgICAgLi4ub3B0aW9uc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHJlc2V0IHJvdXRlIGJ5IGN1cnJlbnQgcm91dGVyXG4gICAgICovXG4gICAgcHVibGljIHJlcm91dGUoZXZlbnQ6IFBsYW5ldFJvdXRlckV2ZW50KSB7XG4gICAgICAgIHRoaXMucm91dGVDaGFuZ2UkLm5leHQoZXZlbnQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcHJlbG9hZEludGVybmFsKGFwcDogUGxhbmV0QXBwbGljYXRpb24sIGltbWVkaWF0ZT86IGJvb2xlYW4pOiBPYnNlcnZhYmxlPFBsYW5ldEFwcGxpY2F0aW9uUmVmIHwgbnVsbD4ge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLmFwcHNTdGF0dXMuZ2V0KGFwcCk7XG4gICAgICAgIGlmICghc3RhdHVzIHx8IHN0YXR1cyA9PT0gQXBwbGljYXRpb25TdGF0dXMubG9hZEVycm9yKSB7XG4gICAgICAgICAgICBkZWJ1ZyhgcHJlbG9hZCBhcHAoJHthcHAubmFtZX0pLCBzdGF0dXMgaXMgZW1wdHksIHN0YXJ0IHRvIGxvYWQgYXNzZXRzYCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGFydExvYWRBcHBBc3NldHMoYXBwKS5waXBlKFxuICAgICAgICAgICAgICAgIHN3aXRjaE1hcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKGBwcmVsb2FkIGFwcCgke2FwcC5uYW1lfSksIGFzc2V0cyBsb2FkZWQsIHN0YXJ0IGJvb3RzdHJhcCBhcHAsIGltbWVkaWF0ZTogJHshIWltbWVkaWF0ZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGltbWVkaWF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYm9vdHN0cmFwQXBwKGFwcCwgJ2hpZGRlbicpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ib290c3RyYXBBcHAoYXBwLCAnaGlkZGVuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGNhdGNoRXJyb3IoZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9ySGFuZGxlcihlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvZihudWxsKTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBtYXAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0UGxhbmV0QXBwbGljYXRpb25SZWYoYXBwLm5hbWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKFtBcHBsaWNhdGlvblN0YXR1cy5hc3NldHNMb2FkaW5nLCBBcHBsaWNhdGlvblN0YXR1cy5hc3NldHNMb2FkZWQsIEFwcGxpY2F0aW9uU3RhdHVzLmJvb3RzdHJhcHBpbmddLmluY2x1ZGVzKHN0YXR1cykpIHtcbiAgICAgICAgICAgIGRlYnVnKGBwcmVsb2FkIGFwcCgke2FwcC5uYW1lfSksIHN0YXR1cyBpcyAke0FwcGxpY2F0aW9uU3RhdHVzW3N0YXR1c119LCByZXR1cm4gdW50aWwgYm9vdHN0cmFwcGVkYCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBcHBTdGF0dXNDaGFuZ2UkKGFwcCkucGlwZShcbiAgICAgICAgICAgICAgICB0YWtlKDEpLFxuICAgICAgICAgICAgICAgIG1hcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZihhcHAubmFtZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBhcHBSZWYgPSBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZihhcHAubmFtZSk7XG4gICAgICAgICAgICBpZiAoIWFwcFJlZikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHthcHAubmFtZX0ncyBzdGF0dXMgaXMgJHtBcHBsaWNhdGlvblN0YXR1c1tzdGF0dXNdfSwgcGxhbmV0QXBwbGljYXRpb25SZWYgaXMgbnVsbC5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvZihhcHBSZWYpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJlbG9hZCBwbGFuZXQgYXBwbGljYXRpb25cbiAgICAgKiBAcGFyYW0gYXBwIGFwcFxuICAgICAqIEBwYXJhbSBpbW1lZGlhdGUgYm9vdHN0cmFwIG9uIHN0YWJsZSBieSBkZWZhdWx0LCBzZXR0aW5nIGltbWVkaWF0ZSBpcyB0cnVlLCBpdCB3aWxsIGJvb3RzdHJhcCBpbW1lZGlhdGVcbiAgICAgKi9cbiAgICBwdWJsaWMgcHJlbG9hZChhcHA6IFBsYW5ldEFwcGxpY2F0aW9uLCBpbW1lZGlhdGU/OiBib29sZWFuKTogT2JzZXJ2YWJsZTxQbGFuZXRBcHBsaWNhdGlvblJlZj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wcmVsb2FkSW50ZXJuYWwoYXBwLCBpbW1lZGlhdGUpO1xuICAgIH1cbn1cbiJdfQ==