import { ProxyWindow } from './proxies/window';
import { getSandboxPatchHandlers } from './patches';
import { Sandbox } from '../sandbox';
export class ProxySandbox extends Sandbox {
    constructor(app, options) {
        super();
        this.app = app;
        this.options = options;
        this.running = false;
        this.patchHandlers = [];
        this.patchHandlers = getSandboxPatchHandlers(this);
        this.start();
    }
    start() {
        this.running = true;
        this.rewriteVariables = this.getPatchRewriteVariables();
        const proxyWindow = new ProxyWindow(this);
        this.global = proxyWindow.create();
        this.execPatchHandlers();
    }
    destroy() {
        this.running = false;
        this.patchHandlers.forEach(handler => {
            if (handler.destroy) {
                handler.destroy();
            }
        });
    }
    getPatchRewriteVariables() {
        return this.patchHandlers.reduce((pre, cur) => {
            return [...pre, ...(cur.rewrite ? Object.keys(cur.rewrite) : [])];
        }, []);
    }
    execPatchHandlers() {
        this.patchHandlers.forEach(handler => {
            if (handler.rewrite) {
                for (const key in handler.rewrite) {
                    if (handler.rewrite[key]) {
                        this.global[key] = handler.rewrite[key];
                    }
                }
            }
            if (handler.init) {
                handler?.init();
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHktc2FuZGJveC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3BsYW5ldC9zcmMvc2FuZGJveC9wcm94eS9wcm94eS1zYW5kYm94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFHcEQsT0FBTyxFQUFFLE9BQU8sRUFBa0IsTUFBTSxZQUFZLENBQUM7QUFFckQsTUFBTSxPQUFPLFlBQWEsU0FBUSxPQUFPO0lBU3JDLFlBQ1csR0FBVyxFQUNGLE9BQXVCO1FBRXZDLEtBQUssRUFBRSxDQUFDO1FBSEQsUUFBRyxHQUFILEdBQUcsQ0FBUTtRQUNGLFlBQU8sR0FBUCxPQUFPLENBQWdCO1FBVnBDLFlBQU8sR0FBRyxLQUFLLENBQUM7UUFNZixrQkFBYSxHQUEwQixFQUFFLENBQUM7UUFPOUMsSUFBSSxDQUFDLGFBQWEsR0FBRyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELEtBQUs7UUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDeEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVELE9BQU87UUFDSCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNyQixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNqQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3RCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyx3QkFBd0I7UUFDNUIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNwRCxPQUFPLENBQUMsR0FBRyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFTyxpQkFBaUI7UUFDckIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDakMsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNoQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM1QyxDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBQ0QsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1lBQ3BCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb3h5V2luZG93IH0gZnJvbSAnLi9wcm94aWVzL3dpbmRvdyc7XG5pbXBvcnQgeyBnZXRTYW5kYm94UGF0Y2hIYW5kbGVycyB9IGZyb20gJy4vcGF0Y2hlcyc7XG5pbXBvcnQgeyBTYW5kYm94UGF0Y2hIYW5kbGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBHbG9iYWwgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBTYW5kYm94LCBTYW5kYm94T3B0aW9ucyB9IGZyb20gJy4uL3NhbmRib3gnO1xuXG5leHBvcnQgY2xhc3MgUHJveHlTYW5kYm94IGV4dGVuZHMgU2FuZGJveCB7XG4gICAgcHVibGljIHJ1bm5pbmcgPSBmYWxzZTtcblxuICAgIHB1YmxpYyBvdmVycmlkZSBnbG9iYWwhOiBHbG9iYWw7XG5cbiAgICBwdWJsaWMgcmV3cml0ZVZhcmlhYmxlcyE6IFByb3BlcnR5S2V5W107XG5cbiAgICBwcml2YXRlIHBhdGNoSGFuZGxlcnM6IFNhbmRib3hQYXRjaEhhbmRsZXJbXSA9IFtdO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHB1YmxpYyBhcHA6IHN0cmluZyxcbiAgICAgICAgcHVibGljIG92ZXJyaWRlIG9wdGlvbnM6IFNhbmRib3hPcHRpb25zXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGF0Y2hIYW5kbGVycyA9IGdldFNhbmRib3hQYXRjaEhhbmRsZXJzKHRoaXMpO1xuICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgICAgIHRoaXMucmV3cml0ZVZhcmlhYmxlcyA9IHRoaXMuZ2V0UGF0Y2hSZXdyaXRlVmFyaWFibGVzKCk7XG4gICAgICAgIGNvbnN0IHByb3h5V2luZG93ID0gbmV3IFByb3h5V2luZG93KHRoaXMpO1xuICAgICAgICB0aGlzLmdsb2JhbCA9IHByb3h5V2luZG93LmNyZWF0ZSgpO1xuICAgICAgICB0aGlzLmV4ZWNQYXRjaEhhbmRsZXJzKCk7XG4gICAgfVxuXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGF0Y2hIYW5kbGVycy5mb3JFYWNoKGhhbmRsZXIgPT4ge1xuICAgICAgICAgICAgaWYgKGhhbmRsZXIuZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFBhdGNoUmV3cml0ZVZhcmlhYmxlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0Y2hIYW5kbGVycy5yZWR1Y2U8c3RyaW5nW10+KChwcmUsIGN1cikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFsuLi5wcmUsIC4uLihjdXIucmV3cml0ZSA/IE9iamVjdC5rZXlzKGN1ci5yZXdyaXRlKSA6IFtdKV07XG4gICAgICAgIH0sIFtdKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGV4ZWNQYXRjaEhhbmRsZXJzKCkge1xuICAgICAgICB0aGlzLnBhdGNoSGFuZGxlcnMuZm9yRWFjaChoYW5kbGVyID0+IHtcbiAgICAgICAgICAgIGlmIChoYW5kbGVyLnJld3JpdGUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBoYW5kbGVyLnJld3JpdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIucmV3cml0ZVtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdsb2JhbFtrZXldID0gaGFuZGxlci5yZXdyaXRlW2tleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaGFuZGxlci5pbml0KSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcj8uaW5pdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=