import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  styles: ``
})
export class RegisterComponent {

  registerForm:FormGroup;
  onSubmit(){
    if(!this.registerForm.valid){
      this.toastr.error("Please fill all the fields pending");
      return;
    }
    this.authService.isLoading = true;
    this.authService.register(this.registerForm.value);
  }


  isVisible:boolean = false;

  showPassword(){
    this.isVisible = !this.isVisible;
  }

  randomizedAccount() {
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

    this.registerForm.get("username")?.setValue(username);
    this.registerForm.get("email")?.setValue(email);
    this.registerForm.get("password")?.setValue(password);


  }

  constructor(private fb:FormBuilder, public authService:AuthService, private toastr:ToastrService){

    this.registerForm = this.fb.group({
      username: [null,[Validators.required]],
      password: [null,[Validators.required]]
    });

  }

}
