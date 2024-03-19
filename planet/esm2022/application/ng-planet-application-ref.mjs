import { NgModuleRef, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { take } from 'rxjs/operators';
import { from } from 'rxjs';
import { getTagNameByTemplate } from '../helpers';
import { getSandboxInstance } from '../sandbox/';
export class NgPlanetApplicationRef {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctcGxhbmV0LWFwcGxpY2F0aW9uLXJlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL3BsYW5ldC9zcmMvYXBwbGljYXRpb24vbmctcGxhbmV0LWFwcGxpY2F0aW9uLXJlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQWtCLFdBQVcsRUFBRSxNQUFNLEVBQXVCLE1BQU0sZUFBZSxDQUFDO0FBQ3pGLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDeEQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBYyxJQUFJLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFJeEMsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ2xELE9BQU8sRUFBRSxrQkFBa0IsRUFBVyxNQUFNLGFBQWEsQ0FBQztBQXVCMUQsTUFBTSxPQUFPLHNCQUFzQjtJQVcvQixJQUFXLFFBQVE7UUFDZixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDOUIsQ0FBQztJQUVELElBQVcsTUFBTTtRQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxJQUFXLE9BQU87UUFDZCxPQUFPLGtCQUFrQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELElBQVcsWUFBWTtRQUNuQixPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRCxZQUFZLElBQVksRUFBRSxPQUEwQjtRQUNoRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ1YsSUFB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SUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7UUFDOUIsQ0FBQztJQUNMLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcGxpY2F0aW9uUmVmLCBOZ01vZHVsZVJlZiwgTmdab25lLCBFbnZpcm9ubWVudEluamVjdG9yIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBSb3V0ZXIsIE5hdmlnYXRpb25FbmQgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgdGFrZSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGZyb20gfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFBsYW5ldFBvcnRhbEFwcGxpY2F0aW9uIH0gZnJvbSAnLi9wb3J0YWwtYXBwbGljYXRpb24nO1xuaW1wb3J0IHsgUGxhbnRDb21wb25lbnRDb25maWcgfSBmcm9tICcuLi9jb21wb25lbnQvcGxhbnQtY29tcG9uZW50LmNvbmZpZyc7XG5pbXBvcnQgeyBQbGFuZXRDb21wb25lbnRSZWYgfSBmcm9tICcuLi9jb21wb25lbnQvcGxhbmV0LWNvbXBvbmVudC1yZWYnO1xuaW1wb3J0IHsgZ2V0VGFnTmFtZUJ5VGVtcGxhdGUgfSBmcm9tICcuLi9oZWxwZXJzJztcbmltcG9ydCB7IGdldFNhbmRib3hJbnN0YW5jZSwgU2FuZGJveCB9IGZyb20gJy4uL3NhbmRib3gvJztcbmltcG9ydCB7IFBsYW5ldEFwcGxpY2F0aW9uUmVmIH0gZnJvbSAnLi9wbGFuZXQtYXBwbGljYXRpb24tcmVmJztcblxuZXhwb3J0IHR5cGUgTmdCb290c3RyYXBBcHBNb2R1bGUgPSAoXG4gICAgcG9ydGFsQXBwOiBQbGFuZXRQb3J0YWxBcHBsaWNhdGlvblxuKSA9PiBQcm9taXNlPE5nTW9kdWxlUmVmPGFueT4gfCB2b2lkIHwgQXBwbGljYXRpb25SZWYgfCB1bmRlZmluZWQgfCBudWxsPjtcblxuZXhwb3J0IGludGVyZmFjZSBOZ0Jvb3RzdHJhcE9wdGlvbnMge1xuICAgIHRlbXBsYXRlOiBzdHJpbmc7XG4gICAgYm9vdHN0cmFwOiBOZ0Jvb3RzdHJhcEFwcE1vZHVsZTtcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBwbGVhc2UgdXNlIE5nQm9vdHN0cmFwQXBwTW9kdWxlXG4gKi9cbmV4cG9ydCB0eXBlIEJvb3RzdHJhcEFwcE1vZHVsZSA9IE5nQm9vdHN0cmFwQXBwTW9kdWxlO1xuLyoqXG4gKiBAZGVwcmVjYXRlZCBwbGVhc2UgdXNlIE5nQm9vdHN0cmFwT3B0aW9uc1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEJvb3RzdHJhcE9wdGlvbnMgZXh0ZW5kcyBOZ0Jvb3RzdHJhcE9wdGlvbnMge31cblxuZXhwb3J0IHR5cGUgUGxhbnRDb21wb25lbnRGYWN0b3J5ID0gPFREYXRhLCBUQ29tcD4oY29tcG9uZW50TmFtZTogc3RyaW5nLCBjb25maWc6IFBsYW50Q29tcG9uZW50Q29uZmlnPFREYXRhPikgPT4gUGxhbmV0Q29tcG9uZW50UmVmPFRDb21wPjtcblxuZXhwb3J0IGNsYXNzIE5nUGxhbmV0QXBwbGljYXRpb25SZWYgaW1wbGVtZW50cyBQbGFuZXRBcHBsaWNhdGlvblJlZiB7XG4gICAgcHJpdmF0ZSBpbmplY3Rvcj86IEVudmlyb25tZW50SW5qZWN0b3I7XG4gICAgcHJpdmF0ZSBhcHBSZWY/OiBBcHBsaWNhdGlvblJlZjtcbiAgICBwdWJsaWMgYXBwTW9kdWxlUmVmPzogTmdNb2R1bGVSZWY8YW55PjtcbiAgICBwdWJsaWMgdGVtcGxhdGU/OiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBpbm5lclNlbGVjdG9yPzogc3RyaW5nO1xuICAgIHByaXZhdGUgbmFtZTogc3RyaW5nO1xuICAgIHByaXZhdGUgcG9ydGFsQXBwITogUGxhbmV0UG9ydGFsQXBwbGljYXRpb247XG4gICAgcHJpdmF0ZSBhcHBNb2R1bGVCb290c3RyYXA/OiBOZ0Jvb3RzdHJhcEFwcE1vZHVsZTtcbiAgICBwcml2YXRlIGNvbXBvbmVudEZhY3Rvcnk/OiBQbGFudENvbXBvbmVudEZhY3Rvcnk7XG5cbiAgICBwdWJsaWMgZ2V0IHNlbGVjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbm5lclNlbGVjdG9yO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgbmdab25lKCk6IE5nWm9uZSB8IHVuZGVmaW5lZCB7XG4gICAgICAgIHJldHVybiAodGhpcy5pbmplY3RvciB8fCB0aGlzLmFwcE1vZHVsZVJlZj8uaW5qZWN0b3IpPy5nZXQoTmdab25lKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHNhbmRib3goKTogU2FuZGJveCB7XG4gICAgICAgIHJldHVybiBnZXRTYW5kYm94SW5zdGFuY2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGJvb3RzdHJhcHBlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuICEhKHRoaXMuYXBwTW9kdWxlUmVmIHx8IHRoaXMuYXBwUmVmKTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIG9wdGlvbnM/OiBCb290c3RyYXBPcHRpb25zKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlID0gb3B0aW9ucy50ZW1wbGF0ZTtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJTZWxlY3RvciA9IHRoaXMudGVtcGxhdGUgPyBnZXRUYWdOYW1lQnlUZW1wbGF0ZSh0aGlzLnRlbXBsYXRlKSA6ICcnO1xuICAgICAgICAgICAgdGhpcy5hcHBNb2R1bGVCb290c3RyYXAgPSBvcHRpb25zLmJvb3RzdHJhcDtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGlzIGlzIGEgaGFjaywgc2luY2UgTmdab25lIGRvZXNuJ3QgYWxsb3cgeW91IHRvIGNvbmZpZ3VyZSB0aGUgcHJvcGVydHkgdGhhdCBpZGVudGlmaWVzIHlvdXIgem9uZS5cbiAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9QbGFjZU1lLVNBUy9zaW5nbGUtc3BhLWFuZ3VsYXItY2xpL2lzc3Vlcy8zMyxcbiAgICAgICAgLy8gTmdab25lLmlzSW5Bbmd1bGFyWm9uZSA9ICgpID0+IHtcbiAgICAgICAgLy8gICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgLy8gICAgIHJldHVybiB3aW5kb3cuWm9uZS5jdXJyZW50Ll9wcm9wZXJ0aWVzW2BuZ3gtcGxhbmV0LSR7bmFtZX1gXSA9PT0gdHJ1ZTtcbiAgICAgICAgLy8gfTtcbiAgICB9XG5cbiAgICAvLyDlrZDlupTnlKjot6/nlLHlj5jljJblkI7lkIzmraXkv67mlLkgcG9ydGFsIOeahCBSb3V0ZVxuICAgIHByaXZhdGUgc3luY1BvcnRhbFJvdXRlV2hlbk5hdmlnYXRpb25FbmQoKSB7XG4gICAgICAgIGNvbnN0IHJvdXRlciA9ICh0aGlzLmluamVjdG9yIHx8IHRoaXMuYXBwTW9kdWxlUmVmPy5pbmplY3Rvcik/LmdldChSb3V0ZXIpO1xuICAgICAgICBpZiAocm91dGVyKSB7XG4gICAgICAgICAgICByb3V0ZXIuZXZlbnRzLnN1YnNjcmliZShldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50IGluc3RhbmNlb2YgTmF2aWdhdGlvbkVuZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZT8ub25TdGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hc09ic2VydmFibGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnBpcGUodGFrZSgxKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9ydGFsQXBwLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcnRhbEFwcC5yb3V0ZXIhLm5hdmlnYXRlQnlVcmwoZXZlbnQudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYm9vdHN0cmFwKGFwcDogUGxhbmV0UG9ydGFsQXBwbGljYXRpb24pOiBPYnNlcnZhYmxlPHRoaXM+IHtcbiAgICAgICAgaWYgKCF0aGlzLmFwcE1vZHVsZUJvb3RzdHJhcCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBhcHAoJHt0aGlzLm5hbWV9KSBpcyBub3QgZGVmaW5lZGApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9ydGFsQXBwID0gYXBwO1xuICAgICAgICByZXR1cm4gZnJvbShcbiAgICAgICAgICAgIHRoaXMuYXBwTW9kdWxlQm9vdHN0cmFwKGFwcCkudGhlbihhcHBNb2R1bGVSZWYgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhcHBNb2R1bGVSZWZbJ2luc3RhbmNlJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBNb2R1bGVSZWYgPSBhcHBNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWY8YW55PjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBNb2R1bGVSZWYuaW5zdGFuY2UuYXBwTmFtZSA9IHRoaXMubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmplY3RvciA9IHRoaXMuYXBwTW9kdWxlUmVmLmluamVjdG9yO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwUmVmID0gYXBwTW9kdWxlUmVmIGFzIHVua25vd24gYXMgQXBwbGljYXRpb25SZWY7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5qZWN0b3IgPSB0aGlzLmFwcFJlZi5pbmplY3RvcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9kdWxlUmVmID0gdGhpcy5hcHBSZWYuaW5qZWN0b3IuZ2V0KE5nTW9kdWxlUmVmKTtcbiAgICAgICAgICAgICAgICAgICAgKG1vZHVsZVJlZiBhcyBhbnkpLmluc3RhbmNlID0geyBhcHBOYW1lOiB0aGlzLm5hbWUgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zeW5jUG9ydGFsUm91dGVXaGVuTmF2aWdhdGlvbkVuZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBnZXRSb3V0ZXIoKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5pbmplY3RvciB8fCB0aGlzLmFwcE1vZHVsZVJlZj8uaW5qZWN0b3IpPy5nZXQoUm91dGVyKTtcbiAgICB9XG5cbiAgICBnZXRDdXJyZW50Um91dGVyU3RhdGVVcmwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFJvdXRlcigpPy5yb3V0ZXJTdGF0ZS5zbmFwc2hvdC51cmw7XG4gICAgfVxuXG4gICAgbmF2aWdhdGVCeVVybCh1cmw6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBjb25zdCByb3V0ZXIgPSB0aGlzLmdldFJvdXRlcigpO1xuICAgICAgICB0aGlzLm5nWm9uZT8ucnVuKCgpID0+IHtcbiAgICAgICAgICAgIHJvdXRlcj8ubmF2aWdhdGVCeVVybCh1cmwpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRDb21wb25lbnRGYWN0b3J5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnRGYWN0b3J5O1xuICAgIH1cblxuICAgIHJlZ2lzdGVyQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnRGYWN0b3J5OiBQbGFudENvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50RmFjdG9yeTtcbiAgICB9XG5cbiAgICBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5hcHBNb2R1bGVSZWYgfHwgdGhpcy5hcHBSZWYpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvdXRlciA9ICh0aGlzLmluamVjdG9yIHx8IHRoaXMuYXBwTW9kdWxlUmVmPy5pbmplY3Rvcik/LmdldChSb3V0ZXIpO1xuICAgICAgICAgICAgaWYgKHJvdXRlcikge1xuICAgICAgICAgICAgICAgIHJvdXRlci5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5zYW5kYm94KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zYW5kYm94LmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYXBwTW9kdWxlUmVmPy5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmFwcE1vZHVsZVJlZiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuYXBwUmVmPy5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmFwcFJlZiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0b3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=