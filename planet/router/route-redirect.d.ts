import { ActivatedRoute, Route, Router } from '@angular/router';
import * as i0 from "@angular/core";
declare class RouteRedirect {
    activatedRoute: ActivatedRoute;
    router: Router;
    constructor(redirectTo: string);
}
export declare function routeRedirect(redirectTo?: string): RouteRedirect;
export declare class RedirectToRouteComponent {
    routeRedirect: RouteRedirect;
    static ɵfac: i0.ɵɵFactoryDeclaration<RedirectToRouteComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<RedirectToRouteComponent, "planet-redirect-to-route", never, {}, {}, never, never, true, never>;
}
export declare function redirectToRoute(redirectTo: string): Route;
export {};
//# sourceMappingURL=route-redirect.d.ts.map