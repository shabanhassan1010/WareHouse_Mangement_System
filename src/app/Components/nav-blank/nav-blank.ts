import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-blank',
  imports: [RouterModule],
  templateUrl: './nav-blank.html',
  styleUrl: './nav-blank.css'
})
export class NavBlank {
  constructor(private router: Router) {}

 logout() {
  // مسح كل بيانات الـlocalStorage
  localStorage.clear();

  // إعادة التوجيه للصفحة الرئيسية أو صفحة تسجيل الدخول
  this.router.navigate(['/login']);
}
}
