import { DOCUMENT } from '@angular/common';
import { ApplicationRef, Inject, Injectable, Injector, NgModuleRef, NgZone, TemplateRef, createComponent, reflectComponentType } from '@angular/core';
import { of, timer } from 'rxjs';
import { delayWhen, map, shareReplay } from 'rxjs/operators';
import { NgPlanetApplicationRef } from '../application/ng-planet-application-ref';
import { getApplicationLoader, getApplicationService, getBootstrappedPlanetApplicationRef, getPlanetApplicationRef, globalPlanet } from '../global-planet';
import { coerceArray } from '../helpers';
import { PlanetComponentRef } from './planet-component-types';
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
            elementInjector: injector,
            projectableNodes: config.projectableNodes
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
        let appRef$;
        if (app) {
            appRef$ = this.getPlantAppRef(app);
        }
        else {
            appRef$ = of(globalPlanet.portalApplication);
        }
        appRef$.subscribe(appRef => {
            appRef.registerComponentFactory((componentName, config) => {
                const components = coerceArray(componentOrComponents);
                const planetComponent = components.find(item => {
                    return isComponentType(item)
                        ? reflectComponentType(item).selector.includes(componentName)
                        : item.name === componentName;
                });
                if (planetComponent) {
                    return this.ngZone.run(() => {
                        const componentRef = this.attachComponent(isComponentType(planetComponent) ? planetComponent : planetComponent.component, appRef instanceof NgPlanetApplicationRef ? appRef.appModuleRef.injector : this.ngModuleRef.injector, config);
                        return componentRef;
                    });
                }
                else {
                    throw Error(`unregistered component ${componentName} in app ${app}`);
                }
            });
        });
    }
    register(components, immediate) {
        if (immediate) {
            this.registerComponentFactory(components);
        }
        else {
            setTimeout(() => {
                this.registerComponentFactory(components);
            });
        }
    }
    load(app, componentName, config) {
        let appRef$;
        if (app === globalPlanet.portalApplication.name) {
            appRef$ = of(globalPlanet.portalApplication);
        }
        else {
            appRef$ = this.getPlantAppRef(app).pipe(delayWhen((appRef) => {
                if (appRef.getComponentFactory()) {
                    return of('');
                }
                else {
                    // Because register use 'setTimeout',so timer 20
                    return timer(20);
                }
            }));
        }
        const result = appRef$.pipe(map(appRef => {
            const componentFactory = appRef.getComponentFactory();
            if (componentFactory) {
                const projectableEmbeddedViewRefs = [];
                const projectableNodes = (config.projectableNodes || []).map(node => {
                    if (node instanceof TemplateRef) {
                        const viewRef = node.createEmbeddedView({});
                        projectableEmbeddedViewRefs.push(viewRef);
                        this.applicationRef.attachView(viewRef);
                        return viewRef.rootNodes;
                    }
                    else {
                        return node;
                    }
                });
                const compRef = componentFactory(componentName, { ...config, projectableNodes: projectableNodes });
                const dispose = compRef.dispose.bind(compRef);
                compRef.dispose = () => {
                    projectableEmbeddedViewRefs.forEach(viewRef => {
                        this.applicationRef.detachView(viewRef);
                        viewRef.destroy();
                    });
                    dispose();
                };
                return compRef;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbmV0LWNvbXBvbmVudC1sb2FkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGFuZXQvc3JjL2NvbXBvbmVudC9wbGFuZXQtY29tcG9uZW50LWxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDM0MsT0FBTyxFQUNILGNBQWMsRUFLZCxNQUFNLEVBQ04sVUFBVSxFQUNWLFFBQVEsRUFDUixXQUFXLEVBQ1gsTUFBTSxFQUNOLFdBQVcsRUFFWCxlQUFlLEVBQ2Ysb0JBQW9CLEVBQ3ZCLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBYyxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQzdDLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzdELE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBRWxGLE9BQU8sRUFDSCxvQkFBb0IsRUFDcEIscUJBQXFCLEVBQ3JCLG1DQUFtQyxFQUNuQyx1QkFBdUIsRUFDdkIsWUFBWSxFQUNmLE1BQU0sa0JBQWtCLENBQUM7QUFDMUIsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUN6QyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQzs7QUFHOUQsTUFBTSxxQkFBcUIsR0FBRywwQkFBMEIsQ0FBQztBQUV6RCxTQUFTLGVBQWUsQ0FBSSxTQUE2QjtJQUNyRCxPQUFPLE9BQU8sU0FBUyxLQUFLLFVBQVUsSUFBSSxTQUFTLENBQUMsV0FBVyxLQUFLLFFBQVEsQ0FBQztBQUNqRixDQUFDO0FBWUQsTUFBTSxPQUFPLHFCQUFxQjtJQUM5QixJQUFZLGlCQUFpQjtRQUN6QixPQUFPLG9CQUFvQixFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVE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Q0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFDSCxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBZSxhQUFhLEVBQUUsRUFBRSxHQUFHLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7Z0JBQ2pILE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QyxPQUFPLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRTtvQkFDbkIsMkJBQTJCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO3dCQUMxQyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDeEMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN0QixDQUFDLENBQUMsQ0FBQztvQkFDSCxPQUFPLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUM7Z0JBQ0YsT0FBTyxPQUFPLENBQUM7WUFDbkIsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxHQUFHLGdCQUFnQixhQUFhLHFCQUFxQixDQUFDLENBQUM7WUFDOUUsQ0FBQztRQUNMLENBQUMsQ0FBQyxFQUNGLFdBQVcsRUFBRSxDQUNoQixDQUFDO1FBQ0YsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25CLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7OEdBaE5RLHFCQUFxQixpR0FhbEIsUUFBUTtrSEFiWCxxQkFBcUIsY0FGbEIsTUFBTTs7MkZBRVQscUJBQXFCO2tCQUhqQyxVQUFVO21CQUFDO29CQUNSLFVBQVUsRUFBRSxNQUFNO2lCQUNyQjs7MEJBY1EsTUFBTTsyQkFBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRE9DVU1FTlQgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtcbiAgICBBcHBsaWNhdGlvblJlZixcbiAgICBDb21wb25lbnRSZWYsXG4gICAgRWxlbWVudFJlZixcbiAgICBFbWJlZGRlZFZpZXdSZWYsXG4gICAgRW52aXJvbm1lbnRJbmplY3RvcixcbiAgICBJbmplY3QsXG4gICAgSW5qZWN0YWJsZSxcbiAgICBJbmplY3RvcixcbiAgICBOZ01vZHVsZVJlZixcbiAgICBOZ1pvbmUsXG4gICAgVGVtcGxhdGVSZWYsXG4gICAgVHlwZSxcbiAgICBjcmVhdGVDb21wb25lbnQsXG4gICAgcmVmbGVjdENvbXBvbmVudFR5cGVcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBQbGFuZXRQb3J0YWxBcHBsaWNhdGlvbiB9IGZyb20gJ25neC1wbGFuZXQnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgb2YsIHRpbWVyIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBkZWxheVdoZW4sIG1hcCwgc2hhcmVSZXBsYXkgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBOZ1BsYW5ldEFwcGxpY2F0aW9uUmVmIH0gZnJvbSAnLi4vYXBwbGljYXRpb24vbmctcGxhbmV0LWFwcGxpY2F0aW9uLXJlZic7XG5pbXBvcnQgeyBQbGFuZXRBcHBsaWNhdGlvblJlZiB9IGZyb20gJy4uL2FwcGxpY2F0aW9uL3BsYW5ldC1hcHBsaWNhdGlvbi1yZWYnO1xuaW1wb3J0IHtcbiAgICBnZXRBcHBsaWNhdGlvbkxvYWRlcixcbiAgICBnZXRBcHBsaWNhdGlvblNlcnZpY2UsXG4gICAgZ2V0Qm9vdHN0cmFwcGVkUGxhbmV0QXBwbGljYXRpb25SZWYsXG4gICAgZ2V0UGxhbmV0QXBwbGljYXRpb25SZWYsXG4gICAgZ2xvYmFsUGxhbmV0XG59IGZyb20gJy4uL2dsb2JhbC1wbGFuZXQnO1xuaW1wb3J0IHsgY29lcmNlQXJyYXkgfSBmcm9tICcuLi9oZWxwZXJzJztcbmltcG9ydCB7IFBsYW5ldENvbXBvbmVudFJlZiB9IGZyb20gJy4vcGxhbmV0LWNvbXBvbmVudC10eXBlcyc7XG5pbXBvcnQgeyBQbGFudENvbXBvbmVudENvbmZpZyB9IGZyb20gJy4vcGxhbnQtY29tcG9uZW50LmNvbmZpZyc7XG5cbmNvbnN0IGNvbXBvbmVudFdyYXBwZXJDbGFzcyA9ICdwbGFuZXQtY29tcG9uZW50LXdyYXBwZXInO1xuXG5mdW5jdGlvbiBpc0NvbXBvbmVudFR5cGU8VD4oY29tcG9uZW50OiBQbGFuZXRDb21wb25lbnQ8VD4pOiBjb21wb25lbnQgaXMgVHlwZTxUPiB7XG4gICAgcmV0dXJuIHR5cGVvZiBjb21wb25lbnQgPT09ICdmdW5jdGlvbicgJiYgY29tcG9uZW50LmNvbnN0cnVjdG9yID09PSBGdW5jdGlvbjtcbn1cblxuZXhwb3J0IHR5cGUgUGxhbmV0Q29tcG9uZW50PFQgPSB1bmtub3duPiA9XG4gICAgfCB7XG4gICAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICAgIGNvbXBvbmVudDogVHlwZTxUPjtcbiAgICAgIH1cbiAgICB8IFR5cGU8VD47XG5cbkBJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgUGxhbmV0Q29tcG9uZW50TG9hZGVyIHtcbiAgICBwcml2YXRlIGdldCBhcHBsaWNhdGlvbkxvYWRlcigpIHtcbiAgICAgICAgcmV0dXJuIGdldEFwcGxpY2F0aW9uTG9hZGVyKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXQgYXBwbGljYXRpb25TZXJ2aWNlKCkge1xuICAgICAgICByZXR1cm4gZ2V0QXBwbGljYXRpb25TZXJ2aWNlKCk7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgYXBwbGljYXRpb25SZWY6IEFwcGxpY2F0aW9uUmVmLFxuICAgICAgICBwcml2YXRlIG5nTW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+LFxuICAgICAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgICAgICBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIGRvY3VtZW50OiBhbnlcbiAgICApIHt9XG5cbiAgICBwcml2YXRlIGdldFBsYW50QXBwUmVmKG5hbWU6IHN0cmluZyk6IE9ic2VydmFibGU8UGxhbmV0QXBwbGljYXRpb25SZWY+IHtcbiAgICAgICAgY29uc3QgcGxhbnRBcHBSZWYgPSBnZXRCb290c3RyYXBwZWRQbGFuZXRBcHBsaWNhdGlvblJlZihuYW1lKTtcbiAgICAgICAgaWYgKHBsYW50QXBwUmVmKSB7XG4gICAgICAgICAgICByZXR1cm4gb2YocGxhbnRBcHBSZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYXBwID0gdGhpcy5hcHBsaWNhdGlvblNlcnZpY2UuZ2V0QXBwQnlOYW1lKG5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbGljYXRpb25Mb2FkZXIucHJlbG9hZChhcHAsIHRydWUpLnBpcGUoXG4gICAgICAgICAgICAgICAgbWFwKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldFBsYW5ldEFwcGxpY2F0aW9uUmVmKG5hbWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVJbmplY3RvcjxURGF0YT4ocGFyZW50SW5qZWN0b3I6IEluamVjdG9yLCBjb21wb25lbnRSZWY6IFBsYW5ldENvbXBvbmVudFJlZjxURGF0YT4pOiBJbmplY3RvciB7XG4gICAgICAgIHJldHVybiBJbmplY3Rvci5jcmVhdGUoe1xuICAgICAgICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwcm92aWRlOiBQbGFuZXRDb21wb25lbnRSZWYsXG4gICAgICAgICAgICAgICAgICAgIHVzZVZhbHVlOiBjb21wb25lbnRSZWZcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcGFyZW50OiBwYXJlbnRJbmplY3RvclxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvbnRhaW5lckVsZW1lbnQoY29uZmlnOiBQbGFudENvbXBvbmVudENvbmZpZyk6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgaWYgKCFjb25maWcuY29udGFpbmVyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvbmZpZyAnY29udGFpbmVyJyBjYW5ub3QgYmUgbnVsbGApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKChjb25maWcuY29udGFpbmVyIGFzIEVsZW1lbnRSZWYpLm5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGNvbmZpZy5jb250YWluZXIgYXMgRWxlbWVudFJlZikubmF0aXZlRWxlbWVudDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZy5jb250YWluZXIgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGluc2VydENvbXBvbmVudFJvb3ROb2RlVG9Db250YWluZXIoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgY29tcG9uZW50Um9vdE5vZGU6IEhUTUxFbGVtZW50LCBob3N0Q2xhc3M6IHN0cmluZykge1xuICAgICAgICBjb25zdCBzdWJBcHAgPSB0aGlzLmFwcGxpY2F0aW9uU2VydmljZS5nZXRBcHBCeU5hbWUodGhpcy5uZ01vZHVsZVJlZi5pbnN0YW5jZS5hcHBOYW1lKTtcbiAgICAgICAgY29tcG9uZW50Um9vdE5vZGUuY2xhc3NMaXN0LmFkZChjb21wb25lbnRXcmFwcGVyQ2xhc3MpO1xuICAgICAgICBjb21wb25lbnRSb290Tm9kZS5zZXRBdHRyaWJ1dGUoJ3BsYW5ldC1pbmxpbmUnLCAnJyk7XG4gICAgICAgIGlmIChob3N0Q2xhc3MpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudFJvb3ROb2RlLmNsYXNzTGlzdC5hZGQoaG9zdENsYXNzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3ViQXBwICYmIHN1YkFwcC5zdHlsZVByZWZpeCkge1xuICAgICAgICAgICAgY29tcG9uZW50Um9vdE5vZGUuY2xhc3NMaXN0LmFkZChzdWJBcHAuc3R5bGVQcmVmaXgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnRhaW5lciDmmK/ms6jph4rliJnlnKjliY3mlrnmj5LlhaXvvIzlkKbliJnlnKjlhYPntKDlhoXpg6jmj5LlhaVcbiAgICAgICAgaWYgKGNvbnRhaW5lci5ub2RlVHlwZSA9PT0gOCkge1xuICAgICAgICAgICAgY29udGFpbmVyLnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbXBvbmVudFJvb3ROb2RlLCBjb250YWluZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvbXBvbmVudFJvb3ROb2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXR0YWNoQ29tcG9uZW50PFREYXRhPihcbiAgICAgICAgY29tcG9uZW50OiBUeXBlPHVua25vd24+LFxuICAgICAgICBlbnZpcm9ubWVudEluamVjdG9yOiBFbnZpcm9ubWVudEluamVjdG9yLFxuICAgICAgICBjb25maWc6IFBsYW50Q29tcG9uZW50Q29uZmlnXG4gICAgKTogUGxhbmV0Q29tcG9uZW50UmVmPFREYXRhPiB7XG4gICAgICAgIGNvbnN0IHBsYW50Q29tcG9uZW50UmVmID0gbmV3IFBsYW5ldENvbXBvbmVudFJlZigpO1xuICAgICAgICBjb25zdCBhcHBSZWYgPSB0aGlzLmFwcGxpY2F0aW9uUmVmO1xuICAgICAgICBjb25zdCBpbmplY3RvciA9IHRoaXMuY3JlYXRlSW5qZWN0b3I8VERhdGE+KGVudmlyb25tZW50SW5qZWN0b3IsIHBsYW50Q29tcG9uZW50UmVmKTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5nZXRDb250YWluZXJFbGVtZW50KGNvbmZpZyk7XG5cbiAgICAgICAgY29uc3QgY29tcG9uZW50UmVmID0gY3JlYXRlQ29tcG9uZW50KGNvbXBvbmVudCwge1xuICAgICAgICAgICAgZW52aXJvbm1lbnRJbmplY3RvcjogZW52aXJvbm1lbnRJbmplY3RvcixcbiAgICAgICAgICAgIGVsZW1lbnRJbmplY3RvcjogaW5qZWN0b3IsXG4gICAgICAgICAgICBwcm9qZWN0YWJsZU5vZGVzOiBjb25maWcucHJvamVjdGFibGVOb2RlcyBhcyBOb2RlW11bXVxuICAgICAgICB9KTtcbiAgICAgICAgYXBwUmVmLmF0dGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50Um9vdE5vZGUgPSB0aGlzLmdldENvbXBvbmVudFJvb3ROb2RlKGNvbXBvbmVudFJlZik7XG4gICAgICAgIHRoaXMuaW5zZXJ0Q29tcG9uZW50Um9vdE5vZGVUb0NvbnRhaW5lcihjb250YWluZXIsIGNvbXBvbmVudFJvb3ROb2RlLCBjb25maWcuaG9zdENsYXNzIHx8IGNvbmZpZy53cmFwcGVyQ2xhc3MpO1xuICAgICAgICBpZiAoY29uZmlnLmluaXRpYWxTdGF0ZSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihjb21wb25lbnRSZWYuaW5zdGFuY2UsIGNvbmZpZy5pbml0aWFsU3RhdGUpO1xuICAgICAgICB9XG4gICAgICAgIHBsYW50Q29tcG9uZW50UmVmLmNvbXBvbmVudEluc3RhbmNlID0gY29tcG9uZW50UmVmLmluc3RhbmNlO1xuICAgICAgICBwbGFudENvbXBvbmVudFJlZi5jb21wb25lbnRSZWYgPSBjb21wb25lbnRSZWY7XG4gICAgICAgIHBsYW50Q29tcG9uZW50UmVmLmhvc3RFbGVtZW50ID0gY29tcG9uZW50Um9vdE5vZGU7XG4gICAgICAgIHBsYW50Q29tcG9uZW50UmVmLmRpc3Bvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoYXBwUmVmLnZpZXdDb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICBhcHBSZWYuZGV0YWNoVmlldyhjb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29tcG9uZW50UmVmPy5kZXN0cm95KCk7XG4gICAgICAgICAgICBjb21wb25lbnRSb290Tm9kZS5yZW1vdmUoKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHBsYW50Q29tcG9uZW50UmVmO1xuICAgIH1cblxuICAgIC8qKiBHZXRzIHRoZSByb290IEhUTUxFbGVtZW50IGZvciBhbiBpbnN0YW50aWF0ZWQgY29tcG9uZW50LiAqL1xuICAgIHByaXZhdGUgZ2V0Q29tcG9uZW50Um9vdE5vZGUoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgcmV0dXJuIChjb21wb25lbnRSZWYuaG9zdFZpZXcgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pLnJvb3ROb2Rlc1swXSBhcyBIVE1MRWxlbWVudDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlZ2lzdGVyQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnRPckNvbXBvbmVudHM6IFBsYW5ldENvbXBvbmVudCB8IFBsYW5ldENvbXBvbmVudFtdKSB7XG4gICAgICAgIGNvbnN0IGFwcCA9IHRoaXMubmdNb2R1bGVSZWYuaW5zdGFuY2UuYXBwTmFtZTtcbiAgICAgICAgbGV0IGFwcFJlZiQ6IE9ic2VydmFibGU8TmdQbGFuZXRBcHBsaWNhdGlvblJlZiB8IFBsYW5ldFBvcnRhbEFwcGxpY2F0aW9uPjtcblxuICAgICAgICBpZiAoYXBwKSB7XG4gICAgICAgICAgICBhcHBSZWYkID0gdGhpcy5nZXRQbGFudEFwcFJlZihhcHApIGFzIE9ic2VydmFibGU8TmdQbGFuZXRBcHBsaWNhdGlvblJlZj47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcHBSZWYkID0gb2YoZ2xvYmFsUGxhbmV0LnBvcnRhbEFwcGxpY2F0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcFJlZiQuc3Vic2NyaWJlKGFwcFJlZiA9PiB7XG4gICAgICAgICAgICBhcHBSZWYucmVnaXN0ZXJDb21wb25lbnRGYWN0b3J5KChjb21wb25lbnROYW1lOiBzdHJpbmcsIGNvbmZpZzogUGxhbnRDb21wb25lbnRDb25maWc8YW55PikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBjb2VyY2VBcnJheShjb21wb25lbnRPckNvbXBvbmVudHMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBsYW5ldENvbXBvbmVudCA9IGNvbXBvbmVudHMuZmluZChpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzQ29tcG9uZW50VHlwZShpdGVtKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyByZWZsZWN0Q29tcG9uZW50VHlwZShpdGVtKS5zZWxlY3Rvci5pbmNsdWRlcyhjb21wb25lbnROYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBpdGVtLm5hbWUgPT09IGNvbXBvbmVudE5hbWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHBsYW5ldENvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9IHRoaXMuYXR0YWNoQ29tcG9uZW50PGFueT4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNDb21wb25lbnRUeXBlKHBsYW5ldENvbXBvbmVudCkgPyBwbGFuZXRDb21wb25lbnQgOiBwbGFuZXRDb21wb25lbnQuY29tcG9uZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcFJlZiBpbnN0YW5jZW9mIE5nUGxhbmV0QXBwbGljYXRpb25SZWYgPyBhcHBSZWYuYXBwTW9kdWxlUmVmLmluamVjdG9yIDogdGhpcy5uZ01vZHVsZVJlZi5pbmplY3RvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50UmVmO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihgdW5yZWdpc3RlcmVkIGNvbXBvbmVudCAke2NvbXBvbmVudE5hbWV9IGluIGFwcCAke2FwcH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXIoY29tcG9uZW50czogUGxhbmV0Q29tcG9uZW50IHwgUGxhbmV0Q29tcG9uZW50W10sIGltbWVkaWF0ZT86IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKGltbWVkaWF0ZSkge1xuICAgICAgICAgICAgdGhpcy5yZWdpc3RlckNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbG9hZDxUQ29tcCA9IHVua25vd24sIFREYXRhID0gdW5rbm93bj4oXG4gICAgICAgIGFwcDogc3RyaW5nLFxuICAgICAgICBjb21wb25lbnROYW1lOiBzdHJpbmcsXG4gICAgICAgIGNvbmZpZzogUGxhbnRDb21wb25lbnRDb25maWc8VERhdGE+XG4gICAgKTogT2JzZXJ2YWJsZTxQbGFuZXRDb21wb25lbnRSZWY8VENvbXA+PiB7XG4gICAgICAgIGxldCBhcHBSZWYkOiBPYnNlcnZhYmxlPE5nUGxhbmV0QXBwbGljYXRpb25SZWYgfCBQbGFuZXRQb3J0YWxBcHBsaWNhdGlvbj47XG4gICAgICAgIGlmIChhcHAgPT09IGdsb2JhbFBsYW5ldC5wb3J0YWxBcHBsaWNhdGlvbi5uYW1lKSB7XG4gICAgICAgICAgICBhcHBSZWYkID0gb2YoZ2xvYmFsUGxhbmV0LnBvcnRhbEFwcGxpY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFwcFJlZiQgPSB0aGlzLmdldFBsYW50QXBwUmVmKGFwcCkucGlwZShcbiAgICAgICAgICAgICAgICBkZWxheVdoZW4oKGFwcFJlZjogTmdQbGFuZXRBcHBsaWNhdGlvblJlZikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXBwUmVmLmdldENvbXBvbmVudEZhY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9mKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJlY2F1c2UgcmVnaXN0ZXIgdXNlICdzZXRUaW1lb3V0JyxzbyB0aW1lciAyMFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRpbWVyKDIwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGFwcFJlZiQucGlwZShcbiAgICAgICAgICAgIG1hcChhcHBSZWYgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSBhcHBSZWYuZ2V0Q29tcG9uZW50RmFjdG9yeSgpO1xuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2plY3RhYmxlRW1iZWRkZWRWaWV3UmVmczogRW1iZWRkZWRWaWV3UmVmPGFueT5bXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0YWJsZU5vZGVzOiBOb2RlW11bXSA9IChjb25maWcucHJvamVjdGFibGVOb2RlcyB8fCBbXSkubWFwKG5vZGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBUZW1wbGF0ZVJlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZpZXdSZWYgPSBub2RlLmNyZWF0ZUVtYmVkZGVkVmlldyh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdGFibGVFbWJlZGRlZFZpZXdSZWZzLnB1c2godmlld1JlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBsaWNhdGlvblJlZi5hdHRhY2hWaWV3KHZpZXdSZWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2aWV3UmVmLnJvb3ROb2RlcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wUmVmID0gY29tcG9uZW50RmFjdG9yeTxURGF0YSwgVENvbXA+KGNvbXBvbmVudE5hbWUsIHsgLi4uY29uZmlnLCBwcm9qZWN0YWJsZU5vZGVzOiBwcm9qZWN0YWJsZU5vZGVzIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NlID0gY29tcFJlZi5kaXNwb3NlLmJpbmQoY29tcFJlZik7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBSZWYuZGlzcG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RhYmxlRW1iZWRkZWRWaWV3UmVmcy5mb3JFYWNoKHZpZXdSZWYgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbGljYXRpb25SZWYuZGV0YWNoVmlldyh2aWV3UmVmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3UmVmLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcFJlZjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7YXBwfSdzIGNvbXBvbmVudCgke2NvbXBvbmVudE5hbWV9KSBpcyBub3QgcmVnaXN0ZXJlZGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc2hhcmVSZXBsYXkoKVxuICAgICAgICApO1xuICAgICAgICByZXN1bHQuc3Vic2NyaWJlKCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuIl19