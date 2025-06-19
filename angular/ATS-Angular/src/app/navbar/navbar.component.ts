import { Component, NgModule, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, SidebarModule, ButtonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit {

  sidebarVisible: boolean = false;

  constructor(private router: Router) { }
  userRole: string | null = null;

  ngOnInit(): void {
    console.log('ngOnInit ejecutado, líneas de localStorage comentadas temporalmente');
    this.userRole = localStorage.getItem('userRole') || null;
    if (!this.userRole) {
    this.userRole = localStorage.getItem('userRole') || null;
    }
  }

  isModuleVisible(moduleList: string[]): boolean {
    return this.userRole !== null && moduleList.includes(this.userRole);
  }

  logout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    this.router.navigate(['/']); // Redirige al usuario a la raíz después de cerrar sesión
  }
}
