import {Injectable} from '@angular/core';
import {Observable, of} from "rxjs";
import {UserType} from "./auth.service";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {catchError, map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  private authApi = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {
  }

  login(email: string, password: string): Observable<any> {
    const body = new HttpParams()
      .set('email', email)
      .set('password', password);
    return this.http.post<any>(
      `${this.authApi}/login`,
      {email, password},
      // body.toString(),
      {
        headers: new HttpHeaders({'Content-Type': 'application/json'}),
        observe: 'body',
        withCredentials: true // Include credentials if needed
      }
    );
  }

  register(data: UserType): Observable<UserType> {
    return this.http.post<UserType>(`${this.authApi}/signup`, data, {
      headers: new HttpHeaders({'Content-Type': 'application/json'}),
      observe: 'body',
    });
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    const newToken = token?.split('|')[1];
    console.log('token logout', token)
    console.log('token new logout', newToken)
    const headers = new HttpHeaders({Authorization: `Bearer ${token}`});
    localStorage.removeItem('token');
    return this.http.post<any>(
      `${this.authApi}/logout`,
      {},
      {
        headers
      }
    ).pipe(
      // console.log('logout 56');
      catchError(this.handleError<any>('logout')),
    )
      ;
  }

  getCurrentUser(): Observable<any> {
    const token = localStorage.getItem('token');
    token?.split('|');
    // const startIndex = token?.indexOf('B');
    // const headers = new HttpHeaders({Authorization: `Bearer ${token}`});
    return this.http
      .get<any>(`${this.authApi}/current-user`, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      })
      .pipe(catchError(this.handleError<any>('getCurrentUser')));
  }

  getById(id: any): Observable<UserType> {
    return this.http.get<UserType>(`${this.authApi}/${id}`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }),
      observe: 'body'
    }).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }

  update(id: any, data: any): Observable<UserType> {
    return this.http.put<UserType>(`${this.authApi}/${id}`, data, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }),
      observe: 'body'
    }).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }

  isLoggedIn() {
    return localStorage.getItem('token') !== null;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }
}
