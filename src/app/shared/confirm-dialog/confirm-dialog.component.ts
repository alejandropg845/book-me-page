import { Component } from '@angular/core';
import { ConfirmDialogService } from '../confirmDialog.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: `./confirm-dialog.component.css`
})
export class ConfirmDialogComponent {

  isOpen$ = this.confirmDialog.isOpen$;

  constructor(public confirmDialog:ConfirmDialogService){}

}
