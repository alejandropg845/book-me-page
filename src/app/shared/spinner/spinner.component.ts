import { Component, computed } from '@angular/core';
import { SpinnerService } from '../../services/spinner.service';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styles: `
    
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.5s ease;
      pointer-events: none;
    }


    .overlay.active {
      opacity: 1;
      pointer-events: auto;
    }


    .spinner {
      display: flex;
      align-items: center;
      color: #fff;
      font-size: 1.2em;
    }

    .circle {
      width: 24px;
      height: 24px;
      border: 4px solid #fff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 10px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

  `
})
export class SpinnerComponent {

  isLoading = this.spinnerService.isLoading;
  isOtherThingLoading = this.spinnerService.isOtherThingLoading;

  constructor(private spinnerService:SpinnerService){}

}
