import {Injectable, OnDestroy} from '@angular/core';
import {Observable, BehaviorSubject, of, Subscription, throwError} from 'rxjs';
import {map, catchError, switchMap, finalize} from 'rxjs/operators';
import {UserModel} from '../models/user.model';
import {AuthModel} from '../models/auth.model';
import {AuthHTTPService} from './auth-http';
import {environment} from 'src/environments/environment';
import {Router} from '@angular/router';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";

export type UserType = UserModel | undefined;

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  // private fields
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/
  private authLocalStorageToken = `${environment.appVersion}-${environment.USERDATA_KEY}`;

  private authApi = 'http://127.0.0.1:8000/api';
  // public fields
  currentUser$: Observable<UserType>;
  isLoading$: Observable<boolean>;
  currentUserSubject: BehaviorSubject<UserType>;
  isLoadingSubject: BehaviorSubject<boolean>;
  currentUser: any;

  get currentUserValue(): UserType {
    console.log('currentUserValue:', this.currentUserSubject.value);
    return this.currentUserSubject.value;
  }

  set currentUserValue(user: UserType) {
    this.currentUserSubject.next(user);
  }

  constructor(
    private authHttpService: AuthHTTPService,
    private router: Router,
    private http: HttpClient
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.currentUserSubject = new BehaviorSubject<UserType>(undefined);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isLoading$ = this.isLoadingSubject.asObservable();
    const subscr = this.getUserByToken().subscribe();
    this.unsubscribe.push(subscr);
  }

  // public methods
  login(email: string, password: string): Observable<UserType> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.login(email, password).pipe(
      map((auth: AuthModel) => {
        const result = this.setAuthFromLocalStorage(auth);
        return result;
      }),
      switchMap(() => this.getUserByToken()),
      catchError((err) => {
        console.error('err', err);
        return of(undefined);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  sign_in(email: string, password: string): Observable<UserType> {
    console.log('login');
    // const body = { email, password };
    const body = new HttpParams()
      .set('email', email)
      .set('password', password);
    // console.log('body:', formData);
    console.log('login');
    // const jsonBody = JSON.stringify(body);
    // console.log('jsonBody:', formData);

    return this.http.post<any>(
      `${this.authApi}/login`,
      body.toString(),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
        withCredentials: true // Include credentials if needed
      }
    ).pipe(
      map((Auth: AuthModel) => {
        // Assuming the response contains a token and user data
        // this.currentUserValue(user);
        const result = this.setAuthFromLocalStorage(Auth);
        console.log('result:', result);
        this.currentUser = Auth;
        console.log('current user', this.currentUser);
        return result;

      }),
      switchMap(() => this.getUserByToken()),


      catchError((error) => {
        console.error('Error occurred during login:', error);
        return throwError(() => new Error(error?.message || 'Login failed'));
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  logout() {
    localStorage.removeItem(this.authLocalStorageToken);
    this.router.navigate(['/auth/login'], {
      queryParams: {},
    });
  }

  getUserByToken(): Observable<UserType> {
    const auth: any = this.getAuthFromLocalStorage();
    console.log('auth:', auth);
    if (!auth || !auth.token) {
      return of(undefined);
    }

    this.isLoadingSubject.next(true);
    // return this.currentUser.pipe(
    return this.authHttpService.getUserByToken(auth.token).pipe(
      map((user: UserType) => {
        console.log('user:', user); // undefined
        if (user) {
          this.currentUserSubject.next(user);
        } else {
          this.logout();
        }
        return user;
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // need create new user then login
  registration(user: UserModel): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.createUser(user).pipe(
      map(() => {
        this.isLoadingSubject.next(false);
      }),
      switchMap(() => this.login(user.email, user.password)),
      catchError((err) => {
        console.error('err', err);
        return of(undefined);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  forgotPassword(email: string): Observable<boolean> {
    this.isLoadingSubject.next(true);
    return this.authHttpService
      .forgotPassword(email)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  // private methods
  private setAuthFromLocalStorage(auth: any): boolean {
    // store auth authToken/refreshToken/epiresIn in local storage to keep user logged in between page refreshes
    console.log('auth:', auth);
    console.log('auth.authToken:', auth.token);
    const token = auth.token;
    token.split('|')[2];
    console.log('token:', token);
    if (auth && auth.token) {
      localStorage.setItem(this.authLocalStorageToken, JSON.stringify(auth));
      return true;
    }
    return false;
  }

  private getAuthFromLocalStorage(): AuthModel | undefined {
    try {
      const lsValue = localStorage.getItem(this.authLocalStorageToken);
      // console.log('lsValue:', lsValue);
      if (!lsValue) {
        return undefined;
      }

      const authData = JSON.parse(lsValue);
      return authData;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
