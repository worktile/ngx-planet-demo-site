import { Injectable, ApplicationRef, NgModuleRef, NgZone, Inject, Injector, createComponent, reflectComponentType } from '@angular/core';
import { PlanetComponentRef } from './planet-component-ref';
import { coerceArray } from '../helpers';
import { map, shareReplay, delayWhen } from 'rxjs/operators';
import { of, timer } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { getApplicationLoader, getApplicationService, getPlanetApplicationRef, getBootstrappedPlanetApplicationRef } from '../global-planet';
import * as i0 from "@angular/core";
const componentWrapperClass = 'planet-component-wrapper';
function isComponentType(component) {
    return typeof component === 'function' && component.constructor === Function;
}
export class PlanetComponentLoader {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbmV0LWNvbXBvbmVudC1sb2FkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGFuZXQvc3JjL2NvbXBvbmVudC9wbGFuZXQtY29tcG9uZW50LWxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0gsVUFBVSxFQUNWLGNBQWMsRUFDZCxXQUFXLEVBQ1gsTUFBTSxFQUVOLE1BQU0sRUFDTixRQUFRLEVBQ1IsZUFBZSxFQUlmLG9CQUFvQixFQUV2QixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUU1RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzdELE9BQU8sRUFBRSxFQUFFLEVBQWMsS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQzdDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMzQyxPQUFPLEVBQ0gsb0JBQW9CLEVBQ3BCLHFCQUFxQixFQUNyQix1QkFBdUIsRUFDdkIsbUNBQW1DLEVBQ3RDLE1BQU0sa0JBQWtCLENBQUM7O0FBRzFCLE1BQU0scUJBQXFCLEdBQUcsMEJBQTBCLENBQUM7QUFFekQsU0FBUyxlQUFlLENBQUksU0FBNkI7SUFDckQsT0FBTyxPQUFPLFNBQVMsS0FBSyxVQUFVLElBQUksU0FBUyxDQUFDLFdBQVcsS0FBSyxRQUFRLENBQUM7QUFDakYsQ0FBQztBQVlELE1BQU0sT0FBTyxxQkFBcUI7SUFDOUIsSUFBWSxpQkFBaUI7UUFDekIsT0FBTyxvQkFBb0IsRUFBRSxDQUFDO0lBQ2xDLENBQUM7SUFFRCxJQUFZLGtCQUFrQjtRQUMxQixPQUFPLHFCQUFxQixFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVELFlBQ1ksY0FB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LENBQUM7UUFDTCxDQUFDLENBQUMsRUFDRixXQUFXLEVBQUUsQ0FDaEIsQ0FBQztRQUNGLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNuQixPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDOzhHQXZLUSxxQkFBcUIsaUdBYWxCLFFBQVE7a0hBYlgscUJBQXFCLGNBRmxCLE1BQU07OzJGQUVULHFCQUFxQjtrQkFIakMsVUFBVTttQkFBQztvQkFDUixVQUFVLEVBQUUsTUFBTTtpQkFDckI7OzBCQWNRLE1BQU07MkJBQUMsUUFBUSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgSW5qZWN0YWJsZSxcbiAgICBBcHBsaWNhdGlvblJlZixcbiAgICBOZ01vZHVsZVJlZixcbiAgICBOZ1pvbmUsXG4gICAgRWxlbWVudFJlZixcbiAgICBJbmplY3QsXG4gICAgSW5qZWN0b3IsXG4gICAgY3JlYXRlQ29tcG9uZW50LFxuICAgIFR5cGUsXG4gICAgQ29tcG9uZW50UmVmLFxuICAgIEVtYmVkZGVkVmlld1JlZixcbiAgICByZWZsZWN0Q29tcG9uZW50VHlwZSxcbiAgICBFbnZpcm9ubWVudEluamVjdG9yXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgUGxhbmV0QXBwbGljYXRpb25SZWYgfSBmcm9tICcuLi9hcHBsaWNhdGlvbi9wbGFuZXQtYXBwbGljYXRpb24tcmVmJztcbmltcG9ydCB7IFBsYW5ldENvbXBvbmVudFJlZiB9IGZyb20gJy4vcGxhbmV0LWNvbXBvbmVudC1yZWYnO1xuaW1wb3J0IHsgUGxhbnRDb21wb25lbnRDb25maWcgfSBmcm9tICcuL3BsYW50LWNvbXBvbmVudC5jb25maWcnO1xuaW1wb3J0IHsgY29lcmNlQXJyYXkgfSBmcm9tICcuLi9oZWxwZXJzJztcbmltcG9ydCB7IG1hcCwgc2hhcmVSZXBsYXksIGRlbGF5V2hlbiB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IG9mLCBPYnNlcnZhYmxlLCB0aW1lciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgRE9DVU1FTlQgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgICBnZXRBcHBsaWNhdGlvbkxvYWRlcixcbiAgICBnZXRBcHBsaWNhdGlvblNlcnZpY2UsXG4gICAgZ2V0UGxhbmV0QXBwbGljYXRpb25SZWYsXG4gICAgZ2V0Qm9vdHN0cmFwcGVkUGxhbmV0QXBwbGljYXRpb25SZWZcbn0gZnJvbSAnLi4vZ2xvYmFsLXBsYW5ldCc7XG5pbXBvcnQgeyBOZ1BsYW5ldEFwcGxpY2F0aW9uUmVmIH0gZnJvbSAnLi4vYXBwbGljYXRpb24vbmctcGxhbmV0LWFwcGxpY2F0aW9uLXJlZic7XG5cbmNvbnN0IGNvbXBvbmVudFdyYXBwZXJDbGFzcyA9ICdwbGFuZXQtY29tcG9uZW50LXdyYXBwZXInO1xuXG5mdW5jdGlvbiBpc0NvbXBvbmVudFR5cGU8VD4oY29tcG9uZW50OiBQbGFuZXRDb21wb25lbnQ8VD4pOiBjb21wb25lbnQgaXMgVHlwZTxUPiB7XG4gICAgcmV0dXJuIHR5cGVvZiBjb21wb25lbnQgPT09ICdmdW5jdGlvbicgJiYgY29tcG9uZW50LmNvbnN0cnVjdG9yID09PSBGdW5jdGlvbjtcbn1cblxuZXhwb3J0IHR5cGUgUGxhbmV0Q29tcG9uZW50PFQgPSB1bmtub3duPiA9XG4gICAgfCB7XG4gICAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICAgIGNvbXBvbmVudDogVHlwZTxUPjtcbiAgICAgIH1cbiAgICB8IFR5cGU8VD47XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgUGxhbmV0Q29tcG9uZW50TG9hZGVyIHtcbiAgICBwcml2YXRlIGdldCBhcHBsaWNhdGlvbkxvYWRlcigpIHtcbiAgICAgICAgcmV0dXJuIGdldEFwcGxpY2F0aW9uTG9hZGVyKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXQgYXBwbGljYXRpb25TZXJ2aWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0QXBwbGljYXRpb25TZXJ2aWNlKCk7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgYXBwbGljYXRpb25SZWY6IEFwcGxpY2F0aW9uUmVmLFxuICAgICAgICBwcml2YXRlIG5nTW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+LFxuICAgICAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgICAgICBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIGRvY3VtZW50OiBhbnlcbiAgICApIHt9XG5cbiAgICBwcml2YXRlIGdldFBsYW50QXBwUmVmKG5hbWU6IHN0cmluZyk6IE9ic2VydmFibGU8UGxhbmV0QXBwbGljYXRpb25SZWY+IHtcbiAgICAgICAgY29uc3QgcGxhbnRBcHBSZWYgPSBnZXRCb290c3RyYXBwZWRQbGFuZXRBcHBsaWNhdGlvblJlZihuYW1lKTtcbiAgICAgICAgaWYgKHBsYW50QXBwUmVmKSB7XG4gICAgICAgICAgICByZXR1cm4gb2YocGxhbnRBcHBSZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHBsaWNhdGlvblNlcnZpY2UuZ2V0QXBwQnlOYW1lKG5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbGljYXRpb25Mb2FkZXIucHJlbG9hZChhcHAsIHRydWUpLnBpcGUoXG4gICAgICAgICAgICAgICAgbWFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldFBsYW5ldEFwcGxpY2F0aW9uUmVmKG5hbWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVJbmplY3RvcjxURGF0YT4ocGFyZW50SW5qZWN0b3I6IEluamVjdG9yLCBjb21wb25lbnRSZWY6IFBsYW5ldENvbXBvbmVudFJlZjxURGF0YT4pOiBJbmplY3RvciB7XG4gICAgICAgIHJldHVybiBJbmplY3Rvci5jcmVhdGUoe1xuICAgICAgICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwcm92aWRlOiBQbGFuZXRDb21wb25lbnRSZWYsXG4gICAgICAgICAgICAgICAgICAgIHVzZVZhbHVlOiBjb21wb25lbnRSZWZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcGFyZW50OiBwYXJlbnRJbmplY3RvclxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvbnRhaW5lckVsZW1lbnQoY29uZmlnOiBQbGFudENvbXBvbmVudENvbmZpZyk6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgaWYgKCFjb25maWcuY29udGFpbmVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvbmZpZyAnY29udGFpbmVyJyBjYW5ub3QgYmUgbnVsbGApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKChjb25maWcuY29udGFpbmVyIGFzIEVsZW1lbnRSZWYpLm5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGNvbmZpZy5jb250YWluZXIgYXMgRWxlbWVudFJlZikubmF0aXZlRWxlbWVudDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZy5jb250YWluZXIgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGluc2VydENvbXBvbmVudFJvb3ROb2RlVG9Db250YWluZXIoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgY29tcG9uZW50Um9vdE5vZGU6IEhUTUxFbGVtZW50LCBob3N0Q2xhc3M6IHN0cmluZykge1xuICAgICAgICBjb25zdCBzdWJBcHAgPSB0aGlzLmFwcGxpY2F0aW9uU2VydmljZS5nZXRBcHBCeU5hbWUodGhpcy5uZ01vZHVsZVJlZi5pbnN0YW5jZS5hcHBOYW1lKTtcbiAgICAgICAgY29tcG9uZW50Um9vdE5vZGUuY2xhc3NMaXN0LmFkZChjb21wb25lbnRXcmFwcGVyQ2xhc3MpO1xuICAgICAgICBjb21wb25lbnRSb290Tm9kZS5zZXRBdHRyaWJ1dGUoJ3BsYW5ldC1pbmxpbmUnLCAnJyk7XG4gICAgICAgIGlmIChob3N0Q2xhc3MpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudFJvb3ROb2RlLmNsYXNzTGlzdC5hZGQoaG9zdENsYXNzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3ViQXBwICYmIHN1YkFwcC5zdHlsZVByZWZpeCkge1xuICAgICAgICAgICAgY29tcG9uZW50Um9vdE5vZGUuY2xhc3NMaXN0LmFkZChzdWJBcHAuc3R5bGVQcmVmaXgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnRhaW5lciDmmK/ms6jph4rliJnlnKjliY3mlrnmj5LlhaXvvIzlkKbliJnlnKjlhYPntKDlhoXpg6jmj5LlhaVcbiAgICAgICAgaWYgKGNvbnRhaW5lci5ub2RlVHlwZSA9PT0gOCkge1xuICAgICAgICAgICAgY29udGFpbmVyLnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbXBvbmVudFJvb3ROb2RlLCBjb250YWluZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvbXBvbmVudFJvb3ROb2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXR0YWNoQ29tcG9uZW50PFREYXRhPihcbiAgICAgICAgY29tcG9uZW50OiBUeXBlPHVua25vd24+LFxuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yOiBFbnZpcm9ubWVudEluamVjdG9yLFxuICAgICAgICBjb25maWc6IFBsYW50Q29tcG9uZW50Q29uZmlnXG4gICAgKTogUGxhbmV0Q29tcG9uZW50UmVmPFREYXRhPiB7XG4gICAgICAgIGNvbnN0IHBsYW50Q29tcG9uZW50UmVmID0gbmV3IFBsYW5ldENvbXBvbmVudFJlZigpO1xuICAgICAgICBjb25zdCBhcHBSZWYgPSB0aGlzLmFwcGxpY2F0aW9uUmVmO1xuICAgICAgICBjb25zdCBpbmplY3RvciA9IHRoaXMuY3JlYXRlSW5qZWN0b3I8VERhdGE+KGVudmlyb25tZW50SW5qZWN0b3IsIHBsYW50Q29tcG9uZW50UmVmKTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5nZXRDb250YWluZXJFbGVtZW50KGNvbmZpZyk7XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9IGNyZWF0ZUNvbXBvbmVudChjb21wb25lbnQsIHtcbiAgICAgICAgICAgIGVudmlyb25tZW50SW5qZWN0b3I6IGVudmlyb25tZW50SW5qZWN0b3IsXG4gICAgICAgICAgICBlbGVtZW50SW5qZWN0b3I6IGluamVjdG9yXG4gICAgICAgIH0pO1xuICAgICAgICBhcHBSZWYuYXR0YWNoVmlldyhjb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgICAgICBjb25zdCBjb21wb25lbnRSb290Tm9kZSA9IHRoaXMuZ2V0Q29tcG9uZW50Um9vdE5vZGUoY29tcG9uZW50UmVmKTtcbiAgICAgICAgdGhpcy5pbnNlcnRDb21wb25lbnRSb290Tm9kZVRvQ29udGFpbmVyKGNvbnRhaW5lciwgY29tcG9uZW50Um9vdE5vZGUsIGNvbmZpZy5ob3N0Q2xhc3MgfHwgY29uZmlnLndyYXBwZXJDbGFzcyk7XG4gICAgICAgIGlmIChjb25maWcuaW5pdGlhbFN0YXRlKSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGNvbXBvbmVudFJlZi5pbnN0YW5jZSwgY29uZmlnLmluaXRpYWxTdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcGxhbnRDb21wb25lbnRSZWYuY29tcG9uZW50SW5zdGFuY2UgPSBjb21wb25lbnRSZWYuaW5zdGFuY2U7XG4gICAgICAgIHBsYW50Q29tcG9uZW50UmVmLmNvbXBvbmVudFJlZiA9IGNvbXBvbmVudFJlZjtcbiAgICAgICAgcGxhbnRDb21wb25lbnRSZWYuaG9zdEVsZW1lbnQgPSBjb21wb25lbnRSb290Tm9kZTtcbiAgICAgICAgcGxhbnRDb21wb25lbnRSZWYuZGlzcG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChhcHBSZWYudmlld0NvdW50ID4gMCkge1xuICAgICAgICAgICAgICAgIGFwcFJlZi5kZXRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb21wb25lbnRSZWY/LmRlc3Ryb3koKTtcbiAgICAgICAgICAgIGNvbXBvbmVudFJvb3ROb2RlLnJlbW92ZSgpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcGxhbnRDb21wb25lbnRSZWY7XG4gICAgfVxuXG4gICAgLyoqIEdldHMgdGhlIHJvb3QgSFRNTEVsZW1lbnQgZm9yIGFuIGluc3RhbnRpYXRlZCBjb21wb25lbnQuICovXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRSb290Tm9kZShjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogSFRNTEVsZW1lbnQge1xuICAgICAgICByZXR1cm4gKGNvbXBvbmVudFJlZi5ob3N0VmlldyBhcyBFbWJlZGRlZFZpZXdSZWY8YW55Pikucm9vdE5vZGVzWzBdIGFzIEhUTUxFbGVtZW50O1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVnaXN0ZXJDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudE9yQ29tcG9uZW50czogUGxhbmV0Q29tcG9uZW50IHwgUGxhbmV0Q29tcG9uZW50W10pIHtcbiAgICAgICAgY29uc3QgYXBwID0gdGhpcy5uZ01vZHVsZVJlZi5pbnN0YW5jZS5hcHBOYW1lO1xuICAgICAgICB0aGlzLmdldFBsYW50QXBwUmVmKGFwcCkuc3Vic2NyaWJlKChhcHBSZWY6IE5nUGxhbmV0QXBwbGljYXRpb25SZWYpID0+IHtcbiAgICAgICAgICAgIGFwcFJlZi5yZWdpc3RlckNvbXBvbmVudEZhY3RvcnkoKGNvbXBvbmVudE5hbWU6IHN0cmluZywgY29uZmlnOiBQbGFudENvbXBvbmVudENvbmZpZzxhbnk+KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IGNvZXJjZUFycmF5KGNvbXBvbmVudE9yQ29tcG9uZW50cyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGxhbmV0Q29tcG9uZW50ID0gY29tcG9uZW50cy5maW5kKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNDb21wb25lbnRUeXBlKGl0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHJlZmxlY3RDb21wb25lbnRUeXBlKGl0ZW0pLnNlbGVjdG9yLmluY2x1ZGVzKGNvbXBvbmVudE5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGl0ZW0ubmFtZSA9PT0gY29tcG9uZW50TmFtZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocGxhbmV0Q29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50UmVmID0gdGhpcy5hdHRhY2hDb21wb25lbnQ8YW55PihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0NvbXBvbmVudFR5cGUocGxhbmV0Q29tcG9uZW50KSA/IHBsYW5ldENvbXBvbmVudCA6IHBsYW5ldENvbXBvbmVudC5jb21wb25lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwUmVmLmFwcE1vZHVsZVJlZi5pbmplY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihgdW5yZWdpc3RlcmVkIGNvbXBvbmVudCAke2NvbXBvbmVudE5hbWV9IGluIGFwcCAke2FwcH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXIoY29tcG9uZW50czogUGxhbmV0Q29tcG9uZW50IHwgUGxhbmV0Q29tcG9uZW50W10pIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgbG9hZDxUQ29tcCA9IHVua25vd24sIFREYXRhID0gdW5rbm93bj4oXG4gICAgICAgIGFwcDogc3RyaW5nLFxuICAgICAgICBjb21wb25lbnROYW1lOiBzdHJpbmcsXG4gICAgICAgIGNvbmZpZzogUGxhbnRDb21wb25lbnRDb25maWc8VERhdGE+XG4gICAgKTogT2JzZXJ2YWJsZTxQbGFuZXRDb21wb25lbnRSZWY8VENvbXA+PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZ2V0UGxhbnRBcHBSZWYoYXBwKS5waXBlKFxuICAgICAgICAgICAgZGVsYXlXaGVuKChhcHBSZWY6IE5nUGxhbmV0QXBwbGljYXRpb25SZWYpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYXBwUmVmLmdldENvbXBvbmVudEZhY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2YoJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEJlY2F1c2UgcmVnaXN0ZXIgdXNlICdzZXRUaW1lb3V0JyxzbyB0aW1lciAyMFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGltZXIoMjApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbWFwKGFwcFJlZiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IGFwcFJlZi5nZXRDb21wb25lbnRGYWN0b3J5KCk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudEZhY3Rvcnk8VERhdGEsIFRDb21wPihjb21wb25lbnROYW1lLCBjb25maWcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHthcHB9J3MgY29tcG9uZW50KCR7Y29tcG9uZW50TmFtZX0pIGlzIG5vdCByZWdpc3RlcmVkYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBzaGFyZVJlcGxheSgpXG4gICAgICAgICk7XG4gICAgICAgIHJlc3VsdC5zdWJzY3JpYmUoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG4iXX0=