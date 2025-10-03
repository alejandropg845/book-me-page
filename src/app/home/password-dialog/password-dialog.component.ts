import { Component } from '@angular/core';
import { PasswordService } from '../../services/password.service';

@Component({
  selector: 'app-password-dialog',
  templateUrl: './password-dialog.component.html',
  styleUrl: './password-dialog.component.css'
})
export class PasswordDialogComponent {

  constructor(public passwordService:PasswordService){}

}
