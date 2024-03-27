export declare function hasOwnProp(obj: any, key: PropertyKey): boolean;
export declare function isValueDescriptor(desc?: PropertyDescriptor): boolean;
export declare function isAccessorDescriptor(desc?: PropertyDescriptor): boolean;
export declare function isNonWriteableValue(desc?: PropertyDescriptor): boolean;
export declare function isInvalidSetAccessor(desc?: PropertyDescriptor): boolean;
export declare function isInvalidGetAccessor(desc?: PropertyDescriptor): boolean;
export declare function bind(fn: any, context: any): {
    (): any;
    $native: any;
    prototype: any;
};
export declare function createFakeObject(target: Record<PropertyKey, any>, writableKeys?: PropertyKey[]): any;
//# sourceMappingURL=common.d.ts.map