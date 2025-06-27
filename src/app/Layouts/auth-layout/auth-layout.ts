import { Component } from '@angular/core';
import { NavAuth } from "../../Components/nav-auth/nav-auth";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [NavAuth , RouterOutlet],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css'
})
export class AuthLayout {

}
