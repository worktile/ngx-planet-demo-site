import { ModuleWithProviders } from '@angular/core';
import { PlanetApplication } from './planet.class';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "./component/planet-component-outlet";
import * as i3 from "./empty/empty.component";
import * as i4 from "./router/route-redirect";
export declare class NgxPlanetModule {
    static forRoot(apps: PlanetApplication[]): ModuleWithProviders<NgxPlanetModule>;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgxPlanetModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<NgxPlanetModule, never, [typeof i1.HttpClientModule, typeof i2.PlanetComponentOutlet, typeof i3.EmptyComponent, typeof i4.RedirectToRouteComponent], [typeof i1.HttpClientModule, typeof i3.EmptyComponent, typeof i2.PlanetComponentOutlet]>;
    static ɵinj: i0.ɵɵInjectorDeclaration<NgxPlanetModule>;
}
//# sourceMappingURL=module.d.ts.map