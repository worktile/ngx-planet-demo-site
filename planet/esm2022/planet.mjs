import { Injectable, Inject, Optional, Injector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PLANET_APPLICATIONS } from './planet.class';
import { PlanetApplicationService } from './application/planet-application.service';
import { PlanetApplicationLoader } from './application/planet-application-loader';
import { filter, startWith, distinctUntilChanged, map } from 'rxjs/operators';
import { setPortalApplicationData, setApplicationLoader, setApplicationService, getApplicationLoader, getApplicationService } from './global-planet';
import { setDebugFactory } from './debug';
import * as i0 from "@angular/core";
import * as i1 from "@angular/router";
export class Planet {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: Planet, deps: [{ token: i0.Injector }, { token: i1.Router }, { token: PLANET_APPLICATIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: Planet, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: Planet, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i0.Injector }, { type: i1.Router }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [PLANET_APPLICATIONS]
                }, {
                    type: Optional
                }] }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbmV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vcGFja2FnZXMvcGxhbmV0L3NyYy9wbGFuZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN2RSxPQUFPLEVBQUUsYUFBYSxFQUFlLE1BQU0sRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3JFLE9BQU8sRUFBb0MsbUJBQW1CLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2RixPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSwwQ0FBMEMsQ0FBQztBQUNwRixPQUFPLEVBQUUsdUJBQXVCLEVBQStDLE1BQU0seUNBQXlDLENBQUM7QUFFL0gsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUUsT0FBTyxFQUNILHdCQUF3QixFQUN4QixvQkFBb0IsRUFDcEIscUJBQXFCLEVBQ3JCLG9CQUFvQixFQUNwQixxQkFBcUIsRUFDeEIsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sU0FBUyxDQUFDOzs7QUFLMUMsTUFBTSxPQUFPLE1BQU07SUFDZixJQUFZLHVCQUF1QjtRQUMvQixPQUFPLG9CQUFvQixFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELElBQVksd0JBQXdCO1FBQ2hDLE9BQU8scUJBQXFCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFXLFdBQVc7UUFDbEIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxDQUFDO0lBQ3BELENBQUM7SUFFRCxJQUFXLE9BQU87UUFDZCxPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUM7SUFDaEQsQ0FBQztJQUVELElBQVcsZUFBZTtRQUN0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YWJsZSwgSW5qZWN0LCBPcHRpb25hbCwgSW5qZWN0b3IgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE5hdmlnYXRpb25FbmQsIFJvdXRlckV2ZW50LCBSb3V0ZXIgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgUGxhbmV0T3B0aW9ucywgUGxhbmV0QXBwbGljYXRpb24sIFBMQU5FVF9BUFBMSUNBVElPTlMgfSBmcm9tICcuL3BsYW5ldC5jbGFzcyc7XG5pbXBvcnQgeyBQbGFuZXRBcHBsaWNhdGlvblNlcnZpY2UgfSBmcm9tICcuL2FwcGxpY2F0aW9uL3BsYW5ldC1hcHBsaWNhdGlvbi5zZXJ2aWNlJztcbmltcG9ydCB7IFBsYW5ldEFwcGxpY2F0aW9uTG9hZGVyLCBBcHBzTG9hZGluZ1N0YXJ0RXZlbnQsIEFwcFN0YXR1c0NoYW5nZUV2ZW50IH0gZnJvbSAnLi9hcHBsaWNhdGlvbi9wbGFuZXQtYXBwbGljYXRpb24tbG9hZGVyJztcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZmlsdGVyLCBzdGFydFdpdGgsIGRpc3RpbmN0VW50aWxDaGFuZ2VkLCBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICAgIHNldFBvcnRhbEFwcGxpY2F0aW9uRGF0YSxcbiAgICBzZXRBcHBsaWNhdGlvbkxvYWRlcixcbiAgICBzZXRBcHBsaWNhdGlvblNlcnZpY2UsXG4gICAgZ2V0QXBwbGljYXRpb25Mb2FkZXIsXG4gICAgZ2V0QXBwbGljYXRpb25TZXJ2aWNlXG59IGZyb20gJy4vZ2xvYmFsLXBsYW5ldCc7XG5pbXBvcnQgeyBzZXREZWJ1Z0ZhY3RvcnkgfSBmcm9tICcuL2RlYnVnJztcblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBQbGFuZXQge1xuICAgIHByaXZhdGUgZ2V0IHBsYW5ldEFwcGxpY2F0aW9uTG9hZGVyKCk6IFBsYW5ldEFwcGxpY2F0aW9uTG9hZGVyIHtcbiAgICAgICAgcmV0dXJuIGdldEFwcGxpY2F0aW9uTG9hZGVyKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXQgcGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0QXBwbGljYXRpb25TZXJ2aWNlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQGRlcHJlY2F0ZWQgcGxlYXNlIHVzZSBsb2FkaW5nIHNpZ25hbFxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgbG9hZGluZ0RvbmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYW5ldEFwcGxpY2F0aW9uTG9hZGVyLmxvYWRpbmdEb25lO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgbG9hZGluZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxhbmV0QXBwbGljYXRpb25Mb2FkZXIubG9hZGluZztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGFwcFN0YXR1c0NoYW5nZSgpOiBPYnNlcnZhYmxlPEFwcFN0YXR1c0NoYW5nZUV2ZW50PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYW5ldEFwcGxpY2F0aW9uTG9hZGVyLmFwcFN0YXR1c0NoYW5nZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGFwcHNMb2FkaW5nU3RhcnQoKTogT2JzZXJ2YWJsZTxBcHBzTG9hZGluZ1N0YXJ0RXZlbnQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxhbmV0QXBwbGljYXRpb25Mb2FkZXIuYXBwc0xvYWRpbmdTdGFydDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN1YnNjcmlwdGlvbj86IFN1YnNjcmlwdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIGluamVjdG9yOiBJbmplY3RvcixcbiAgICAgICAgcHJpdmF0ZSByb3V0ZXI6IFJvdXRlcixcbiAgICAgICAgQEluamVjdChQTEFORVRfQVBQTElDQVRJT05TKSBAT3B0aW9uYWwoKSBwbGFuZXRBcHBsaWNhdGlvbnM6IFBsYW5ldEFwcGxpY2F0aW9uW11cbiAgICApIHtcbiAgICAgICAgaWYgKCF0aGlzLnBsYW5ldEFwcGxpY2F0aW9uTG9hZGVyKSB7XG4gICAgICAgICAgICBzZXRBcHBsaWNhdGlvbkxvYWRlcih0aGlzLmluamVjdG9yLmdldChQbGFuZXRBcHBsaWNhdGlvbkxvYWRlcikpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5wbGFuZXRBcHBsaWNhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgICAgIHNldEFwcGxpY2F0aW9uU2VydmljZSh0aGlzLmluamVjdG9yLmdldChQbGFuZXRBcHBsaWNhdGlvblNlcnZpY2UpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwbGFuZXRBcHBsaWNhdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJBcHBzKHBsYW5ldEFwcGxpY2F0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRPcHRpb25zKG9wdGlvbnM6IFBhcnRpYWw8UGxhbmV0T3B0aW9ucz4pIHtcbiAgICAgICAgdGhpcy5wbGFuZXRBcHBsaWNhdGlvbkxvYWRlci5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICBpZiAob3B0aW9ucy5kZWJ1Z0ZhY3RvcnkpIHtcbiAgICAgICAgICAgIHNldERlYnVnRmFjdG9yeShvcHRpb25zLmRlYnVnRmFjdG9yeSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRQb3J0YWxBcHBEYXRhPFQ+KGRhdGE6IFQpIHtcbiAgICAgICAgc2V0UG9ydGFsQXBwbGljYXRpb25EYXRhKGRhdGEpO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyQXBwPFRFeHRyYT4oYXBwOiBQbGFuZXRBcHBsaWNhdGlvbjxURXh0cmE+KSB7XG4gICAgICAgIHRoaXMucGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlLnJlZ2lzdGVyKGFwcCk7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJBcHBzPFRFeHRyYT4oYXBwczogUGxhbmV0QXBwbGljYXRpb248VEV4dHJhPltdKSB7XG4gICAgICAgIHRoaXMucGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlLnJlZ2lzdGVyKGFwcHMpO1xuICAgIH1cblxuICAgIHVucmVnaXN0ZXJBcHAobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMucGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlLnVucmVnaXN0ZXIobmFtZSk7XG4gICAgfVxuXG4gICAgZ2V0QXBwcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlLmdldEFwcHMoKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb24gPSAodGhpcy5yb3V0ZXIuZXZlbnRzIGFzIE9ic2VydmFibGU8Um91dGVyRXZlbnQ+KVxuICAgICAgICAgICAgLnBpcGUoXG4gICAgICAgICAgICAgICAgZmlsdGVyKGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50IGluc3RhbmNlb2YgTmF2aWdhdGlvbkVuZDtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBtYXAoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGV2ZW50IGFzIE5hdmlnYXRpb25FbmQpLnVybEFmdGVyUmVkaXJlY3RzIHx8IGV2ZW50LnVybDtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBzdGFydFdpdGgobG9jYXRpb24ucGF0aG5hbWUpLFxuICAgICAgICAgICAgICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKClcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHVybDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGFuZXRBcHBsaWNhdGlvbkxvYWRlci5yZXJvdXRlKHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uPy51bnN1YnNjcmliZSgpO1xuICAgIH1cbn1cbiJdfQ==