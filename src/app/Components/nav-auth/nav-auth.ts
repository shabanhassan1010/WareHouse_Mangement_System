import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-auth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-auth.html',
  styleUrls: ['./nav-auth.css']
})
export class NavAuth {

  get isLoggedIn(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('authToken') && !!localStorage.getItem('warehouseData');
    }
    return false;
  }

  get warehouse() {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('warehouseData');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  getProfileImage(): string {
    const wh = this.warehouse;
    if (wh && wh.imageUrl && wh.imageUrl !== 'string') {
      return wh.imageUrl;
    }
    return 'assets/profile-placeholder.png';
  }
}
