import { Directive, Input, ElementRef, NgZone, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlanetComponentLoader } from './planet-component-loader';
import * as i0 from "@angular/core";
import * as i1 from "./planet-component-loader";
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class PlanetComponentOutlet {
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
                initialState: this.planetComponentOutletInitialState,
                projectableNodes: this.planetComponentOutletProjectableNodes
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetComponentOutlet, deps: [{ token: i0.ElementRef }, { token: i1.PlanetComponentLoader }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.2.3", type: PlanetComponentOutlet, isStandalone: true, selector: "[planetComponentOutlet]", inputs: { planetComponentOutlet: "planetComponentOutlet", planetComponentOutletApp: "planetComponentOutletApp", planetComponentOutletProjectableNodes: "planetComponentOutletProjectableNodes", planetComponentOutletInitialState: "planetComponentOutletInitialState" }, outputs: { planetComponentLoaded: "planetComponentLoaded" }, usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetComponentOutlet, decorators: [{
            type: Directive,
            args: [{
                    selector: '[planetComponentOutlet]',
                    standalone: true
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i1.PlanetComponentLoader }, { type: i0.NgZone }], propDecorators: { planetComponentOutlet: [{
                type: Input
            }], planetComponentOutletApp: [{
                type: Input
            }], planetComponentOutletProjectableNodes: [{
                type: Input
            }], planetComponentOutletInitialState: [{
                type: Input
            }], planetComponentLoaded: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbmV0LWNvbXBvbmVudC1vdXRsZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGFuZXQvc3JjL2NvbXBvbmVudC9wbGFuZXQtY29tcG9uZW50LW91dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0gsU0FBUyxFQUtULEtBQUssRUFFTCxVQUFVLEVBQ1YsTUFBTSxFQUNOLE1BQU0sRUFDTixZQUFZLEVBQ2YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMvQixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDM0MsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7OztBQVFsRSxrRUFBa0U7QUFDbEUsTUFBTSxPQUFPLHFCQUFxQjtJQWU5QixZQUNZLFVBQXNCLEVBQ3RCLHFCQUE0QyxFQUM1QyxNQUFjO1FBRmQsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUN0QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1FBQzVDLFdBQU0sR0FBTixNQUFNLENBQVE7UUFUaEIsMEJBQXFCLEdBQUcsSUFBSSxZQUFZLEVBQXNCLENBQUM7UUFJakUsZUFBVSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7SUFNdEMsQ0FBQztJQUVKLFdBQVcsQ0FBQyxPQUFzQjtRQUM5QixJQUFJLElBQUksQ0FBQyxxQkFBcUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUM7WUFDbEYsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3pCLENBQUM7SUFDTCxDQUFDO0lBRUQsZUFBZTtRQUNYLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBRUQsYUFBYTtRQUNULElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLElBQUksSUFBSSxDQUFDLHFCQUFxQixJQUFJLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQzlELElBQUksQ0FBQyxxQkFBcUI7aUJBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixFQUFFO2dCQUM3RCxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhO2dCQUN4QyxZQUFZLEVBQUUsSUFBSSxDQUFDLGlDQUFpQztnQkFDcEQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLHFDQUFxQzthQUMvRCxDQUFDO2lCQUNELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNoQyxTQUFTLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7b0JBQ2pCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO3dCQUN4QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDdkQsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7SUFDTCxDQUFDO0lBRUQsV0FBVztRQUNQLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELEtBQUs7UUFDRCxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDM0IsQ0FBQzs4R0E1RFEscUJBQXFCO2tHQUFyQixxQkFBcUI7OzJGQUFyQixxQkFBcUI7a0JBTGpDLFNBQVM7bUJBQUM7b0JBQ1AsUUFBUSxFQUFFLHlCQUF5QjtvQkFDbkMsVUFBVSxFQUFFLElBQUk7aUJBQ25CO3dJQUdZLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFFRyx3QkFBd0I7c0JBQWhDLEtBQUs7Z0JBRUcscUNBQXFDO3NCQUE3QyxLQUFLO2dCQUVHLGlDQUFpQztzQkFBekMsS0FBSztnQkFFSSxxQkFBcUI7c0JBQTlCLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIERpcmVjdGl2ZSxcbiAgICBWaWV3Q29udGFpbmVyUmVmLFxuICAgIE9uRGVzdHJveSxcbiAgICBPbkNoYW5nZXMsXG4gICAgU2ltcGxlQ2hhbmdlcyxcbiAgICBJbnB1dCxcbiAgICBBZnRlclZpZXdJbml0LFxuICAgIEVsZW1lbnRSZWYsXG4gICAgTmdab25lLFxuICAgIE91dHB1dCxcbiAgICBFdmVudEVtaXR0ZXJcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyB0YWtlVW50aWwgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBQbGFuZXRDb21wb25lbnRMb2FkZXIgfSBmcm9tICcuL3BsYW5ldC1jb21wb25lbnQtbG9hZGVyJztcbmltcG9ydCB7IFBsYW5ldENvbXBvbmVudFJlZiB9IGZyb20gJy4vcGxhbmV0LWNvbXBvbmVudC10eXBlcyc7XG5pbXBvcnQgeyBQbGFudENvbXBvbmVudFByb2plY3RhYmxlTm9kZSB9IGZyb20gJy4vcGxhbnQtY29tcG9uZW50LmNvbmZpZyc7XG5cbkBEaXJlY3RpdmUoe1xuICAgIHNlbGVjdG9yOiAnW3BsYW5ldENvbXBvbmVudE91dGxldF0nLFxuICAgIHN0YW5kYWxvbmU6IHRydWVcbn0pXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQGFuZ3VsYXItZXNsaW50L2RpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcbmV4cG9ydCBjbGFzcyBQbGFuZXRDb21wb25lbnRPdXRsZXQgaW1wbGVtZW50cyBPbkNoYW5nZXMsIE9uRGVzdHJveSwgQWZ0ZXJWaWV3SW5pdCB7XG4gICAgQElucHV0KCkgcGxhbmV0Q29tcG9uZW50T3V0bGV0OiBzdHJpbmc7XG5cbiAgICBASW5wdXQoKSBwbGFuZXRDb21wb25lbnRPdXRsZXRBcHA6IHN0cmluZztcblxuICAgIEBJbnB1dCgpIHBsYW5ldENvbXBvbmVudE91dGxldFByb2plY3RhYmxlTm9kZXM6IFBsYW50Q29tcG9uZW50UHJvamVjdGFibGVOb2RlW107XG5cbiAgICBASW5wdXQoKSBwbGFuZXRDb21wb25lbnRPdXRsZXRJbml0aWFsU3RhdGU6IGFueTtcblxuICAgIEBPdXRwdXQoKSBwbGFuZXRDb21wb25lbnRMb2FkZWQgPSBuZXcgRXZlbnRFbWl0dGVyPFBsYW5ldENvbXBvbmVudFJlZj4oKTtcblxuICAgIHByaXZhdGUgY29tcG9uZW50UmVmOiBQbGFuZXRDb21wb25lbnRSZWY7XG5cbiAgICBwcml2YXRlIGRlc3Ryb3llZCQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICAgICAgcHJpdmF0ZSBwbGFuZXRDb21wb25lbnRMb2FkZXI6IFBsYW5ldENvbXBvbmVudExvYWRlcixcbiAgICAgICAgcHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZVxuICAgICkge31cblxuICAgIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICAgICAgaWYgKHRoaXMucGxhbmV0Q29tcG9uZW50T3V0bGV0ICYmICFjaGFuZ2VzWydwbGFuZXRDb21wb25lbnRPdXRsZXQnXS5pc0ZpcnN0Q2hhbmdlKCkpIHtcbiAgICAgICAgICAgIHRoaXMubG9hZENvbXBvbmVudCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxvYWRDb21wb25lbnQoKTtcbiAgICB9XG5cbiAgICBsb2FkQ29tcG9uZW50KCkge1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIGlmICh0aGlzLnBsYW5ldENvbXBvbmVudE91dGxldCAmJiB0aGlzLnBsYW5ldENvbXBvbmVudE91dGxldEFwcCkge1xuICAgICAgICAgICAgdGhpcy5wbGFuZXRDb21wb25lbnRMb2FkZXJcbiAgICAgICAgICAgICAgICAubG9hZCh0aGlzLnBsYW5ldENvbXBvbmVudE91dGxldEFwcCwgdGhpcy5wbGFuZXRDb21wb25lbnRPdXRsZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbFN0YXRlOiB0aGlzLnBsYW5ldENvbXBvbmVudE91dGxldEluaXRpYWxTdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvamVjdGFibGVOb2RlczogdGhpcy5wbGFuZXRDb21wb25lbnRPdXRsZXRQcm9qZWN0YWJsZU5vZGVzXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQkKSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGNvbXBvbmVudFJlZiA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVmID0gY29tcG9uZW50UmVmO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGFuZXRDb21wb25lbnRMb2FkZWQuZW1pdCh0aGlzLmNvbXBvbmVudFJlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLmRlc3Ryb3llZCQuY29tcGxldGUoKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRSZWY/LmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5kZXN0cm95ZWQkLm5leHQoKTtcbiAgICB9XG59XG4iXX0=