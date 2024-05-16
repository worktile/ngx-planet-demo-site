import { ProxySandbox } from './proxy/proxy-sandbox';
import { SnapshotSandbox } from './snapshot/snapshot-sandbox';
import { SANDBOX_INSTANCE } from './constants';
export { Sandbox } from './sandbox';
const defaultOptions = {
    strictGlobal: false
};
export function createSandbox(app, options) {
    options = Object.assign({}, defaultOptions, options || {});
    if (window.Proxy) {
        return new ProxySandbox(app, options);
    }
    else {
        return new SnapshotSandbox(app, options);
    }
}
export function getSandboxInstance() {
    return window[SANDBOX_INSTANCE];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGFuZXQvc3JjL3NhbmRib3gvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUM5RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFL0MsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUVwQyxNQUFNLGNBQWMsR0FBNEI7SUFDNUMsWUFBWSxFQUFFLEtBQUs7Q0FDdEIsQ0FBQztBQUVGLE1BQU0sVUFBVSxhQUFhLENBQUMsR0FBVyxFQUFFLE9BQXdCO0lBQy9ELE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxjQUFjLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRTNELElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxJQUFJLFlBQVksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDMUMsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM3QyxDQUFDO0FBQ0wsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0I7SUFDOUIsT0FBTyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUNwQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2FuZGJveE9wdGlvbnMgfSBmcm9tICcuL3NhbmRib3gnO1xuaW1wb3J0IHsgUHJveHlTYW5kYm94IH0gZnJvbSAnLi9wcm94eS9wcm94eS1zYW5kYm94JztcbmltcG9ydCB7IFNuYXBzaG90U2FuZGJveCB9IGZyb20gJy4vc25hcHNob3Qvc25hcHNob3Qtc2FuZGJveCc7XG5pbXBvcnQgeyBTQU5EQk9YX0lOU1RBTkNFIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5leHBvcnQgeyBTYW5kYm94IH0gZnJvbSAnLi9zYW5kYm94JztcblxuY29uc3QgZGVmYXVsdE9wdGlvbnM6IFBhcnRpYWw8U2FuZGJveE9wdGlvbnM+ID0ge1xuICAgIHN0cmljdEdsb2JhbDogZmFsc2Vcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTYW5kYm94KGFwcDogc3RyaW5nLCBvcHRpb25zPzogU2FuZGJveE9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMgfHwge30pO1xuXG4gICAgaWYgKHdpbmRvdy5Qcm94eSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb3h5U2FuZGJveChhcHAsIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgU25hcHNob3RTYW5kYm94KGFwcCwgb3B0aW9ucyk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2FuZGJveEluc3RhbmNlKCkge1xuICAgIHJldHVybiB3aW5kb3dbU0FOREJPWF9JTlNUQU5DRV07XG59XG4iXX0=