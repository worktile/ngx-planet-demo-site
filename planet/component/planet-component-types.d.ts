import { ComponentRef } from '@angular/core';
import { PlantComponentConfig } from './plant-component.config';
export declare class PlanetComponentRef<TComp = any> {
    wrapperElement: HTMLElement;
    hostElement: HTMLElement;
    componentInstance: TComp;
    componentRef: ComponentRef<TComp>;
    dispose: () => void;
}
export type PlantComponentFactory = <TData, TComp>(componentName: string, config: PlantComponentConfig<TData>) => PlanetComponentRef<TComp>;
//# sourceMappingURL=planet-component-types.d.ts.map