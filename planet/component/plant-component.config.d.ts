import { TemplateRef, ElementRef } from '@angular/core';
export type PlantComponentProjectableNode = Node[] | TemplateRef<any>;
export declare class PlantComponentConfig<TData = any> {
    /** Load target container */
    container: HTMLElement | ElementRef<HTMLElement | any> | Comment;
    /**
     * Wrapper class of plant component
     * @deprecated please use hostClass
     */
    wrapperClass?: string;
    /**
     * Host class of plant component
     */
    hostClass?: string;
    /** Data being injected into the child component. */
    initialState?: TData | null;
    /**
     * Projectable nodes
     */
    projectableNodes?: PlantComponentProjectableNode[];
}
//# sourceMappingURL=plant-component.config.d.ts.map