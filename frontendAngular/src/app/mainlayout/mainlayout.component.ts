import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { AppComponent } from "../app.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-mainlayout',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './mainlayout.component.html',
  styleUrl: './mainlayout.component.css'
})
export class MainlayoutComponent {

}
