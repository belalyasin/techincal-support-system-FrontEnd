import {Injectable} from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot, Router,
} from '@angular/router';
import {AuthService} from './auth.service';
import {AuthServiceService} from "./auth-service.service";

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthServiceService, private router: Router) {
  }

  // canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
  //   const currentUser = this.authService.currentUserValue;
  //   if (currentUser) {
  //     // logged in so return true
  //     return true;
  //   }
  //
  //   // not logged in so redirect to login page with the return url
  //   this.authService.logout();
  //   return false;
  // }

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
      return false;
    }
  }
}
