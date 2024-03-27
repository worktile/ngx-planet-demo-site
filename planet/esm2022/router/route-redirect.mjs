import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as i0 from "@angular/core";
class RouteRedirect {
    constructor(redirectTo) {
        this.activatedRoute = inject(ActivatedRoute);
        this.router = inject(Router);
        const finalRedirectTo = redirectTo || this.activatedRoute.snapshot.data['redirectTo'];
        if (finalRedirectTo) {
            const activatedRouteUrl = this.activatedRoute.pathFromRoot
                .filter(route => {
                return route.snapshot.url?.length > 0;
            })
                .map(route => {
                return route.snapshot.url.join('/');
            })
                .join('/');
            if (this.router.isActive(activatedRouteUrl, {
                matrixParams: 'exact',
                paths: 'exact',
                queryParams: 'exact',
                fragment: 'exact'
            })) {
                this.router.navigate([`${finalRedirectTo}`], 
                // By replacing the current URL in the history, we keep the Browser's Back
                // Button behavior in tact. This will allow the user to easily navigate back
                // to the previous URL without getting caught in a redirect.
                {
                    replaceUrl: true,
                    relativeTo: this.activatedRoute
                });
            }
        }
    }
}
export function routeRedirect(redirectTo) {
    return new RouteRedirect(redirectTo);
}
export class RedirectToRouteComponent {
    constructor() {
        this.routeRedirect = routeRedirect();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: RedirectToRouteComponent, deps: [], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.2.3", type: RedirectToRouteComponent, isStandalone: true, selector: "planet-redirect-to-route", ngImport: i0, template: '', isInline: true }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: RedirectToRouteComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'planet-redirect-to-route',
                    template: '',
                    standalone: true
                }]
        }] });
