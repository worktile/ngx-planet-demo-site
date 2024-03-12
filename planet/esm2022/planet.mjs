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
    get loadingDone() {
        return this.planetApplicationLoader.loadingDone;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbmV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vcGFja2FnZXMvcGxhbmV0L3NyYy9wbGFuZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN2RSxPQUFPLEVBQUUsYUFBYSxFQUFlLE1BQU0sRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3JFLE9BQU8sRUFBb0MsbUJBQW1CLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2RixPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSwwQ0FBMEMsQ0FBQztBQUNwRixPQUFPLEVBQ0gsdUJBQXVCLEVBRzFCLE1BQU0seUNBQXlDLENBQUM7QUFFakQsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUUsT0FBTyxFQUNILHdCQUF3QixFQUN4QixvQkFBb0IsRUFDcEIscUJBQXFCLEVBQ3JCLG9CQUFvQixFQUNwQixxQkFBcUIsRUFDeEIsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sU0FBUyxDQUFDOzs7QUFLMUMsTUFBTSxPQUFPLE1BQU07SUFDZixJQUFZLHVCQUF1QjtRQUMvQixPQUFPLG9CQUFvQixFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELElBQVksd0JBQXdCO1FBQ2hDLE9BQU8scUJBQXFCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQsSUFBVyxXQUFXO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQztJQUNwRCxDQUFDO0lBRUQsSUFBVyxlQUFlO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsQ0FBQztJQUN4RCxDQUFDO0lBRUQsSUFBVyxnQkFBZ0I7UUFDdkIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsZ0JBQWdCLENBQUM7SUFDekQsQ0FBQztJQUlELFlBQ1ksUUFBa0IsRUFDbEIsTUFBYyxFQUNtQixrQkFBdUM7UUFGeEUsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUNsQixXQUFNLEdBQU4sTUFBTSxDQUFRO1FBR3RCLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUNoQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNqQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELElBQUksa0JBQWtCLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDMUMsQ0FBQztJQUNMLENBQUM7SUFFRCxVQUFVLENBQUMsT0FBK0I7UUFDdEMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqRCxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2QixlQUFlLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzFDLENBQUM7SUFDTCxDQUFDO0lBRUQsZ0JBQWdCLENBQUksSUFBTztRQUN2Qix3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsV0FBVyxDQUFTLEdBQThCO1FBQzlDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELFlBQVksQ0FBUyxJQUFpQztRQUNsRCxJQUFJLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxhQUFhLENBQUMsSUFBWTtRQUN0QixJQUFJLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCxPQUFPO1FBQ0gsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDbkQsQ0FBQztJQUVELEtBQUs7UUFDRCxJQUFJLENBQUMsWUFBWSxHQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBa0M7YUFDOUQsSUFBSSxDQUNELE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNYLE9BQU8sS0FBSyxZQUFZLGFBQWEsQ0FBQztRQUMxQyxDQUFDLENBQUMsRUFDRixHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDUixPQUFRLEtBQXVCLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUNuRSxDQUFDLENBQUMsRUFDRixTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUM1QixvQkFBb0IsRUFBRSxDQUN6QjthQUNBLFNBQVMsQ0FBQyxDQUFDLEdBQVcsRUFBRSxFQUFFO1lBQ3ZCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUM7Z0JBQ2pDLEdBQUcsRUFBRSxHQUFHO2FBQ1gsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRUQsSUFBSTtRQUNBLElBQUksQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDckMsQ0FBQzs4R0F4RlEsTUFBTSxnRUEwQkgsbUJBQW1CO2tIQTFCdEIsTUFBTSxjQUZILE1BQU07OzJGQUVULE1BQU07a0JBSGxCLFVBQVU7bUJBQUM7b0JBQ1IsVUFBVSxFQUFFLE1BQU07aUJBQ3JCOzswQkEyQlEsTUFBTTsyQkFBQyxtQkFBbUI7OzBCQUFHLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBJbmplY3QsIE9wdGlvbmFsLCBJbmplY3RvciB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTmF2aWdhdGlvbkVuZCwgUm91dGVyRXZlbnQsIFJvdXRlciB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBQbGFuZXRPcHRpb25zLCBQbGFuZXRBcHBsaWNhdGlvbiwgUExBTkVUX0FQUExJQ0FUSU9OUyB9IGZyb20gJy4vcGxhbmV0LmNsYXNzJztcbmltcG9ydCB7IFBsYW5ldEFwcGxpY2F0aW9uU2VydmljZSB9IGZyb20gJy4vYXBwbGljYXRpb24vcGxhbmV0LWFwcGxpY2F0aW9uLnNlcnZpY2UnO1xuaW1wb3J0IHtcbiAgICBQbGFuZXRBcHBsaWNhdGlvbkxvYWRlcixcbiAgICBBcHBzTG9hZGluZ1N0YXJ0RXZlbnQsXG4gICAgQXBwU3RhdHVzQ2hhbmdlRXZlbnRcbn0gZnJvbSAnLi9hcHBsaWNhdGlvbi9wbGFuZXQtYXBwbGljYXRpb24tbG9hZGVyJztcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZmlsdGVyLCBzdGFydFdpdGgsIGRpc3RpbmN0VW50aWxDaGFuZ2VkLCBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge1xuICAgIHNldFBvcnRhbEFwcGxpY2F0aW9uRGF0YSxcbiAgICBzZXRBcHBsaWNhdGlvbkxvYWRlcixcbiAgICBzZXRBcHBsaWNhdGlvblNlcnZpY2UsXG4gICAgZ2V0QXBwbGljYXRpb25Mb2FkZXIsXG4gICAgZ2V0QXBwbGljYXRpb25TZXJ2aWNlXG59IGZyb20gJy4vZ2xvYmFsLXBsYW5ldCc7XG5pbXBvcnQgeyBzZXREZWJ1Z0ZhY3RvcnkgfSBmcm9tICcuL2RlYnVnJztcblxuQEluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBQbGFuZXQge1xuICAgIHByaXZhdGUgZ2V0IHBsYW5ldEFwcGxpY2F0aW9uTG9hZGVyKCk6IFBsYW5ldEFwcGxpY2F0aW9uTG9hZGVyIHtcbiAgICAgICAgcmV0dXJuIGdldEFwcGxpY2F0aW9uTG9hZGVyKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXQgcGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0QXBwbGljYXRpb25TZXJ2aWNlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBsb2FkaW5nRG9uZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGxhbmV0QXBwbGljYXRpb25Mb2FkZXIubG9hZGluZ0RvbmU7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBhcHBTdGF0dXNDaGFuZ2UoKTogT2JzZXJ2YWJsZTxBcHBTdGF0dXNDaGFuZ2VFdmVudD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wbGFuZXRBcHBsaWNhdGlvbkxvYWRlci5hcHBTdGF0dXNDaGFuZ2U7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBhcHBzTG9hZGluZ1N0YXJ0KCk6IE9ic2VydmFibGU8QXBwc0xvYWRpbmdTdGFydEV2ZW50PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYW5ldEFwcGxpY2F0aW9uTG9hZGVyLmFwcHNMb2FkaW5nU3RhcnQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdWJzY3JpcHRpb24/OiBTdWJzY3JpcHRpb247XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IsXG4gICAgICAgIHByaXZhdGUgcm91dGVyOiBSb3V0ZXIsXG4gICAgICAgIEBJbmplY3QoUExBTkVUX0FQUExJQ0FUSU9OUykgQE9wdGlvbmFsKCkgcGxhbmV0QXBwbGljYXRpb25zOiBQbGFuZXRBcHBsaWNhdGlvbltdXG4gICAgKSB7XG4gICAgICAgIGlmICghdGhpcy5wbGFuZXRBcHBsaWNhdGlvbkxvYWRlcikge1xuICAgICAgICAgICAgc2V0QXBwbGljYXRpb25Mb2FkZXIodGhpcy5pbmplY3Rvci5nZXQoUGxhbmV0QXBwbGljYXRpb25Mb2FkZXIpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMucGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgICAgICBzZXRBcHBsaWNhdGlvblNlcnZpY2UodGhpcy5pbmplY3Rvci5nZXQoUGxhbmV0QXBwbGljYXRpb25TZXJ2aWNlKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGxhbmV0QXBwbGljYXRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQXBwcyhwbGFuZXRBcHBsaWNhdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0T3B0aW9ucyhvcHRpb25zOiBQYXJ0aWFsPFBsYW5ldE9wdGlvbnM+KSB7XG4gICAgICAgIHRoaXMucGxhbmV0QXBwbGljYXRpb25Mb2FkZXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgaWYgKG9wdGlvbnMuZGVidWdGYWN0b3J5KSB7XG4gICAgICAgICAgICBzZXREZWJ1Z0ZhY3Rvcnkob3B0aW9ucy5kZWJ1Z0ZhY3RvcnkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0UG9ydGFsQXBwRGF0YTxUPihkYXRhOiBUKSB7XG4gICAgICAgIHNldFBvcnRhbEFwcGxpY2F0aW9uRGF0YShkYXRhKTtcbiAgICB9XG5cbiAgICByZWdpc3RlckFwcDxURXh0cmE+KGFwcDogUGxhbmV0QXBwbGljYXRpb248VEV4dHJhPikge1xuICAgICAgICB0aGlzLnBsYW5ldEFwcGxpY2F0aW9uU2VydmljZS5yZWdpc3RlcihhcHApO1xuICAgIH1cblxuICAgIHJlZ2lzdGVyQXBwczxURXh0cmE+KGFwcHM6IFBsYW5ldEFwcGxpY2F0aW9uPFRFeHRyYT5bXSkge1xuICAgICAgICB0aGlzLnBsYW5ldEFwcGxpY2F0aW9uU2VydmljZS5yZWdpc3RlcihhcHBzKTtcbiAgICB9XG5cbiAgICB1bnJlZ2lzdGVyQXBwKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLnBsYW5ldEFwcGxpY2F0aW9uU2VydmljZS51bnJlZ2lzdGVyKG5hbWUpO1xuICAgIH1cblxuICAgIGdldEFwcHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsYW5ldEFwcGxpY2F0aW9uU2VydmljZS5nZXRBcHBzKCk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uID0gKHRoaXMucm91dGVyLmV2ZW50cyBhcyBPYnNlcnZhYmxlPFJvdXRlckV2ZW50PilcbiAgICAgICAgICAgIC5waXBlKFxuICAgICAgICAgICAgICAgIGZpbHRlcihldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudCBpbnN0YW5jZW9mIE5hdmlnYXRpb25FbmQ7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbWFwKGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChldmVudCBhcyBOYXZpZ2F0aW9uRW5kKS51cmxBZnRlclJlZGlyZWN0cyB8fCBldmVudC51cmw7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgc3RhcnRXaXRoKGxvY2F0aW9uLnBhdGhuYW1lKSxcbiAgICAgICAgICAgICAgICBkaXN0aW5jdFVudGlsQ2hhbmdlZCgpXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh1cmw6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucGxhbmV0QXBwbGljYXRpb25Mb2FkZXIucmVyb3V0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgICB9XG59XG4iXX0=