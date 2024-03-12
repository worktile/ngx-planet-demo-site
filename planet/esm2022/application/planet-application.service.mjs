import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { shareReplay, map } from 'rxjs/operators';
import { coerceArray } from '../helpers';
import { AssetsLoader } from '../assets-loader';
import { getApplicationService } from '../global-planet';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "../assets-loader";
export class PlanetApplicationService {
    constructor(http, assetsLoader) {
        this.http = http;
        this.assetsLoader = assetsLoader;
        this.apps = [];
        this.appsMap = {};
        if (getApplicationService()) {
            throw new Error('PlanetApplicationService has been injected in the portal, repeated injection is not allowed');
        }
    }
    register(appOrApps) {
        const apps = coerceArray(appOrApps);
        apps.forEach(app => {
            if (this.appsMap[app.name]) {
                throw new Error(`${app.name} has be registered.`);
            }
            this.apps.push(app);
            this.appsMap[app.name] = app;
        });
    }
    registerByUrl(url) {
        const result = this.http.get(`${url}`).pipe(map(apps => {
            if (apps && Array.isArray(apps)) {
                this.register(apps);
            }
            else {
                this.register(apps);
            }
        }), shareReplay());
        result.subscribe();
        return result;
    }
    unregister(name) {
        if (this.appsMap[name]) {
            delete this.appsMap[name];
            this.apps = this.apps.filter(app => {
                return app.name !== name;
            });
        }
    }
    getAppsByMatchedUrl(url) {
        return this.getApps().filter(app => {
            if (app.routerPathPrefix instanceof RegExp) {
                return app.routerPathPrefix.test(url);
            }
            else {
                return url.startsWith(app.routerPathPrefix);
            }
        });
    }
    getAppByName(name) {
        return this.appsMap[name];
    }
    getAppsToPreload(excludeAppNames) {
        return this.getApps().filter(app => {
            if (excludeAppNames) {
                return app.preload && !excludeAppNames.includes(app.name);
            }
            else {
                return app.preload;
            }
        });
    }
    getApps() {
        return this.apps;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationService, deps: [{ token: i1.HttpClient }, { token: i2.AssetsLoader }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationService, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.2.3", ngImport: i0, type: PlanetApplicationService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.HttpClient }, { type: i2.AssetsLoader }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbmV0LWFwcGxpY2F0aW9uLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGFuZXQvc3JjL2FwcGxpY2F0aW9uL3BsYW5ldC1hcHBsaWNhdGlvbi5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDM0MsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDbEQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUV6QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDaEQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sa0JBQWtCLENBQUM7Ozs7QUFLekQsTUFBTSxPQUFPLHdCQUF3QjtJQUtqQyxZQUFvQixJQUFnQixFQUFVLFlBQTBCO1FBQXBELFNBQUksR0FBSixJQUFJLENBQVk7UUFBVSxpQkFBWSxHQUFaLFlBQVksQ0FBYztRQUpoRSxTQUFJLEdBQXdCLEVBQUUsQ0FBQztRQUUvQixZQUFPLEdBQXlDLEVBQUUsQ0FBQztRQUd2RCxJQUFJLHFCQUFxQixFQUFFLEVBQUUsQ0FBQztZQUMxQixNQUFNLElBQUksS0FBSyxDQUNYLDZGQUE2RixDQUNoRyxDQUFDO1FBQ04sQ0FBQztJQUNMLENBQUM7SUFFRCxRQUFRLENBQVMsU0FBa0U7UUFDL0UsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDZixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3RELENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsYUFBYSxDQUFDLEdBQVc7UUFDckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FDdkMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ1AsSUFBSSxJQUFJLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hCLENBQUM7aUJBQU0sQ0FBQztnQkFDSixJQUFJLENBQUMsUUFBUSxDQUFDLElBQXlCLENBQUMsQ0FBQztZQUM3QyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLEVBQ0YsV0FBVyxFQUFFLENBQ2hCLENBQUM7UUFDRixNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbkIsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVELFVBQVUsQ0FBQyxJQUFZO1FBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUMvQixPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDO1lBQzdCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztJQUNMLENBQUM7SUFFRCxtQkFBbUIsQ0FBbUIsR0FBVztRQUM3QyxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDL0IsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLFlBQVksTUFBTSxFQUFFLENBQUM7Z0JBQ3pDLE9BQU8sR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2hELENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxZQUFZLENBQUMsSUFBWTtRQUNyQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELGdCQUFnQixDQUFDLGVBQTBCO1FBQ3ZDLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMvQixJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNsQixPQUFPLEdBQUcsQ0FBQyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDO1lBQ3ZCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxPQUFPO1FBQ0gsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ3JCLENBQUM7OEdBMUVRLHdCQUF3QjtrSEFBeEIsd0JBQXdCLGNBRnJCLE1BQU07OzJGQUVULHdCQUF3QjtrQkFIcEMsVUFBVTttQkFBQztvQkFDUixVQUFVLEVBQUUsTUFBTTtpQkFDckIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQbGFuZXRBcHBsaWNhdGlvbiB9IGZyb20gJy4uL3BsYW5ldC5jbGFzcyc7XG5pbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBIdHRwQ2xpZW50IH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuaW1wb3J0IHsgc2hhcmVSZXBsYXksIG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IGNvZXJjZUFycmF5IH0gZnJvbSAnLi4vaGVscGVycyc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBBc3NldHNMb2FkZXIgfSBmcm9tICcuLi9hc3NldHMtbG9hZGVyJztcbmltcG9ydCB7IGdldEFwcGxpY2F0aW9uU2VydmljZSB9IGZyb20gJy4uL2dsb2JhbC1wbGFuZXQnO1xuXG5ASW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG59KVxuZXhwb3J0IGNsYXNzIFBsYW5ldEFwcGxpY2F0aW9uU2VydmljZSB7XG4gICAgcHJpdmF0ZSBhcHBzOiBQbGFuZXRBcHBsaWNhdGlvbltdID0gW107XG5cbiAgICBwcml2YXRlIGFwcHNNYXA6IHsgW2tleTogc3RyaW5nXTogUGxhbmV0QXBwbGljYXRpb24gfSA9IHt9O1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBodHRwOiBIdHRwQ2xpZW50LCBwcml2YXRlIGFzc2V0c0xvYWRlcjogQXNzZXRzTG9hZGVyKSB7XG4gICAgICAgIGlmIChnZXRBcHBsaWNhdGlvblNlcnZpY2UoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICdQbGFuZXRBcHBsaWNhdGlvblNlcnZpY2UgaGFzIGJlZW4gaW5qZWN0ZWQgaW4gdGhlIHBvcnRhbCwgcmVwZWF0ZWQgaW5qZWN0aW9uIGlzIG5vdCBhbGxvd2VkJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlZ2lzdGVyPFRFeHRyYT4oYXBwT3JBcHBzOiBQbGFuZXRBcHBsaWNhdGlvbjxURXh0cmE+IHwgUGxhbmV0QXBwbGljYXRpb248VEV4dHJhPltdKSB7XG4gICAgICAgIGNvbnN0IGFwcHMgPSBjb2VyY2VBcnJheShhcHBPckFwcHMpO1xuICAgICAgICBhcHBzLmZvckVhY2goYXBwID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmFwcHNNYXBbYXBwLm5hbWVdKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2FwcC5uYW1lfSBoYXMgYmUgcmVnaXN0ZXJlZC5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYXBwcy5wdXNoKGFwcCk7XG4gICAgICAgICAgICB0aGlzLmFwcHNNYXBbYXBwLm5hbWVdID0gYXBwO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZWdpc3RlckJ5VXJsKHVybDogc3RyaW5nKTogT2JzZXJ2YWJsZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuaHR0cC5nZXQoYCR7dXJsfWApLnBpcGUoXG4gICAgICAgICAgICBtYXAoYXBwcyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFwcHMgJiYgQXJyYXkuaXNBcnJheShhcHBzKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyKGFwcHMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXIoYXBwcyBhcyBQbGFuZXRBcHBsaWNhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBzaGFyZVJlcGxheSgpXG4gICAgICAgICk7XG4gICAgICAgIHJlc3VsdC5zdWJzY3JpYmUoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICB1bnJlZ2lzdGVyKG5hbWU6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5hcHBzTWFwW25hbWVdKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5hcHBzTWFwW25hbWVdO1xuICAgICAgICAgICAgdGhpcy5hcHBzID0gdGhpcy5hcHBzLmZpbHRlcihhcHAgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcHAubmFtZSAhPT0gbmFtZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0QXBwc0J5TWF0Y2hlZFVybDxURXh0cmEgPSB1bmtub3duPih1cmw6IHN0cmluZyk6IFBsYW5ldEFwcGxpY2F0aW9uPFRFeHRyYT5bXSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEFwcHMoKS5maWx0ZXIoYXBwID0+IHtcbiAgICAgICAgICAgIGlmIChhcHAucm91dGVyUGF0aFByZWZpeCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcHAucm91dGVyUGF0aFByZWZpeC50ZXN0KHVybCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmwuc3RhcnRzV2l0aChhcHAucm91dGVyUGF0aFByZWZpeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldEFwcEJ5TmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwc01hcFtuYW1lXTtcbiAgICB9XG5cbiAgICBnZXRBcHBzVG9QcmVsb2FkKGV4Y2x1ZGVBcHBOYW1lcz86IHN0cmluZ1tdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEFwcHMoKS5maWx0ZXIoYXBwID0+IHtcbiAgICAgICAgICAgIGlmIChleGNsdWRlQXBwTmFtZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwLnByZWxvYWQgJiYgIWV4Y2x1ZGVBcHBOYW1lcy5pbmNsdWRlcyhhcHAubmFtZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcHAucHJlbG9hZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0QXBwcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwcztcbiAgICB9XG59XG4iXX0=