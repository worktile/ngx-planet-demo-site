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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetComponentOutlet, deps: [{ token: i0.ElementRef }, { token: i1.PlanetComponentLoader }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "17.2.3", type: PlanetComponentOutlet, isStandalone: true, selector: "[planetComponentOutlet]", inputs: { planetComponentOutlet: "planetComponentOutlet", planetComponentOutletApp: "planetComponentOutletApp", planetComponentOutletInitialState: "planetComponentOutletInitialState" }, outputs: { planetComponentLoaded: "planetComponentLoaded" }, usesOnChanges: true, ngImport: i0 }); }
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
            }], planetComponentOutletInitialState: [{
                type: Input
            }], planetComponentLoaded: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbmV0LWNvbXBvbmVudC1vdXRsZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGFuZXQvc3JjL2NvbXBvbmVudC9wbGFuZXQtY29tcG9uZW50LW91dGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0gsU0FBUyxFQUtULEtBQUssRUFFTCxVQUFVLEVBQ1YsTUFBTSxFQUNOLE1BQU0sRUFDTixZQUFZLEVBQ2YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMvQixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDM0MsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7OztBQU9sRSxrRUFBa0U7QUFDbEUsTUFBTSxPQUFPLHFCQUFxQjtJQWE5QixZQUNZLFVBQXNCLEVBQ3RCLHFCQUE0QyxFQUM1QyxNQUFjO1FBRmQsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUN0QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1FBQzVDLFdBQU0sR0FBTixNQUFNLENBQVE7UUFUaEIsMEJBQXFCLEdBQUcsSUFBSSxZQUFZLEVBQXNCLENBQUM7UUFJakUsZUFBVSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7SUFNdEMsQ0FBQztJQUVKLFdBQVcsQ0FBQyxPQUFzQjtRQUM5QixJQUFJLElBQUksQ0FBQyxxQkFBcUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUM7WUFDbEYsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3pCLENBQUM7SUFDTCxDQUFDO0lBRUQsZUFBZTtRQUNYLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBRUQsYUFBYTtRQUNULElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLElBQUksSUFBSSxDQUFDLHFCQUFxQixJQUFJLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQzlELElBQUksQ0FBQyxxQkFBcUI7aUJBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixFQUFFO2dCQUM3RCxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhO2dCQUN4QyxZQUFZLEVBQUUsSUFBSSxDQUFDLGlDQUFpQzthQUN2RCxDQUFDO2lCQUNELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNoQyxTQUFTLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7b0JBQ2pCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO3dCQUN4QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDdkQsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUM7SUFDTCxDQUFDO0lBRUQsV0FBVztRQUNQLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELEtBQUs7UUFDRCxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDM0IsQ0FBQzs4R0F6RFEscUJBQXFCO2tHQUFyQixxQkFBcUI7OzJGQUFyQixxQkFBcUI7a0JBTGpDLFNBQVM7bUJBQUM7b0JBQ1AsUUFBUSxFQUFFLHlCQUF5QjtvQkFDbkMsVUFBVSxFQUFFLElBQUk7aUJBQ25CO3dJQUdZLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFFRyx3QkFBd0I7c0JBQWhDLEtBQUs7Z0JBRUcsaUNBQWlDO3NCQUF6QyxLQUFLO2dCQUVJLHFCQUFxQjtzQkFBOUIsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgRGlyZWN0aXZlLFxuICAgIFZpZXdDb250YWluZXJSZWYsXG4gICAgT25EZXN0cm95LFxuICAgIE9uQ2hhbmdlcyxcbiAgICBTaW1wbGVDaGFuZ2VzLFxuICAgIElucHV0LFxuICAgIEFmdGVyVmlld0luaXQsXG4gICAgRWxlbWVudFJlZixcbiAgICBOZ1pvbmUsXG4gICAgT3V0cHV0LFxuICAgIEV2ZW50RW1pdHRlclxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IHRha2VVbnRpbCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IFBsYW5ldENvbXBvbmVudExvYWRlciB9IGZyb20gJy4vcGxhbmV0LWNvbXBvbmVudC1sb2FkZXInO1xuaW1wb3J0IHsgUGxhbmV0Q29tcG9uZW50UmVmIH0gZnJvbSAnLi9wbGFuZXQtY29tcG9uZW50LXJlZic7XG5cbkBEaXJlY3RpdmUoe1xuICAgIHNlbGVjdG9yOiAnW3BsYW5ldENvbXBvbmVudE91dGxldF0nLFxuICAgIHN0YW5kYWxvbmU6IHRydWVcbn0pXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQGFuZ3VsYXItZXNsaW50L2RpcmVjdGl2ZS1jbGFzcy1zdWZmaXhcbmV4cG9ydCBjbGFzcyBQbGFuZXRDb21wb25lbnRPdXRsZXQgaW1wbGVtZW50cyBPbkNoYW5nZXMsIE9uRGVzdHJveSwgQWZ0ZXJWaWV3SW5pdCB7XG4gICAgQElucHV0KCkgcGxhbmV0Q29tcG9uZW50T3V0bGV0OiBzdHJpbmc7XG5cbiAgICBASW5wdXQoKSBwbGFuZXRDb21wb25lbnRPdXRsZXRBcHA6IHN0cmluZztcblxuICAgIEBJbnB1dCgpIHBsYW5ldENvbXBvbmVudE91dGxldEluaXRpYWxTdGF0ZTogYW55O1xuXG4gICAgQE91dHB1dCgpIHBsYW5ldENvbXBvbmVudExvYWRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8UGxhbmV0Q29tcG9uZW50UmVmPigpO1xuXG4gICAgcHJpdmF0ZSBjb21wb25lbnRSZWY6IFBsYW5ldENvbXBvbmVudFJlZjtcblxuICAgIHByaXZhdGUgZGVzdHJveWVkJCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgICAgICBwcml2YXRlIHBsYW5ldENvbXBvbmVudExvYWRlcjogUGxhbmV0Q29tcG9uZW50TG9hZGVyLFxuICAgICAgICBwcml2YXRlIG5nWm9uZTogTmdab25lXG4gICAgKSB7fVxuXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgICAgICBpZiAodGhpcy5wbGFuZXRDb21wb25lbnRPdXRsZXQgJiYgIWNoYW5nZXNbJ3BsYW5ldENvbXBvbmVudE91dGxldCddLmlzRmlyc3RDaGFuZ2UoKSkge1xuICAgICAgICAgICAgdGhpcy5sb2FkQ29tcG9uZW50KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMubG9hZENvbXBvbmVudCgpO1xuICAgIH1cblxuICAgIGxvYWRDb21wb25lbnQoKSB7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgaWYgKHRoaXMucGxhbmV0Q29tcG9uZW50T3V0bGV0ICYmIHRoaXMucGxhbmV0Q29tcG9uZW50T3V0bGV0QXBwKSB7XG4gICAgICAgICAgICB0aGlzLnBsYW5ldENvbXBvbmVudExvYWRlclxuICAgICAgICAgICAgICAgIC5sb2FkKHRoaXMucGxhbmV0Q29tcG9uZW50T3V0bGV0QXBwLCB0aGlzLnBsYW5ldENvbXBvbmVudE91dGxldCwge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBpbml0aWFsU3RhdGU6IHRoaXMucGxhbmV0Q29tcG9uZW50T3V0bGV0SW5pdGlhbFN0YXRlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95ZWQkKSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGNvbXBvbmVudFJlZiA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50UmVmID0gY29tcG9uZW50UmVmO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGFuZXRDb21wb25lbnRMb2FkZWQuZW1pdCh0aGlzLmNvbXBvbmVudFJlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLmRlc3Ryb3llZCQuY29tcGxldGUoKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRSZWY/LmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5kZXN0cm95ZWQkLm5leHQoKTtcbiAgICB9XG59XG4iXX0=