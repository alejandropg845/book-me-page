import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { MainComponent } from './main/main.component';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthRoutingModule } from './auth.routes';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    MainComponent,
  ],
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    AuthRoutingModule,
    ReactiveFormsModule
  ]
})
export class AuthModule { }
