import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Console } from 'console';
import Swal from 'sweetalert2';
import { Router, RouterModule } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {

  username: string = '';
  password: string = '';
  isLoading = false;

  constructor(
    private router: Router, public authService: AuthServiceService
    
  ){}

  isPasswordVisible: boolean = false;

  onLoginClick() {
    this.isLoading = true;
    this.authService.login(this.username, this.password).subscribe(isLoggedIn => {
      this.isLoading = false;
      if (isLoggedIn) {
        this.router.navigate(['/dashboard']);
      } else {
      }
    });
  }

    togglePasswordVisibility() {
      this.isPasswordVisible = !this.isPasswordVisible;
    }

    removeSpaces(event: any) {
      event.target.value = event.target.value.replace(/\s/g, '');
    }

    cancelar() {
      this.username = '';
      this.password = '';
    } 

    /*
  logearse() {
    if (this.authService.login(this.authService.username, this.authService.password)) {
      this.router.navigate(['/dashboard']);
    }
  }

  

  */

}
