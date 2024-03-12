import { Injectable, NgZone, ApplicationRef, Injector } from '@angular/core';
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
        this.loadingDone = false;
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
                            const currentUrl = appRef?.getCurrentRouterStateUrl
                                ? appRef.getCurrentRouterStateUrl()
                                : '';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbmV0LWFwcGxpY2F0aW9uLWxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL3BsYW5ldC9zcmMvYXBwbGljYXRpb24vcGxhbmV0LWFwcGxpY2F0aW9uLWxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzdFLE9BQU8sRUFBRSxFQUFFLEVBQWMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQWMsTUFBTSxNQUFNLENBQUM7QUFDM0UsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ2hELE9BQU8sRUFBd0MsV0FBVyxFQUFpQixNQUFNLGlCQUFpQixDQUFDO0FBQ25HLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1RyxPQUFPLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSx1QkFBdUIsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUVsRixPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUMvRCxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUN4RSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUNuRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFFLFlBQVksRUFBRSx1QkFBdUIsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQy9GLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxVQUFVLENBQUM7Ozs7O0FBQ3ZDLE1BQU0sS0FBSyxHQUFHLFdBQVcs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QUM7WUFDQyxLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsSUFBSSxnQkFBZ0IsaUJBQWlCLENBQUMsTUFBTSxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDckcsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUNyQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ1AsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQkFDTCxPQUFPLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FDTCxDQUFDO1FBQ04sQ0FBQzthQUFNLENBQUM7WUFDSixNQUFNLE1BQU0sR0FBRyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxnQkFBZ0IsaUJBQWlCLENBQUMsTUFBTSxDQUFDLGlDQUFpQyxDQUFDLENBQUM7WUFDM0csQ0FBQztZQUNELE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLE9BQU8sQ0FBQyxHQUFzQixFQUFFLFNBQW1CO1FBQ3RELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDaEQsQ0FBQzs4R0E5ZlEsdUJBQXVCO2tIQUF2Qix1QkFBdUIsY0FGcEIsTUFBTTs7MkZBRVQsdUJBQXVCO2tCQUhuQyxVQUFVO21CQUFDO29CQUNSLFVBQVUsRUFBRSxNQUFNO2lCQUNyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE5nWm9uZSwgQXBwbGljYXRpb25SZWYsIEluamVjdG9yIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBvZiwgT2JzZXJ2YWJsZSwgU3ViamVjdCwgZm9ya0pvaW4sIGZyb20sIHRocm93RXJyb3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IEFzc2V0c0xvYWRlciB9IGZyb20gJy4uL2Fzc2V0cy1sb2FkZXInO1xuaW1wb3J0IHsgUGxhbmV0QXBwbGljYXRpb24sIFBsYW5ldFJvdXRlckV2ZW50LCBTd2l0Y2hNb2RlcywgUGxhbmV0T3B0aW9ucyB9IGZyb20gJy4uL3BsYW5ldC5jbGFzcyc7XG5pbXBvcnQgeyBzd2l0Y2hNYXAsIHNoYXJlLCBtYXAsIHRhcCwgZGlzdGluY3RVbnRpbENoYW5nZWQsIHRha2UsIGZpbHRlciwgY2F0Y2hFcnJvciB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IGdldEhUTUxFbGVtZW50LCBjb2VyY2VBcnJheSwgY3JlYXRlRWxlbWVudEJ5VGVtcGxhdGUgfSBmcm9tICcuLi9oZWxwZXJzJztcbmltcG9ydCB7IFBsYW5ldEFwcGxpY2F0aW9uUmVmIH0gZnJvbSAnLi9wbGFuZXQtYXBwbGljYXRpb24tcmVmJztcbmltcG9ydCB7IFBsYW5ldFBvcnRhbEFwcGxpY2F0aW9uIH0gZnJvbSAnLi9wb3J0YWwtYXBwbGljYXRpb24nO1xuaW1wb3J0IHsgUGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi9wbGFuZXQtYXBwbGljYXRpb24uc2VydmljZSc7XG5pbXBvcnQgeyBHbG9iYWxFdmVudERpc3BhdGNoZXIgfSBmcm9tICcuLi9nbG9iYWwtZXZlbnQtZGlzcGF0Y2hlcic7XG5pbXBvcnQgeyBSb3V0ZXIgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgZ2xvYmFsUGxhbmV0LCBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZiwgZ2V0QXBwbGljYXRpb25Mb2FkZXIgfSBmcm9tICcuLi9nbG9iYWwtcGxhbmV0JztcbmltcG9ydCB7IGNyZWF0ZURlYnVnIH0gZnJvbSAnLi4vZGVidWcnO1xuY29uc3QgZGVidWcgPSBjcmVhdGVEZWJ1ZygnYXBwLWxvYWRlcicpO1xuXG5leHBvcnQgZW51bSBBcHBsaWNhdGlvblN0YXR1cyB7XG4gICAgYXNzZXRzTG9hZGluZyA9IDEsXG4gICAgYXNzZXRzTG9hZGVkID0gMixcbiAgICBib290c3RyYXBwaW5nID0gMyxcbiAgICBib290c3RyYXBwZWQgPSA0LFxuICAgIGFjdGl2ZSA9IDUsXG4gICAgbG9hZEVycm9yID0gMTBcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcHBzTG9hZGluZ1N0YXJ0RXZlbnQge1xuICAgIHNob3VsZExvYWRBcHBzOiBQbGFuZXRBcHBsaWNhdGlvbltdO1xuICAgIHNob3VsZFVubG9hZEFwcHM6IFBsYW5ldEFwcGxpY2F0aW9uW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwU3RhdHVzQ2hhbmdlRXZlbnQge1xuICAgIGFwcDogUGxhbmV0QXBwbGljYXRpb247XG4gICAgc3RhdHVzOiBBcHBsaWNhdGlvblN0YXR1cztcbn1cblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBQbGFuZXRBcHBsaWNhdGlvbkxvYWRlciB7XG4gICAgcHJpdmF0ZSBmaXJzdExvYWQgPSB0cnVlO1xuXG4gICAgcHJpdmF0ZSBzdGFydFJvdXRlQ2hhbmdlRXZlbnQhOiBQbGFuZXRSb3V0ZXJFdmVudDtcblxuICAgIHByaXZhdGUgb3B0aW9uczogUGxhbmV0T3B0aW9ucztcblxuICAgIHByaXZhdGUgaW5Qcm9ncmVzc0FwcEFzc2V0c0xvYWRzID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmFibGU8UGxhbmV0QXBwbGljYXRpb24+PigpO1xuXG4gICAgcHJpdmF0ZSBhcHBzU3RhdHVzID0gbmV3IE1hcDxQbGFuZXRBcHBsaWNhdGlvbiwgQXBwbGljYXRpb25TdGF0dXM+KCk7XG5cbiAgICBwcml2YXRlIHBvcnRhbEFwcCA9IG5ldyBQbGFuZXRQb3J0YWxBcHBsaWNhdGlvbigpO1xuXG4gICAgcHJpdmF0ZSByb3V0ZUNoYW5nZSQgPSBuZXcgU3ViamVjdDxQbGFuZXRSb3V0ZXJFdmVudD4oKTtcblxuICAgIHByaXZhdGUgYXBwU3RhdHVzQ2hhbmdlJCA9IG5ldyBTdWJqZWN0PEFwcFN0YXR1c0NoYW5nZUV2ZW50PigpO1xuXG4gICAgcHJpdmF0ZSBhcHBzTG9hZGluZ1N0YXJ0JCA9IG5ldyBTdWJqZWN0PEFwcHNMb2FkaW5nU3RhcnRFdmVudD4oKTtcblxuICAgIHB1YmxpYyBnZXQgYXBwU3RhdHVzQ2hhbmdlKCk6IE9ic2VydmFibGU8QXBwU3RhdHVzQ2hhbmdlRXZlbnQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwU3RhdHVzQ2hhbmdlJC5hc09ic2VydmFibGUoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGFwcHNMb2FkaW5nU3RhcnQoKTogT2JzZXJ2YWJsZTxBcHBzTG9hZGluZ1N0YXJ0RXZlbnQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwc0xvYWRpbmdTdGFydCQuYXNPYnNlcnZhYmxlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGxvYWRpbmdEb25lID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBhc3NldHNMb2FkZXI6IEFzc2V0c0xvYWRlcixcbiAgICAgICAgcHJpdmF0ZSBwbGFuZXRBcHBsaWNhdGlvblNlcnZpY2U6IFBsYW5ldEFwcGxpY2F0aW9uU2VydmljZSxcbiAgICAgICAgcHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSxcbiAgICAgICAgcm91dGVyOiBSb3V0ZXIsXG4gICAgICAgIGluamVjdG9yOiBJbmplY3RvcixcbiAgICAgICAgYXBwbGljYXRpb25SZWY6IEFwcGxpY2F0aW9uUmVmXG4gICAgKSB7XG4gICAgICAgIGlmIChnZXRBcHBsaWNhdGlvbkxvYWRlcigpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgJ1BsYW5ldEFwcGxpY2F0aW9uTG9hZGVyIGhhcyBiZWVuIGluamVjdGVkIGluIHRoZSBwb3J0YWwsIHJlcGVhdGVkIGluamVjdGlvbiBpcyBub3QgYWxsb3dlZCdcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgICAgICBzd2l0Y2hNb2RlOiBTd2l0Y2hNb2Rlcy5kZWZhdWx0LFxuICAgICAgICAgICAgZXJyb3JIYW5kbGVyOiAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucG9ydGFsQXBwLm5nWm9uZSA9IG5nWm9uZTtcbiAgICAgICAgdGhpcy5wb3J0YWxBcHAuYXBwbGljYXRpb25SZWYgPSBhcHBsaWNhdGlvblJlZjtcbiAgICAgICAgdGhpcy5wb3J0YWxBcHAucm91dGVyID0gcm91dGVyO1xuICAgICAgICB0aGlzLnBvcnRhbEFwcC5pbmplY3RvciA9IGluamVjdG9yO1xuICAgICAgICB0aGlzLnBvcnRhbEFwcC5nbG9iYWxFdmVudERpc3BhdGNoZXIgPSBpbmplY3Rvci5nZXQoR2xvYmFsRXZlbnREaXNwYXRjaGVyKTtcbiAgICAgICAgZ2xvYmFsUGxhbmV0LnBvcnRhbEFwcGxpY2F0aW9uID0gdGhpcy5wb3J0YWxBcHA7XG4gICAgICAgIHRoaXMuc2V0dXBSb3V0ZUNoYW5nZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0QXBwU3RhdHVzKGFwcDogUGxhbmV0QXBwbGljYXRpb24sIHN0YXR1czogQXBwbGljYXRpb25TdGF0dXMpIHtcbiAgICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZyb21TdGF0dXMgPSB0aGlzLmFwcHNTdGF0dXMuZ2V0KGFwcCk7XG4gICAgICAgICAgICBkZWJ1ZyhcbiAgICAgICAgICAgICAgICBgYXBwKCR7YXBwLm5hbWV9KSBzdGF0dXMgY2hhbmdlOiAke2Zyb21TdGF0dXMgPyBBcHBsaWNhdGlvblN0YXR1c1tmcm9tU3RhdHVzXSA6ICdlbXB0eSd9ID0+ICR7XG4gICAgICAgICAgICAgICAgICAgIEFwcGxpY2F0aW9uU3RhdHVzW3N0YXR1c11cbiAgICAgICAgICAgICAgICB9YFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuYXBwc1N0YXR1cy5zZXQoYXBwLCBzdGF0dXMpO1xuICAgICAgICAgICAgdGhpcy5hcHBTdGF0dXNDaGFuZ2UkLm5leHQoe1xuICAgICAgICAgICAgICAgIGFwcDogYXBwLFxuICAgICAgICAgICAgICAgIHN0YXR1czogc3RhdHVzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRBcHBTdGF0dXNDaGFuZ2UkKFxuICAgICAgICBhcHA6IFBsYW5ldEFwcGxpY2F0aW9uLFxuICAgICAgICBzdGF0dXMgPSBBcHBsaWNhdGlvblN0YXR1cy5ib290c3RyYXBwZWRcbiAgICApOiBPYnNlcnZhYmxlPFBsYW5ldEFwcGxpY2F0aW9uPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwcFN0YXR1c0NoYW5nZS5waXBlKFxuICAgICAgICAgICAgZmlsdGVyKGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnQuYXBwID09PSBhcHAgJiYgZXZlbnQuc3RhdHVzID09PSBzdGF0dXM7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG1hcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFwcDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzd2l0Y2hNb2RlSXNDb2V4aXN0KGFwcDogUGxhbmV0QXBwbGljYXRpb24pIHtcbiAgICAgICAgaWYgKGFwcCAmJiBhcHAuc3dpdGNoTW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5zd2l0Y2hNb2RlID09PSBTd2l0Y2hNb2Rlcy5jb2V4aXN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zd2l0Y2hNb2RlID09PSBTd2l0Y2hNb2Rlcy5jb2V4aXN0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBlcnJvckhhbmRsZXIoZXJyb3I6IEVycm9yKSB7XG4gICAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuZXJyb3JIYW5kbGVyKGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRMb2FkaW5nRG9uZSgpIHtcbiAgICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9hZGluZ0RvbmUgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFwcE5hbWVzKGFwcHM6IFBsYW5ldEFwcGxpY2F0aW9uW10pOiBzdHJpbmcgfCBzdHJpbmdbXSB7XG4gICAgICAgIHJldHVybiBhcHBzLmxlbmd0aCA9PT0gMFxuICAgICAgICAgICAgPyBgW11gXG4gICAgICAgICAgICA6IGFwcHMubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0ubmFtZTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXR1cFJvdXRlQ2hhbmdlKCkge1xuICAgICAgICB0aGlzLnJvdXRlQ2hhbmdlJFxuICAgICAgICAgICAgLnBpcGUoXG4gICAgICAgICAgICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKHgsIHkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICh4ICYmIHgudXJsKSA9PT0gKHkgJiYgeS51cmwpO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIC8vIFVzaW5nIHN3aXRjaE1hcCBzbyB3ZSBjYW5jZWwgZXhlY3V0aW5nIGxvYWRpbmcgd2hlbiBhIG5ldyBvbmUgY29tZXMgaW5cbiAgICAgICAgICAgICAgICBzd2l0Y2hNYXAoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gbmV3IG9ic2VydmFibGUgdXNlIG9mIGFuZCBjYXRjaEVycm9yLFxuICAgICAgICAgICAgICAgICAgICAvLyBpbiBvcmRlciB0byBwcmV2ZW50IHJvdXRlQ2hhbmdlJCBjb21wbGV0ZWQgd2hpY2ggbmV2ZXIgdHJpZ2dlciBuZXcgcm91dGUgY2hhbmdlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvZihldmVudCkucGlwZShcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVubG9hZCBhcHBzIGFuZCByZXR1cm4gc2hvdWxkIGxvYWQgYXBwc1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Zyhgcm91dGUgY2hhbmdlLCB1cmwgaXM6ICR7ZXZlbnQudXJsfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRSb3V0ZUNoYW5nZUV2ZW50ID0gZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2hvdWxkTG9hZEFwcHMgPSB0aGlzLnBsYW5ldEFwcGxpY2F0aW9uU2VydmljZS5nZXRBcHBzQnlNYXRjaGVkVXJsKGV2ZW50LnVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcoYHNob3VsZCBsb2FkIGFwcHM6ICR7dGhpcy5nZXRBcHBOYW1lcyhzaG91bGRMb2FkQXBwcyl9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2hvdWxkVW5sb2FkQXBwcyA9IHRoaXMuZ2V0VW5sb2FkQXBwcyhzaG91bGRMb2FkQXBwcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBzTG9hZGluZ1N0YXJ0JC5uZXh0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkTG9hZEFwcHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZFVubG9hZEFwcHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVubG9hZEFwcHMoc2hvdWxkVW5sb2FkQXBwcywgZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKGB1bmxvYWQgYXBwczogJHt0aGlzLmdldEFwcE5hbWVzKHNob3VsZFVubG9hZEFwcHMpfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzaG91bGRMb2FkQXBwcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTG9hZCBhcHAgYXNzZXRzIChzdGF0aWMgcmVzb3VyY2VzKVxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoTWFwKHNob3VsZExvYWRBcHBzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzQXBwc05lZWRMb2FkaW5nQXNzZXRzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9hZEFwcHMkID0gc2hvdWxkTG9hZEFwcHMubWFwKGFwcCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFwcFN0YXR1cyA9IHRoaXMuYXBwc1N0YXR1cy5nZXQoYXBwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIWFwcFN0YXR1cyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwU3RhdHVzID09PSBBcHBsaWNhdGlvblN0YXR1cy5hc3NldHNMb2FkaW5nIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBTdGF0dXMgPT09IEFwcGxpY2F0aW9uU3RhdHVzLmxvYWRFcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBhcHAoJHthcHAubmFtZX0pIHN0YXR1cyBpcyAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcHBsaWNhdGlvblN0YXR1c1thcHBTdGF0dXMgYXMgQXBwbGljYXRpb25TdGF0dXNdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgc3RhcnQgbG9hZCBhc3NldHNgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzQXBwc05lZWRMb2FkaW5nQXNzZXRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhcnRMb2FkQXBwQXNzZXRzKGFwcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvZihhcHApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0FwcHNOZWVkTG9hZGluZ0Fzc2V0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRpbmdEb25lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2FkQXBwcyQubGVuZ3RoID4gMCA/IGZvcmtKb2luKGxvYWRBcHBzJCkgOiBvZihbXSBhcyBQbGFuZXRBcHBsaWNhdGlvbltdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQm9vdHN0cmFwIG9yIHNob3cgYXBwc1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwKGFwcHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFwcHMkOiBPYnNlcnZhYmxlPFBsYW5ldEFwcGxpY2F0aW9uPltdID0gYXBwcy5tYXAoYXBwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9mKGFwcCkucGlwZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaE1hcChhcHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFwcFN0YXR1cyA9IHRoaXMuYXBwc1N0YXR1cy5nZXQoYXBwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXBwU3RhdHVzID09PSBBcHBsaWNhdGlvblN0YXR1cy5ib290c3RyYXBwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgW3JvdXRlQ2hhbmdlXSBhcHAoJHthcHAubmFtZX0pIHN0YXR1cyBpcyBib290c3RyYXBwZWQsIHNob3cgYXBwIGFuZCBhY3RpdmVgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0FwcChhcHApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhcHBSZWYgPSBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZihhcHAubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcFJlZj8ubmF2aWdhdGVCeVVybChldmVudC51cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEFwcFN0YXR1cyhhcHAsIEFwcGxpY2F0aW9uU3RhdHVzLmFjdGl2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZ0RvbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9mKGFwcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcHBTdGF0dXMgPT09IEFwcGxpY2F0aW9uU3RhdHVzLmFzc2V0c0xvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBbcm91dGVDaGFuZ2VdIGFwcCgke2FwcC5uYW1lfSkgc3RhdHVzIGlzIGFzc2V0c0xvYWRlZCwgc3RhcnQgYm9vdHN0cmFwcGluZ2BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYm9vdHN0cmFwQXBwKGFwcCkucGlwZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVidWcoYGFwcCgke2FwcC5uYW1lfSkgYm9vdHN0cmFwcGVkIHN1Y2Nlc3MsIGFjdGl2ZSBpdGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QXBwU3RhdHVzKGFwcCwgQXBwbGljYXRpb25TdGF0dXMuYWN0aXZlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldExvYWRpbmdEb25lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFwcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcHBTdGF0dXMgPT09IEFwcGxpY2F0aW9uU3RhdHVzLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgW3JvdXRlQ2hhbmdlXSBhcHAoJHthcHAubmFtZX0pIGlzIGFjdGl2ZSwgZG8gbm90aGluZ3NgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXBwUmVmID0gZ2V0UGxhbmV0QXBwbGljYXRpb25SZWYoYXBwLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBzdWIgYXBwIHVzZSBvbGQgdmVyc2lvbiB3aGljaCBoYXMgbm90IGdldEN1cnJlbnRSb3V0ZXJTdGF0ZVVybFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50VXJsID0gYXBwUmVmPy5nZXRDdXJyZW50Um91dGVyU3RhdGVVcmxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYXBwUmVmLmdldEN1cnJlbnRSb3V0ZXJTdGF0ZVVybCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFVybCAhPT0gZXZlbnQudXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBSZWY/Lm5hdmlnYXRlQnlVcmwoZXZlbnQudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2YoYXBwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBbcm91dGVDaGFuZ2VdIGFwcCgke2FwcC5uYW1lfSkgc3RhdHVzIGlzICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXBwbGljYXRpb25TdGF0dXNbYXBwU3RhdHVzIGFzIEFwcGxpY2F0aW9uU3RhdHVzXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXBwU3RhdHVzQ2hhbmdlJChhcHApLnBpcGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWtlKDEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYGFwcCgke2FwcC5uYW1lfSkgc3RhdHVzIGlzIGJvb3RzdHJhcHBlZCBieSBzdWJzY3JpYmUgc3RhdHVzIGNoYW5nZSwgYWN0aXZlIGl0YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBcHBTdGF0dXMoYXBwLCBBcHBsaWNhdGlvblN0YXR1cy5hY3RpdmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0FwcChhcHApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcHA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXBwcyQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Zyhgc3RhcnQgbG9hZCBhbmQgYWN0aXZlIGFwcHM6ICR7dGhpcy5nZXRBcHBOYW1lcyhhcHBzKX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5YiH5o2i5Yiw5bqU55So5ZCO5Lya5pyJ6Zeq54OB546w6LGh77yM5omA5Lul5L2/55SoIHNldFRpbWVvdXQg5ZCO5ZCv5Yqo5bqU55SoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4YW1wbGU6IHJlZGlyZWN0IHRvIGFwcDEncyBkYXNoYm9hcmQgZnJvbSBwb3J0YWwncyBhYm91dCBwYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGFwcCdzIHJvdXRlIGhhcyByZWRpcmVjdCwgaXQgZG9lc24ndCB3b3JrLCBpdCBvayBqdXN0IGluIHNldFRpbWVvdXQsIEkgZG9uJ3Qga25vdyB3aHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86OiByZW1vdmUgaXQsIGl0IGlzIG9rIGluIHZlcnNpb24gQW5ndWxhciA5LnhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDmraTlpITliKTmlq3mmK/lm6DkuLrlpoLmnpzpnZnmgIHotYTmupDliqDovb3lrozmr5Xov5jmnKrlkK/liqjooqvlj5bmtojvvIzov5jmmK/kvJrlkK/liqjkuYvliY3nmoTlupTnlKjvvIzomb3nhLblj6/og73mgKfmr5TovoPlsI/vvIzkvYbmmK/ml6Dms5XmjpLpmaTov5nnp43lj6/og73mgKfvvIzmiYDku6Xlj6rmnInlvZMgRXZlbnQg5piv5pyA5ZCO5LiA5Liq5omN5Lya5ZCv5YqoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGFydFJvdXRlQ2hhbmdlRXZlbnQgPT09IGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcnVuT3V0c2lkZUFuZ3VsYXIgZm9yIGZpeCBlcnJvcjogYEV4cGVjdGVkIHRvIG5vdCBiZSBpbiBBbmd1bGFyIFpvbmUsIGJ1dCBpdCBpcyFgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JrSm9pbihhcHBzJCkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0TG9hZGluZ0RvbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW5zdXJlUHJlbG9hZEFwcHMoYXBwcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Zyhgbm8gYXBwcyBuZWVkIHRvIGJlIGxvYWRlZCwgZW5zdXJlIHByZWxvYWQgYXBwc2ApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVuc3VyZVByZWxvYWRBcHBzKGFwcHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldExvYWRpbmdEb25lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBFcnJvciBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaEVycm9yKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhgYXBwcyBsb2FkZXIgZXJyb3I6ICR7ZXJyb3J9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvckhhbmRsZXIoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXJ0TG9hZEFwcEFzc2V0cyhhcHA6IFBsYW5ldEFwcGxpY2F0aW9uKTogT2JzZXJ2YWJsZTxQbGFuZXRBcHBsaWNhdGlvbj4ge1xuICAgICAgICBpZiAodGhpcy5pblByb2dyZXNzQXBwQXNzZXRzTG9hZHMuZ2V0KGFwcC5uYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5Qcm9ncmVzc0FwcEFzc2V0c0xvYWRzLmdldChhcHAubmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBsb2FkQXBwJCA9IHRoaXMuYXNzZXRzTG9hZGVyLmxvYWRBcHBBc3NldHMoYXBwKS5waXBlKFxuICAgICAgICAgICAgICAgIHRhcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5Qcm9ncmVzc0FwcEFzc2V0c0xvYWRzLmRlbGV0ZShhcHAubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QXBwU3RhdHVzKGFwcCwgQXBwbGljYXRpb25TdGF0dXMuYXNzZXRzTG9hZGVkKTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBtYXAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXBwO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGNhdGNoRXJyb3IoZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluUHJvZ3Jlc3NBcHBBc3NldHNMb2Fkcy5kZWxldGUoYXBwLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEFwcFN0YXR1cyhhcHAsIEFwcGxpY2F0aW9uU3RhdHVzLmxvYWRFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIHNoYXJlKClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmluUHJvZ3Jlc3NBcHBBc3NldHNMb2Fkcy5zZXQoYXBwLm5hbWUsIGxvYWRBcHAkKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXBwU3RhdHVzKGFwcCwgQXBwbGljYXRpb25TdGF0dXMuYXNzZXRzTG9hZGluZyk7XG4gICAgICAgICAgICByZXR1cm4gbG9hZEFwcCQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGhpZGVBcHAocGxhbmV0QXBwOiBQbGFuZXRBcHBsaWNhdGlvbikge1xuICAgICAgICBjb25zdCBhcHBSZWYgPSBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZihwbGFuZXRBcHAubmFtZSk7XG4gICAgICAgIGNvbnN0IGFwcFJvb3RFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhcHBSZWY/LnNlbGVjdG9yIHx8IChwbGFuZXRBcHAuc2VsZWN0b3IgYXMgc3RyaW5nKSk7XG4gICAgICAgIGlmIChhcHBSb290RWxlbWVudCkge1xuICAgICAgICAgICAgYXBwUm9vdEVsZW1lbnQuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5Om5vbmU7Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNob3dBcHAocGxhbmV0QXBwOiBQbGFuZXRBcHBsaWNhdGlvbikge1xuICAgICAgICBjb25zdCBhcHBSZWYgPSBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZihwbGFuZXRBcHAubmFtZSk7XG4gICAgICAgIGNvbnN0IGFwcFJvb3RFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhcHBSZWY/LnNlbGVjdG9yIHx8IChwbGFuZXRBcHAuc2VsZWN0b3IgYXMgc3RyaW5nKSk7XG4gICAgICAgIGlmIChhcHBSb290RWxlbWVudCkge1xuICAgICAgICAgICAgYXBwUm9vdEVsZW1lbnQuc2V0QXR0cmlidXRlKCdzdHlsZScsICcnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZGVzdHJveUFwcChwbGFuZXRBcHA6IFBsYW5ldEFwcGxpY2F0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFwcFJlZiA9IGdldFBsYW5ldEFwcGxpY2F0aW9uUmVmKHBsYW5ldEFwcC5uYW1lKTtcbiAgICAgICAgaWYgKGFwcFJlZikge1xuICAgICAgICAgICAgYXBwUmVmLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb250YWluZXIgPSBnZXRIVE1MRWxlbWVudChwbGFuZXRBcHAuaG9zdFBhcmVudCk7XG4gICAgICAgIGNvbnN0IGFwcFJvb3RFbGVtZW50ID0gY29udGFpbmVyPy5xdWVyeVNlbGVjdG9yKChhcHBSZWYgJiYgYXBwUmVmLnNlbGVjdG9yKSB8fCAocGxhbmV0QXBwLnNlbGVjdG9yIGFzIHN0cmluZykpO1xuICAgICAgICBpZiAoYXBwUm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lcj8ucmVtb3ZlQ2hpbGQoYXBwUm9vdEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBib290c3RyYXBBcHAoXG4gICAgICAgIGFwcDogUGxhbmV0QXBwbGljYXRpb24sXG4gICAgICAgIGRlZmF1bHRTdGF0dXM6ICdoaWRkZW4nIHwgJ2Rpc3BsYXknID0gJ2Rpc3BsYXknXG4gICAgKTogT2JzZXJ2YWJsZTxQbGFuZXRBcHBsaWNhdGlvblJlZj4ge1xuICAgICAgICBkZWJ1ZyhgYXBwKCR7YXBwLm5hbWV9KSBzdGFydCBib290c3RyYXBwaW5nYCk7XG4gICAgICAgIHRoaXMuc2V0QXBwU3RhdHVzKGFwcCwgQXBwbGljYXRpb25TdGF0dXMuYm9vdHN0cmFwcGluZyk7XG4gICAgICAgIGNvbnN0IGFwcFJlZiA9IGdldFBsYW5ldEFwcGxpY2F0aW9uUmVmKGFwcC5uYW1lKTtcbiAgICAgICAgaWYgKGFwcFJlZiAmJiBhcHBSZWYuYm9vdHN0cmFwKSB7XG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBnZXRIVE1MRWxlbWVudChhcHAuaG9zdFBhcmVudCk7XG4gICAgICAgICAgICBsZXQgYXBwUm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIGFwcFJvb3RFbGVtZW50ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoYXBwUmVmLnNlbGVjdG9yIHx8IGFwcC5zZWxlY3RvciEpITtcbiAgICAgICAgICAgICAgICBpZiAoIWFwcFJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcHBSZWYudGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcFJvb3RFbGVtZW50ID0gY3JlYXRlRWxlbWVudEJ5VGVtcGxhdGUoYXBwUmVmLnRlbXBsYXRlKSE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBSb290RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoYXBwLnNlbGVjdG9yISk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXBwUm9vdEVsZW1lbnQuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5Om5vbmU7Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcHAuaG9zdENsYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBSb290RWxlbWVudC5jbGFzc0xpc3QuYWRkKC4uLmNvZXJjZUFycmF5KGFwcC5ob3N0Q2xhc3MpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYXBwLnN0eWxlUHJlZml4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBSb290RWxlbWVudC5jbGFzc0xpc3QuYWRkKC4uLmNvZXJjZUFycmF5KGFwcC5zdHlsZVByZWZpeCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChhcHBSb290RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGFwcFJlZi5ib290c3RyYXAodGhpcy5wb3J0YWxBcHApO1xuICAgICAgICAgICAgLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHkgcHJvbWlzZSBmb3IgYm9vdHN0cmFwXG4gICAgICAgICAgICBpZiAoKHJlc3VsdCBhcyBhbnkpWyd0aGVuJ10pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmcm9tKHJlc3VsdCkgYXMgT2JzZXJ2YWJsZTxQbGFuZXRBcHBsaWNhdGlvblJlZj47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LnBpcGUoXG4gICAgICAgICAgICAgICAgdGFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYGFwcCgke2FwcC5uYW1lfSkgYm9vdHN0cmFwcGVkIHN1Y2Nlc3MgZm9yICR7ZGVmYXVsdFN0YXR1c31gKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBcHBTdGF0dXMoYXBwLCBBcHBsaWNhdGlvblN0YXR1cy5ib290c3RyYXBwZWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVmYXVsdFN0YXR1cyA9PT0gJ2Rpc3BsYXknICYmIGFwcFJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBSb290RWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBtYXAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXBwUmVmO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIGBbJHthcHAubmFtZX1dIG5vdCBmb3VuZCwgbWFrZSBzdXJlIHRoYXQgdGhlIGFwcCBoYXMgdGhlIGNvcnJlY3QgbmFtZSBkZWZpbmVkIHVzZSBkZWZpbmVBcHBsaWNhdGlvbigke2FwcC5uYW1lfSkgYW5kIHJ1bnRpbWVDaHVuayBhbmQgdmVuZG9yQ2h1bmsgYXJlIHNldCB0byB0cnVlLCBkZXRhaWxzIHNlZSBodHRwczovL2dpdGh1Yi5jb20vd29ya3RpbGUvbmd4LXBsYW5ldCN0aHJvdy1lcnJvci1jYW5ub3QtcmVhZC1wcm9wZXJ0eS1jYWxsLW9mLXVuZGVmaW5lZC1hdC1fX3dlYnBhY2tfcmVxdWlyZV9fLWJvb3RzdHJhcDc5YFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0VW5sb2FkQXBwcyhhY3RpdmVBcHBzOiBQbGFuZXRBcHBsaWNhdGlvbltdKSB7XG4gICAgICAgIGNvbnN0IHVubG9hZEFwcHM6IFBsYW5ldEFwcGxpY2F0aW9uW10gPSBbXTtcbiAgICAgICAgdGhpcy5hcHBzU3RhdHVzLmZvckVhY2goKHZhbHVlLCBhcHApID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gQXBwbGljYXRpb25TdGF0dXMuYWN0aXZlICYmICFhY3RpdmVBcHBzLmZpbmQoaXRlbSA9PiBpdGVtLm5hbWUgPT09IGFwcC5uYW1lKSkge1xuICAgICAgICAgICAgICAgIHVubG9hZEFwcHMucHVzaChhcHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHVubG9hZEFwcHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1bmxvYWRBcHBzKHNob3VsZFVubG9hZEFwcHM6IFBsYW5ldEFwcGxpY2F0aW9uW10sIGV2ZW50OiBQbGFuZXRSb3V0ZXJFdmVudCkge1xuICAgICAgICBjb25zdCBoaWRlQXBwczogUGxhbmV0QXBwbGljYXRpb25bXSA9IFtdO1xuICAgICAgICBjb25zdCBkZXN0cm95QXBwczogUGxhbmV0QXBwbGljYXRpb25bXSA9IFtdO1xuICAgICAgICBzaG91bGRVbmxvYWRBcHBzLmZvckVhY2goYXBwID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN3aXRjaE1vZGVJc0NvZXhpc3QoYXBwKSkge1xuICAgICAgICAgICAgICAgIGRlYnVnKGBoaWRlIGFwcCgke2FwcC5uYW1lfSkgZm9yIGNvZXhpc3QgbW9kZWApO1xuICAgICAgICAgICAgICAgIGhpZGVBcHBzLnB1c2goYXBwKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGVBcHAoYXBwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFwcFN0YXR1cyhhcHAsIEFwcGxpY2F0aW9uU3RhdHVzLmJvb3RzdHJhcHBlZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3Ryb3lBcHBzLnB1c2goYXBwKTtcbiAgICAgICAgICAgICAgICAvLyDplIDmr4HkuYvliY3lhYjpmpDol4/vvIzlkKbliJnkvJrlh7rnjrDpl6rng4HvvIzlm6DkuLogZGVzdHJveSDmmK/lu7bov5/miafooYznmoRcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzplIDmr4HkuI3lu7bov5/miafooYzvvIzkvJrlh7rnjrDliIfmjaLliLDkuLvlupTnlKjnmoTml7blgJnkvJrmnInop4blm77ljaHpob/njrDosaFcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGVBcHAoYXBwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEFwcFN0YXR1cyhhcHAsIEFwcGxpY2F0aW9uU3RhdHVzLmFzc2V0c0xvYWRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChoaWRlQXBwcy5sZW5ndGggPiAwIHx8IGRlc3Ryb3lBcHBzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIOS7juWFtuS7luW6lOeUqOWIh+aNouWIsOS4u+W6lOeUqOeahOaXtuWAmeS8muacieinhuWbvuWNoemhv+eOsOixoe+8jOaJgOS7peWFiOetieS4u+W6lOeUqOa4suafk+WujOavleWQjuWGjeWKoOi9veWFtuS7luW6lOeUqFxuICAgICAgICAgICAgLy8g5q2k5aSE5bCd6K+V5L2/55SoIHRoaXMubmdab25lLm9uU3RhYmxlLnBpcGUodGFrZSgxKSkg5bqU55So5LmL6Ze055qE5YiH5o2i5Lya5Ye6546w6Zeq54OBXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBoaWRlQXBwcy5mb3JFYWNoKGFwcCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFwcFJlZiA9IGdldFBsYW5ldEFwcGxpY2F0aW9uUmVmKGFwcC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFwcFJlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwUmVmLm5hdmlnYXRlQnlVcmwoZXZlbnQudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGRlc3Ryb3lBcHBzLmZvckVhY2goYXBwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYGRlc3Ryb3kgYXBwKCR7YXBwLm5hbWV9KWApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3lBcHAoYXBwKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwcmVsb2FkQXBwcyhhY3RpdmVBcHBzPzogUGxhbmV0QXBwbGljYXRpb25bXSkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRvUHJlbG9hZEFwcHMgPSB0aGlzLnBsYW5ldEFwcGxpY2F0aW9uU2VydmljZS5nZXRBcHBzVG9QcmVsb2FkKFxuICAgICAgICAgICAgICAgIGFjdGl2ZUFwcHMgPyBhY3RpdmVBcHBzLm1hcChpdGVtID0+IGl0ZW0ubmFtZSkgOiB1bmRlZmluZWRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBkZWJ1Zyhgc3RhcnQgcHJlbG9hZCBhcHBzOiAke3RoaXMuZ2V0QXBwTmFtZXModG9QcmVsb2FkQXBwcyl9YCk7XG4gICAgICAgICAgICBjb25zdCBsb2FkQXBwcyQgPSB0b1ByZWxvYWRBcHBzLm1hcChwcmVsb2FkQXBwID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcmVsb2FkSW50ZXJuYWwocHJlbG9hZEFwcCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZm9ya0pvaW4obG9hZEFwcHMkKS5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JIYW5kbGVyKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBlbnN1cmVQcmVsb2FkQXBwcyhhY3RpdmVBcHBzPzogUGxhbmV0QXBwbGljYXRpb25bXSkge1xuICAgICAgICAvLyBTdGFydCBwcmVsb2FkIGFwcHNcbiAgICAgICAgLy8gU3RhcnQgcHJlbG9hZCB3aGVuIGZpcnN0IHRpbWUgYXBwIGxvYWRlZFxuICAgICAgICBpZiAodGhpcy5maXJzdExvYWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJlbG9hZEFwcHMoYWN0aXZlQXBwcyk7XG4gICAgICAgICAgICB0aGlzLmZpcnN0TG9hZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNldE9wdGlvbnMob3B0aW9uczogUGFydGlhbDxQbGFuZXRPcHRpb25zPikge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgICAgICAuLi50aGlzLm9wdGlvbnMsXG4gICAgICAgICAgICAuLi5vcHRpb25zXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmVzZXQgcm91dGUgYnkgY3VycmVudCByb3V0ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVyb3V0ZShldmVudDogUGxhbmV0Um91dGVyRXZlbnQpIHtcbiAgICAgICAgdGhpcy5yb3V0ZUNoYW5nZSQubmV4dChldmVudCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwcmVsb2FkSW50ZXJuYWwoYXBwOiBQbGFuZXRBcHBsaWNhdGlvbiwgaW1tZWRpYXRlPzogYm9vbGVhbik6IE9ic2VydmFibGU8UGxhbmV0QXBwbGljYXRpb25SZWYgfCBudWxsPiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuYXBwc1N0YXR1cy5nZXQoYXBwKTtcbiAgICAgICAgaWYgKCFzdGF0dXMgfHwgc3RhdHVzID09PSBBcHBsaWNhdGlvblN0YXR1cy5sb2FkRXJyb3IpIHtcbiAgICAgICAgICAgIGRlYnVnKGBwcmVsb2FkIGFwcCgke2FwcC5uYW1lfSksIHN0YXR1cyBpcyBlbXB0eSwgc3RhcnQgdG8gbG9hZCBhc3NldHNgKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXJ0TG9hZEFwcEFzc2V0cyhhcHApLnBpcGUoXG4gICAgICAgICAgICAgICAgc3dpdGNoTWFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoYHByZWxvYWQgYXBwKCR7YXBwLm5hbWV9KSwgYXNzZXRzIGxvYWRlZCwgc3RhcnQgYm9vdHN0cmFwIGFwcCwgaW1tZWRpYXRlOiAkeyEhaW1tZWRpYXRlfWApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW1tZWRpYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ib290c3RyYXBBcHAoYXBwLCAnaGlkZGVuJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJvb3RzdHJhcEFwcChhcHAsICdoaWRkZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgY2F0Y2hFcnJvcihlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JIYW5kbGVyKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9mKG51bGwpO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG1hcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRQbGFuZXRBcHBsaWNhdGlvblJlZihhcHAubmFtZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBbQXBwbGljYXRpb25TdGF0dXMuYXNzZXRzTG9hZGluZywgQXBwbGljYXRpb25TdGF0dXMuYXNzZXRzTG9hZGVkLCBBcHBsaWNhdGlvblN0YXR1cy5ib290c3RyYXBwaW5nXS5pbmNsdWRlcyhcbiAgICAgICAgICAgICAgICBzdGF0dXNcbiAgICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBkZWJ1ZyhgcHJlbG9hZCBhcHAoJHthcHAubmFtZX0pLCBzdGF0dXMgaXMgJHtBcHBsaWNhdGlvblN0YXR1c1tzdGF0dXNdfSwgcmV0dXJuIHVudGlsIGJvb3RzdHJhcHBlZGApO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXBwU3RhdHVzQ2hhbmdlJChhcHApLnBpcGUoXG4gICAgICAgICAgICAgICAgdGFrZSgxKSxcbiAgICAgICAgICAgICAgICBtYXAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0UGxhbmV0QXBwbGljYXRpb25SZWYoYXBwLm5hbWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYXBwUmVmID0gZ2V0UGxhbmV0QXBwbGljYXRpb25SZWYoYXBwLm5hbWUpO1xuICAgICAgICAgICAgaWYgKCFhcHBSZWYpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7YXBwLm5hbWV9J3Mgc3RhdHVzIGlzICR7QXBwbGljYXRpb25TdGF0dXNbc3RhdHVzXX0sIHBsYW5ldEFwcGxpY2F0aW9uUmVmIGlzIG51bGwuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2YoYXBwUmVmKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByZWxvYWQgcGxhbmV0IGFwcGxpY2F0aW9uXG4gICAgICogQHBhcmFtIGFwcCBhcHBcbiAgICAgKiBAcGFyYW0gaW1tZWRpYXRlIGJvb3RzdHJhcCBvbiBzdGFibGUgYnkgZGVmYXVsdCwgc2V0dGluZyBpbW1lZGlhdGUgaXMgdHJ1ZSwgaXQgd2lsbCBib290c3RyYXAgaW1tZWRpYXRlXG4gICAgICovXG4gICAgcHVibGljIHByZWxvYWQoYXBwOiBQbGFuZXRBcHBsaWNhdGlvbiwgaW1tZWRpYXRlPzogYm9vbGVhbik6IE9ic2VydmFibGU8UGxhbmV0QXBwbGljYXRpb25SZWY+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJlbG9hZEludGVybmFsKGFwcCwgaW1tZWRpYXRlKTtcbiAgICB9XG59XG4iXX0=