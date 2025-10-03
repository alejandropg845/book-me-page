import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent{

  AuthForm:FormGroup;
  isVisible:boolean = false;
  onSubmit(){

    if(!this.AuthForm.valid) return;
    this.authService.isLogging = true;
    this.authService.logIn(this.AuthForm);
  }

  
  showPassword(){
    this.isVisible = !this.isVisible;
  }

  constructor(private fb:FormBuilder, 
            public authService:AuthService) {

    this.AuthForm = this.fb.group({
      username: [null, [Validators.required]],
      password: [null, [Validators.required]]
    });

  }

  randomizedAccount() {

    this.authService.isRandomizing = true;

    let username = '';
    const characters = "ABCDEFGHIJKLMNOPQRSTVWXYZabcdefghiklmnopqrstvwxyz123456789";
    const charactersLength = characters.length;

    for (let i = 0; i < 5; i++) {
        username += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    // Generar email
    const emailDomain = ["example.com", "test.com", "mail.com"];
    const randomDomain = emailDomain[Math.floor(Math.random() * emailDomain.length)];
    const email = `${username}${Math.floor(Math.random() * 100)}@${randomDomain}`;

    // Generar contraseña
    let password = '';
    const passwordLength = 8;
    for (let i = 0; i < passwordLength; i++) {
        password += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    const credentials = {
      username, email, password
    };

    this.authService.register(credentials);
    

  }


}
