import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../shared/spinner.service';
import { HomeService } from '../home/home.service';

@Injectable({
  providedIn: 'root'
})

export class TokenInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let clonedRequest = req;

    if(this.authService.getToken && req.url.startsWith(environment.generalUrl)){
      
      //No mostrar el spinner cuando se envían mensajes, ya que puede resultar molesto o incómodo
      if(this.router.url.includes("chats") && !this.homeService.showPreview){
        this.spinnerService.show();
      }

      clonedRequest = req.clone({
        setHeaders: {
          Authorization: `bearer ${this.authService.token}`
        }
      });

    }

    return next.handle(clonedRequest)
    .pipe(
      catchError((error:HttpErrorResponse) => {
        if(error.status === 401){
          this.authService.token = null;
          localStorage.removeItem('bmt');
          this.toastr.warning("Your session has expired. Please log in again");
          this.router.navigateByUrl("/bookme/auth/login");
        }
        return throwError(() => error);
      }),
      finalize(() => this.spinnerService.hide())
    );

  }

  constructor(private authService:AuthService, 
    private router:Router, 
    private toastr:ToastrService,
    private spinnerService:SpinnerService,
    private homeService:HomeService){}

}