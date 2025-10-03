import { Component } from '@angular/core';
import { SafetyService } from '../../services/safety.service';

@Component({
  selector: 'app-safety-dialog',
  templateUrl: './safety-dialog.component.html',
  styleUrl: './safety-dialog.component.css'
})
export class SafetyDialogComponent {

  constructor(public safetyService:SafetyService){}

}
