import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

export const homeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if(!authService.getToken){

    if(router.url.includes("bookmecontent")){
      router.navigateByUrl("/bookme/auth/login");
      return false;
    }
    
  }
  return true;
};
