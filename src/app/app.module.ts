import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { SpinnerComponent } from './shared/spinner/spinner.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { AdminComponent } from './home/admin/admin.component';
import { PasswordDialogComponent } from './home/password-dialog/password-dialog.component';
import { SafetyDialogComponent } from './shared/safety-dialog/safety-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    SpinnerComponent,
    ConfirmDialogComponent,
    AdminComponent,
    PasswordDialogComponent,
    SafetyDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ToastrModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot({preventDuplicates: true}), // ToastrModule added,
    HttpClientModule
  ],
  providers: [
    provideHttpClient(withFetch()),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
