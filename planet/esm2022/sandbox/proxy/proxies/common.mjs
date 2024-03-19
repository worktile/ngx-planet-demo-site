import { isObject } from '../../../helpers';
import { RAW_NODE } from '../../constants';
const rawHasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwnProp(obj, key) {
    return rawHasOwnProperty.call(obj, key);
}
export function isValueDescriptor(desc) {
    if (desc === undefined) {
        return false;
    }
    return 'value' in desc || 'writable' in desc;
}
export function isAccessorDescriptor(desc) {
    if (desc === undefined) {
        return false;
    }
    return 'get' in desc || 'set' in desc;
}
export function isNonWriteableValue(desc) {
    return desc && desc.configurable === false && 'value' in desc && desc.writable === false;
}
export function isInvalidSetAccessor(desc) {
    if (desc && desc.configurable === false && 'set' in desc && desc.set === undefined) {
        return true;
    }
    else {
        return false;
    }
}
export function isInvalidGetAccessor(desc) {
    if (desc && desc.configurable === false && 'get' in desc && desc.get === undefined) {
        return true;
    }
    else {
        return false;
    }
}
function transferParams(args) {
    args = Array.isArray(args) ? args : Array.from(args);
    return args.map(arg => {
        return arg[RAW_NODE] ? arg[RAW_NODE] : arg;
    });
}
const buildInProps = ['length', 'caller', 'callee', 'arguments', 'prototype', Symbol.hasInstance];
function transferProps(o, n) {
    for (const key of Reflect.ownKeys(o)) {
        if (buildInProps.includes(key)) {
            continue;
        }
        const desc = Object.getOwnPropertyDescriptor(n, key);
        if (desc && desc.writable) {
            n[key] = o[key];
        }
    }
}
export function bind(fn, context) {
    const fNOP = function () { };
    function bound() {
        const args = transferParams(arguments);
        if (this instanceof bound) {
            const obj = new fn(...args);
            Object.setPrototypeOf(obj, bound.prototype);
            return obj;
        }
        else {
            return fn.apply(context, args);
        }
    }
    bound.$native = fn;
    transferProps(fn, bound);
    if (fn.prototype) {
        fNOP.prototype = fn.prototype;
    }
    bound.prototype = new fNOP();
    if (Symbol.hasInstance) {
        Object.defineProperty(bound, Symbol.hasInstance, {
            configurable: true,
            value(instance) {
                const op = fn.prototype;
                return isObject(op) || typeof op === 'function' ? instance instanceof fn : false;
            }
        });
    }
    return bound;
}
export function createFakeObject(target, writableKeys) {
    const fakeObject = {};
    const propertyMap = {};
    const storageBox = Object.create(null);
    const propertyNames = Object.getOwnPropertyNames(target);
    const def = (p) => {
        const descriptor = Object.getOwnPropertyDescriptor(target, p);
        if (descriptor?.configurable) {
            const hasGetter = hasOwnProp(descriptor, 'get');
            const hasSetter = hasOwnProp(descriptor, 'set');
            const canWritable = writableKeys && writableKeys.length > 0 && writableKeys.includes(p);
            if (hasGetter) {
                descriptor.get = () => (hasOwnProp(storageBox, p) ? storageBox[p] : target[p]);
            }
            if (hasSetter) {
                descriptor.set = val => {
                    storageBox[p] = val;
                    return true;
                };
            }
            if (canWritable) {
                if (descriptor.writable === false) {
                    descriptor.writable = true;
                }
                else if (hasGetter) {
                    descriptor.set = val => {
                        storageBox[p] = val;
                        return true;
                    };
                }
            }
            Object.defineProperty(fakeObject, p, Object.freeze(descriptor));
        }
    };
    propertyNames.forEach(p => {
        propertyMap[p] = true;
        def(p);
    });
    // 再次循环是为了处理原型链中的属性
    for (const prop in target) {
        if (!propertyMap[prop]) {
            def(prop);
        }
    }
    return fakeObject;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcGxhbmV0L3NyYy9zYW5kYm94L3Byb3h5L3Byb3hpZXMvY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUM1QyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFM0MsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztBQUMxRCxNQUFNLFVBQVUsVUFBVSxDQUFDLEdBQVEsRUFBRSxHQUFnQjtJQUNqRCxPQUFPLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxJQUF5QjtJQUN2RCxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUNyQixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBQ0QsT0FBTyxPQUFPLElBQUksSUFBSSxJQUFJLFVBQVUsSUFBSSxJQUFJLENBQUM7QUFDakQsQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxJQUF5QjtJQUMxRCxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUNyQixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBQ0QsT0FBTyxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUM7QUFDMUMsQ0FBQztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxJQUF5QjtJQUN6RCxPQUFPLElBQUksSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLEtBQUssSUFBSSxPQUFPLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDO0FBQzdGLENBQUM7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMs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QUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQyxDQUFDLENBQUM7SUFDSCxtQkFBbUI7SUFDbkIsS0FBSyxNQUFNLElBQUksSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDckIsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2QsQ0FBQztJQUNMLENBQUM7SUFDRCxPQUFPLFVBQWlCLENBQUM7QUFDN0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzT2JqZWN0IH0gZnJvbSAnLi4vLi4vLi4vaGVscGVycyc7XG5pbXBvcnQgeyBSQVdfTk9ERSB9IGZyb20gJy4uLy4uL2NvbnN0YW50cyc7XG5cbmNvbnN0IHJhd0hhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbmV4cG9ydCBmdW5jdGlvbiBoYXNPd25Qcm9wKG9iajogYW55LCBrZXk6IFByb3BlcnR5S2V5KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHJhd0hhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNWYWx1ZURlc2NyaXB0b3IoZGVzYz86IFByb3BlcnR5RGVzY3JpcHRvcikge1xuICAgIGlmIChkZXNjID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gJ3ZhbHVlJyBpbiBkZXNjIHx8ICd3cml0YWJsZScgaW4gZGVzYztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQWNjZXNzb3JEZXNjcmlwdG9yKGRlc2M/OiBQcm9wZXJ0eURlc2NyaXB0b3IpIHtcbiAgICBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuICdnZXQnIGluIGRlc2MgfHwgJ3NldCcgaW4gZGVzYztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9uV3JpdGVhYmxlVmFsdWUoZGVzYz86IFByb3BlcnR5RGVzY3JpcHRvcikge1xuICAgIHJldHVybiBkZXNjICYmIGRlc2MuY29uZmlndXJhYmxlID09PSBmYWxzZSAmJiAndmFsdWUnIGluIGRlc2MgJiYgZGVzYy53cml0YWJsZSA9PT0gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ludmFsaWRTZXRBY2Nlc3NvcihkZXNjPzogUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgaWYgKGRlc2MgJiYgZGVzYy5jb25maWd1cmFibGUgPT09IGZhbHNlICYmICdzZXQnIGluIGRlc2MgJiYgZGVzYy5zZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNJbnZhbGlkR2V0QWNjZXNzb3IoZGVzYz86IFByb3BlcnR5RGVzY3JpcHRvcikge1xuICAgIGlmIChkZXNjICYmIGRlc2MuY29uZmlndXJhYmxlID09PSBmYWxzZSAmJiAnZ2V0JyBpbiBkZXNjICYmIGRlc2MuZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdHJhbnNmZXJQYXJhbXMoYXJnczogSUFyZ3VtZW50cyB8IEFycmF5PGFueT4pIHtcbiAgICBhcmdzID0gQXJyYXkuaXNBcnJheShhcmdzKSA/IGFyZ3MgOiBBcnJheS5mcm9tKGFyZ3MpO1xuICAgIHJldHVybiBhcmdzLm1hcChhcmcgPT4ge1xuICAgICAgICByZXR1cm4gYXJnW1JBV19OT0RFXSA/IGFyZ1tSQVdfTk9ERV0gOiBhcmc7XG4gICAgfSk7XG59XG5cbmNvbnN0IGJ1aWxkSW5Qcm9wczogUHJvcGVydHlLZXlbXSA9IFsnbGVuZ3RoJywgJ2NhbGxlcicsICdjYWxsZWUnLCAnYXJndW1lbnRzJywgJ3Byb3RvdHlwZScsIFN5bWJvbC5oYXNJbnN0YW5jZV07XG5mdW5jdGlvbiB0cmFuc2ZlclByb3BzKG86IEZ1bmN0aW9uLCBuOiBGdW5jdGlvbikge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIFJlZmxlY3Qub3duS2V5cyhvKSkge1xuICAgICAgICBpZiAoYnVpbGRJblByb3BzLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG4sIGtleSk7XG4gICAgICAgIGlmIChkZXNjICYmIGRlc2Mud3JpdGFibGUpIHtcbiAgICAgICAgICAgIG5ba2V5XSA9IG9ba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQoZm46IGFueSwgY29udGV4dDogYW55KSB7XG4gICAgY29uc3QgZk5PUCA9IGZ1bmN0aW9uKCkge307XG4gICAgZnVuY3Rpb24gYm91bmQoKSB7XG4gICAgICAgIGNvbnN0IGFyZ3MgPSB0cmFuc2ZlclBhcmFtcyhhcmd1bWVudHMpO1xuICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSB7XG4gICAgICAgICAgICBjb25zdCBvYmogPSBuZXcgZm4oLi4uYXJncyk7XG4gICAgICAgICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2Yob2JqLCBib3VuZC5wcm90b3R5cGUpO1xuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBib3VuZC4kbmF0aXZlID0gZm47XG4gICAgdHJhbnNmZXJQcm9wcyhmbiwgYm91bmQpO1xuICAgIGlmIChmbi5wcm90b3R5cGUpIHtcbiAgICAgICAgZk5PUC5wcm90b3R5cGUgPSBmbi5wcm90b3R5cGU7XG4gICAgfVxuICAgIGJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG4gICAgaWYgKFN5bWJvbC5oYXNJbnN0YW5jZSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoYm91bmQsIFN5bWJvbC5oYXNJbnN0YW5jZSwge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgdmFsdWUoaW5zdGFuY2U6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wID0gZm4ucHJvdG90eXBlO1xuICAgICAgICAgICAgICAgIHJldHVybiBpc09iamVjdChvcCkgfHwgdHlwZW9mIG9wID09PSAnZnVuY3Rpb24nID8gaW5zdGFuY2UgaW5zdGFuY2VvZiBmbiA6IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGJvdW5kO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmFrZU9iamVjdCh0YXJnZXQ6IFJlY29yZDxQcm9wZXJ0eUtleSwgYW55Piwgd3JpdGFibGVLZXlzPzogUHJvcGVydHlLZXlbXSkge1xuICAgIGNvbnN0IGZha2VPYmplY3QgPSB7fTtcbiAgICBjb25zdCBwcm9wZXJ0eU1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgYm9vbGVhbj4gPSB7fTtcbiAgICBjb25zdCBzdG9yYWdlQm94ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBjb25zdCBwcm9wZXJ0eU5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGFyZ2V0KTtcbiAgICBjb25zdCBkZWYgPSAocDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgcCk7XG4gICAgICAgIGlmIChkZXNjcmlwdG9yPy5jb25maWd1cmFibGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhc0dldHRlciA9IGhhc093blByb3AoZGVzY3JpcHRvciwgJ2dldCcpO1xuICAgICAgICAgICAgY29uc3QgaGFzU2V0dGVyID0gaGFzT3duUHJvcChkZXNjcmlwdG9yLCAnc2V0Jyk7XG4gICAgICAgICAgICBjb25zdCBjYW5Xcml0YWJsZSA9IHdyaXRhYmxlS2V5cyAmJiB3cml0YWJsZUtleXMubGVuZ3RoID4gMCAmJiB3cml0YWJsZUtleXMuaW5jbHVkZXMocCk7XG4gICAgICAgICAgICBpZiAoaGFzR2V0dGVyKSB7XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvci5nZXQgPSAoKSA9PiAoaGFzT3duUHJvcChzdG9yYWdlQm94LCBwKSA/IHN0b3JhZ2VCb3hbcF0gOiB0YXJnZXRbcF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGhhc1NldHRlcikge1xuICAgICAgICAgICAgICAgIGRlc2NyaXB0b3Iuc2V0ID0gdmFsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmFnZUJveFtwXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjYW5Xcml0YWJsZSkge1xuICAgICAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yLndyaXRhYmxlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGhhc0dldHRlcikge1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdG9yLnNldCA9IHZhbCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yYWdlQm94W3BdID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZha2VPYmplY3QsIHAsIE9iamVjdC5mcmVlemUoZGVzY3JpcHRvcikpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBwcm9wZXJ0eU5hbWVzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIHByb3BlcnR5TWFwW3BdID0gdHJ1ZTtcbiAgICAgICAgZGVmKHApO1xuICAgIH0pO1xuICAgIC8vIOWGjeasoeW+queOr+aYr+S4uuS6huWkhOeQhuWOn+Wei+mTvuS4reeahOWxnuaAp1xuICAgIGZvciAoY29uc3QgcHJvcCBpbiB0YXJnZXQpIHtcbiAgICAgICAgaWYgKCFwcm9wZXJ0eU1hcFtwcm9wXSkge1xuICAgICAgICAgICAgZGVmKHByb3ApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWtlT2JqZWN0IGFzIGFueTtcbn1cbiJdfQ==