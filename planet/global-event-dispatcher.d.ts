import { Observable } from 'rxjs';
import { NgZone } from '@angular/core';
import * as i0 from "@angular/core";
export interface GlobalDispatcherEvent {
    name: string;
    payload: any;
}
export declare class GlobalEventDispatcher {
    private ngZone;
    private subject$;
    private hasAddGlobalEventListener;
    private subscriptionCount;
    private globalEventListener;
    private addGlobalEventListener;
    private removeGlobalEventListener;
    constructor(ngZone: NgZone);
    dispatch<TPayload>(name: string, payload?: TPayload): void;
    register<T>(eventName: string): Observable<T>;
    getSubscriptionCount(): number;
    static ɵfac: i0.ɵɵFactoryDeclaration<GlobalEventDispatcher, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<GlobalEventDispatcher>;
}
//# sourceMappingURL=global-event-dispatcher.d.ts.map