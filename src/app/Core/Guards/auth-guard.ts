import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
  
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      return true;
    } else {
      router.navigate(['/login']);
      return false;
    }
  }

  // if he is not in browser
  router.navigate(['/login']);
  return false;
};
