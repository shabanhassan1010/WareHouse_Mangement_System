import { Component } from '@angular/core';
import { NavBlank } from "../../Components/nav-blank/nav-blank";
import { RouterOutlet } from '@angular/router';
import { Footer } from "../../Components/footer/footer";

@Component({
  selector: 'app-blank-layout',
  imports: [NavBlank, RouterOutlet, Footer],
  templateUrl: './blank-layout.html',
  styleUrl: './blank-layout.css'
})
export class BlankLayout {

}