export function redirectToRoute(redirectTo) {
    return {
        path: '',
        component: RedirectToRouteComponent,
        data: {
            redirectTo: redirectTo
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUtcmVkaXJlY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGFuZXQvc3JjL3JvdXRlci9yb3V0ZS1yZWRpcmVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNsRCxPQUFPLEVBQUUsY0FBYyxFQUFTLE1BQU0sRUFBVyxNQUFNLGlCQUFpQixDQUFDOztBQUV6RSxNQUFNLGFBQWE7SUFJZixZQUFZLFVBQWtCO1FBSDlCLG1CQUFjLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3hDLFdBQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFHcEIsTUFBTSxlQUFlLEdBQUcsVUFBVSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN0RixJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ2xCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZO2lCQUNyRCxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ1osT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLENBQUMsQ0FBQztpQkFDRCxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ1QsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDO2lCQUNELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNmLElBQ0ksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ3BDLFlBQVksRUFBRSxPQUFPO2dCQUNyQixLQUFLLEVBQUUsT0FBTztnQkFDZCxXQUFXLEVBQUUsT0FBTztnQkFDcEIsUUFBUSxFQUFFLE9BQU87YUFDcEIsQ0FBQyxFQUNKLENBQUM7Z0JBQ0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQ2hCLENBQUMsR0FBRyxlQUFlLEVBQUUsQ0FBQztnQkFDdEIsMEVBQTBFO2dCQUMxRSw0RUFBNEU7Z0JBQzVFLDREQUE0RDtnQkFDNUQ7b0JBQ0ksVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFVBQVUsRUFBRSxJQUFJLENBQUMsY0FBYztpQkFDbEMsQ0FDSixDQUFDO1lBQ04sQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFFRCxNQUFNLFVBQVUsYUFBYSxDQUFDLFVBQW1CO0lBQzdDLE9BQU8sSUFBSSxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDekMsQ0FBQztBQU9ELE1BQU0sT0FBTyx3QkFBd0I7SUFMckM7UUFNSSxrQkFBYSxHQUFHLGFBQWEsRUFBRSxDQUFDO0tBQ25DOzhHQUZZLHdCQUF3QjtrR0FBeEIsd0JBQXdCLG9GQUh2QixFQUFFOzsyRkFHSCx3QkFBd0I7a0JBTHBDLFNBQVM7bUJBQUM7b0JBQ1AsUUFBUSxFQUFFLDBCQUEwQjtvQkFDcEMsUUFBUSxFQUFFLEVBQUU7b0JBQ1osVUFBVSxFQUFFLElBQUk7aUJBQ25COztBQUtELE1BQU0sVUFBVSxlQUFlLENBQUMsVUFBa0I7SUFDOUMsT0FBTztRQUNILElBQUksRUFBRSxFQUFFO1FBQ1IsU0FBUyxFQUFFLHdCQUF3QjtRQUNuQyxJQUFJLEVBQUU7WUFDRixVQUFVLEVBQUUsVUFBVTtTQUN6QjtLQUNKLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBpbmplY3QgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEFjdGl2YXRlZFJvdXRlLCBSb3V0ZSwgUm91dGVyLCBVcmxUcmVlIH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcblxuY2xhc3MgUm91dGVSZWRpcmVjdCB7XG4gICAgYWN0aXZhdGVkUm91dGUgPSBpbmplY3QoQWN0aXZhdGVkUm91dGUpO1xuICAgIHJvdXRlciA9IGluamVjdChSb3V0ZXIpO1xuXG4gICAgY29uc3RydWN0b3IocmVkaXJlY3RUbzogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGZpbmFsUmVkaXJlY3RUbyA9IHJlZGlyZWN0VG8gfHwgdGhpcy5hY3RpdmF0ZWRSb3V0ZS5zbmFwc2hvdC5kYXRhWydyZWRpcmVjdFRvJ107XG4gICAgICAgIGlmIChmaW5hbFJlZGlyZWN0VG8pIHtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2YXRlZFJvdXRlVXJsID0gdGhpcy5hY3RpdmF0ZWRSb3V0ZS5wYXRoRnJvbVJvb3RcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHJvdXRlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvdXRlLnNuYXBzaG90LnVybD8ubGVuZ3RoID4gMDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5tYXAocm91dGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm91dGUuc25hcHNob3QudXJsLmpvaW4oJy8nKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5qb2luKCcvJyk7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgdGhpcy5yb3V0ZXIuaXNBY3RpdmUoYWN0aXZhdGVkUm91dGVVcmwsIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0cml4UGFyYW1zOiAnZXhhY3QnLFxuICAgICAgICAgICAgICAgICAgICBwYXRoczogJ2V4YWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlQYXJhbXM6ICdleGFjdCcsXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50OiAnZXhhY3QnXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMucm91dGVyLm5hdmlnYXRlKFxuICAgICAgICAgICAgICAgICAgICBbYCR7ZmluYWxSZWRpcmVjdFRvfWBdLFxuICAgICAgICAgICAgICAgICAgICAvLyBCeSByZXBsYWNpbmcgdGhlIGN1cnJlbnQgVVJMIGluIHRoZSBoaXN0b3J5LCB3ZSBrZWVwIHRoZSBCcm93c2VyJ3MgQmFja1xuICAgICAgICAgICAgICAgICAgICAvLyBCdXR0b24gYmVoYXZpb3IgaW4gdGFjdC4gVGhpcyB3aWxsIGFsbG93IHRoZSB1c2VyIHRvIGVhc2lseSBuYXZpZ2F0ZSBiYWNrXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIHRoZSBwcmV2aW91cyBVUkwgd2l0aG91dCBnZXR0aW5nIGNhdWdodCBpbiBhIHJlZGlyZWN0LlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXBsYWNlVXJsOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmVUbzogdGhpcy5hY3RpdmF0ZWRSb3V0ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJvdXRlUmVkaXJlY3QocmVkaXJlY3RUbz86IHN0cmluZykge1xuICAgIHJldHVybiBuZXcgUm91dGVSZWRpcmVjdChyZWRpcmVjdFRvKTtcbn1cblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICdwbGFuZXQtcmVkaXJlY3QtdG8tcm91dGUnLFxuICAgIHRlbXBsYXRlOiAnJyxcbiAgICBzdGFuZGFsb25lOiB0cnVlXG59KVxuZXhwb3J0IGNsYXNzIFJlZGlyZWN0VG9Sb3V0ZUNvbXBvbmVudCB7XG4gICAgcm91dGVSZWRpcmVjdCA9IHJvdXRlUmVkaXJlY3QoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZGlyZWN0VG9Sb3V0ZShyZWRpcmVjdFRvOiBzdHJpbmcpOiBSb3V0ZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGF0aDogJycsXG4gICAgICAgIGNvbXBvbmVudDogUmVkaXJlY3RUb1JvdXRlQ29tcG9uZW50LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWRpcmVjdFRvOiByZWRpcmVjdFRvXG4gICAgICAgIH1cbiAgICB9O1xufVxuIl19