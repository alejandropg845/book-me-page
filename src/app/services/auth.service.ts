import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { environment } from "../../environments/environment";
import { FormGroup } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { Observable, Subject, takeUntil, tap } from "rxjs";
import { AuthResponse } from "../interfaces/auth-response.interface";
import { Router } from "@angular/router";
import { handleBackendErrorResponse } from "../handlers/errors-handlers";

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {

    token:string | null = null;
    destroy$ = new Subject<void>();
    isLoading:boolean = false;
    isLogging:boolean = false;
    isRegistering:boolean = false;
    isRandomizing:boolean = false;

    get getToken(){
        return localStorage.getItem('bmt');
    }

    logIn(form:FormGroup){
        this.http.post<AuthResponse>(environment.userUrl+'/login', form.value)
        .pipe(takeUntil(this.destroy$), 
            tap(resp => {
            if(resp.ok){
                this.token = resp.token;
                localStorage.setItem('bmt', resp.token);
                this.router.navigateByUrl("/bookmecontent/main-content/homepage");
                this.isLogging = false;
            };
        }))
        .subscribe({
            next: suc => {
                this.toastr.success(suc.message);
                this.isLogging = false;
            },
            error: err => {
                handleBackendErrorResponse(err, this.toastr);
                this.isLogging = false;
            }
        });
    }

    register(form:{username:string, email:string, password:string}){
        this.http.post<AuthResponse>(environment.userUrl+'/register', form)
        .pipe(takeUntil(this.destroy$), tap(res => {
            if(res.ok){
                this.token = res.token;
                localStorage.setItem('bmt', res.token);
                this.router.navigate(['/bookmecontent/main-content/homepage']);
                this.isRegistering = false;
                this.isRandomizing = false;
            }
        }))
        .subscribe({
            next: suc => {
                this.toastr.success(suc.message);
                this.isRandomizing = false;
                this.isRegistering = false;
            },
            error: err => {
                handleBackendErrorResponse(err, this.toastr);
                this.isRandomizing = false;
                this.isRegistering = false;
            }
        });
    }

    constructor(private http:HttpClient, private toastr:ToastrService, private router:Router,){
        this.token = localStorage.getItem('bmt');
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

}