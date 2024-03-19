import { OnDestroy, OnChanges, SimpleChanges, AfterViewInit, ElementRef, NgZone, EventEmitter } from '@angular/core';
import { PlanetComponentLoader } from './planet-component-loader';
import { PlanetComponentRef } from './planet-component-ref';
import * as i0 from "@angular/core";
export declare class PlanetComponentOutlet implements OnChanges, OnDestroy, AfterViewInit {
    private elementRef;
    private planetComponentLoader;
    private ngZone;
    planetComponentOutlet: string;
    planetComponentOutletApp: string;
    planetComponentOutletInitialState: any;
    planetComponentLoaded: EventEmitter<PlanetComponentRef<any>>;
    private componentRef;
    private destroyed$;
    constructor(elementRef: ElementRef, planetComponentLoader: PlanetComponentLoader, ngZone: NgZone);
    ngOnChanges(changes: SimpleChanges): void;
    ngAfterViewInit(): void;
    loadComponent(): void;
    ngOnDestroy(): void;
    clear(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PlanetComponentOutlet, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<PlanetComponentOutlet, "[planetComponentOutlet]", never, { "planetComponentOutlet": { "alias": "planetComponentOutlet"; "required": false; }; "planetComponentOutletApp": { "alias": "planetComponentOutletApp"; "required": false; }; "planetComponentOutletInitialState": { "alias": "planetComponentOutletInitialState"; "required": false; }; }, { "planetComponentLoaded": "planetComponentLoaded"; }, never, never, true, never>;
}
//# sourceMappingURL=planet-component-outlet.d.ts.map