import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if(authService.getToken) {
    
    if(!router.url.includes('bookmecontent')) {
      router.navigateByUrl('/bookmecontent/main-content/homepage');
      return false;
    }
  }
  
  return true;
};
