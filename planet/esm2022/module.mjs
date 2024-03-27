import { NgModule } from '@angular/core';
import { PLANET_APPLICATIONS } from './planet.class';
import { HttpClientModule } from '@angular/common/http';
import { EmptyComponent } from './empty/empty.component';
import { PlanetComponentOutlet } from './component/planet-component-outlet';
import { RedirectToRouteComponent } from './router/route-redirect';
import * as i0 from "@angular/core";
export class NgxPlanetModule {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vcGFja2FnZXMvcGxhbmV0L3NyYy9tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBdUIsTUFBTSxlQUFlLENBQUM7QUFDOUQsT0FBTyxFQUFxQixtQkFBbUIsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3hFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3hELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxxQ0FBcUMsQ0FBQztBQUM1RSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQzs7QUFRbkUsTUFBTSxPQUFPLGVBQWU7SUFDeEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUF5QjtRQUNwQyxPQUFPO1lBQ0gsUUFBUSxFQUFFLGVBQWU7WUFDekIsU0FBUyxFQUFFO2dCQUNQO29CQUNJLE9BQU8sRUFBRSxtQkFBbUI7b0JBQzVCLFFBQVEsRUFBRSxJQUFJO2lCQUNqQjthQUNKO1NBQ0osQ0FBQztJQUNOLENBQUM7OEdBWFEsZUFBZTsrR0FBZixlQUFlLFlBSmQsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixhQUVqRixnQkFBZ0IsRUFBRSxjQUFjLEVBQUUscUJBQXFCOytHQUV4RCxlQUFlLFlBSmQsZ0JBQWdCLEVBRWhCLGdCQUFnQjs7MkZBRWpCLGVBQWU7a0JBTjNCLFFBQVE7bUJBQUM7b0JBQ04sWUFBWSxFQUFFLEVBQUU7b0JBQ2hCLE9BQU8sRUFBRSxDQUFDLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFLGNBQWMsRUFBRSx3QkFBd0IsQ0FBQztvQkFDNUYsU0FBUyxFQUFFLEVBQUU7b0JBQ2IsT0FBTyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLHFCQUFxQixDQUFDO2lCQUNyRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5nTW9kdWxlLCBNb2R1bGVXaXRoUHJvdmlkZXJzIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBQbGFuZXRBcHBsaWNhdGlvbiwgUExBTkVUX0FQUExJQ0FUSU9OUyB9IGZyb20gJy4vcGxhbmV0LmNsYXNzJztcbmltcG9ydCB7IEh0dHBDbGllbnRNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5pbXBvcnQgeyBFbXB0eUNvbXBvbmVudCB9IGZyb20gJy4vZW1wdHkvZW1wdHkuY29tcG9uZW50JztcbmltcG9ydCB7IFBsYW5ldENvbXBvbmVudE91dGxldCB9IGZyb20gJy4vY29tcG9uZW50L3BsYW5ldC1jb21wb25lbnQtb3V0bGV0JztcbmltcG9ydCB7IFJlZGlyZWN0VG9Sb3V0ZUNvbXBvbmVudCB9IGZyb20gJy4vcm91dGVyL3JvdXRlLXJlZGlyZWN0JztcblxuQE5nTW9kdWxlKHtcbiAgICBkZWNsYXJhdGlvbnM6IFtdLFxuICAgIGltcG9ydHM6IFtIdHRwQ2xpZW50TW9kdWxlLCBQbGFuZXRDb21wb25lbnRPdXRsZXQsIEVtcHR5Q29tcG9uZW50LCBSZWRpcmVjdFRvUm91dGVDb21wb25lbnRdLFxuICAgIHByb3ZpZGVyczogW10sXG4gICAgZXhwb3J0czogW0h0dHBDbGllbnRNb2R1bGUsIEVtcHR5Q29tcG9uZW50LCBQbGFuZXRDb21wb25lbnRPdXRsZXRdXG59KVxuZXhwb3J0IGNsYXNzIE5neFBsYW5ldE1vZHVsZSB7XG4gICAgc3RhdGljIGZvclJvb3QoYXBwczogUGxhbmV0QXBwbGljYXRpb25bXSk6IE1vZHVsZVdpdGhQcm92aWRlcnM8Tmd4UGxhbmV0TW9kdWxlPiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuZ01vZHVsZTogTmd4UGxhbmV0TW9kdWxlLFxuICAgICAgICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwcm92aWRlOiBQTEFORVRfQVBQTElDQVRJT05TLFxuICAgICAgICAgICAgICAgICAgICB1c2VWYWx1ZTogYXBwc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG59XG4iXX0=