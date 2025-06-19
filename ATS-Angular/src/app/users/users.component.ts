import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    CardModule,
    DropdownModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    PanelModule,
    DialogModule,
    ButtonModule,
    FormsModule,
    InputSwitchModule,
    ConfirmPopupModule,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  filterOptions = [
    { name: 'Nombre', value: 'Name' },
    { name: 'Correo', value: 'Email' },
    { name: 'Estado', value: 'Status' },
  ];

  selectedStatus: string = '';



  applyFilter(): void {
    if (this.selectedFilter === 'Estado' && this.selectedStatus) {
      this.filteredUsers = this.users.filter(
        (user) =>
          user.Status?.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    } else if (this.selectedFilter && this.filterText) {
      this.filteredUsers = this.users.filter((user) =>
        user[this.selectedFilter]
          ?.toLowerCase()
          .includes(this.filterText.toLowerCase())
      );
    } else {
      this.filteredUsers = [...this.users];
    }
  }

  selectedUser: any = {
    Name: '',
    Email: '',
    Status: null,
  };

  statusOptions = [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];
  selectedFilter: string = '';
  filterText: string = '';
  displayDialog: boolean = false;
  dialogHeader: string = '';

  roleOptions: any[] = [];

  loggedInUser: string = '';
  loggedInUserRole: string = '';

  ngOnInit(): void {
    let token: string | null = null;
    let userRole: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('authToken');
      userRole = localStorage.getItem('userRole');
    }
    if (token) {
      this.http
        .get<{ users: any[], loggedInUser: string, loggedInUserRole: string }>(
          'https://backendsas.onrender.com/api/users',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .subscribe({
          next: (response) => {
            this.users = response.users;
            this.filteredUsers = [...this.users];
            this.loggedInUser = response.loggedInUser;
            this.loggedInUserRole = userRole || response.loggedInUserRole;
            console.log('Usuarios obtenidos:', this.users);
            console.log('Usuario logueado:', this.loggedInUser);
            console.log('Rol del usuario logueado:', this.loggedInUserRole);
          },
          error: (error) => {
            console.error('Error al obtener usuarios:', error);
          },
        });
    } else {
      console.error('No se encontró token en localStorage.');
    }
  }



  setRoleOptions(userRole: string): void {
    switch (userRole) {
      case 'AdminApp':
        this.roleOptions = [
          { label: 'AdminApp', value: 'AdminApp' },
          { label: 'AdminMinisterio', value: 'AdminMinisterio' },
          { label: 'AdminDistrito', value: 'AdminDistrito' },
          { label: 'AdminInstitucion', value: 'AdminInstitucion' },
          { label: 'Profesor', value: 'Profesor' },
          { label: 'PersonalApoyo', value: 'PersonalApoyo' },
        ];
        break;
      case 'AdminMinisterio':
        this.roleOptions = [
          { label: 'AdminMinisterio', value: 'AdminMinisterio' },
          { label: 'AdminDistrito', value: 'AdminDistrito' },
          { label: 'AdminInstitucion', value: 'AdminInstitucion' },
        ];
        break;
      case 'AdminDistrito':
        this.roleOptions = [
          { label: 'AdminInstitucion', value: 'AdminInstitucion' },
        ];
        break;
      case 'AdminInstitucion':
        this.roleOptions = [
          { label: 'Profesor', value: 'Profesor' },
          { label: 'PersonalApoyo', value: 'PersonalApoyo' },
        ];
        break;
      default:
        this.roleOptions = [];
        break;
    }
  }
  
  constructor(private http: HttpClient) {}



  onFilterChange(event: any): void {
    this.applyFilter();
  }

  showAddUserDialog(): void {
    this.dialogHeader = 'Añadir Usuario';
    this.selectedUser = { Name: '', Email: '', Status: '' };
    let userRole = '';
    if (typeof window !== 'undefined') {
      userRole = localStorage.getItem('userRole') || '';
    }
    this.setRoleOptions(userRole);
    this.displayDialog = true;
  }

  editUser(user: any): void {
    this.dialogHeader = 'Editar Usuario';
    this.selectedUser = { ...user };
    let userRole = '';
    if (typeof window !== 'undefined') {
      userRole = localStorage.getItem('userRole') || '';
    }
    this.setRoleOptions(userRole);
    this.displayDialog = true;
  }

  deleteUser(user: any): void {
    const index = this.users.indexOf(user);
    if (index > -1) {
      this.users.splice(index, 1);
      this.applyFilter();
    }
  }

  saveUser(): void {
    if (this.dialogHeader === 'Añadir Usuario') {
      this.users.push(this.selectedUser);
    } else {
      const index = this.users.findIndex(
        (usr) => usr === this.selectedUser
      );
      if (index > -1) {
        this.users[index] = this.selectedUser;
      }
    }
    this.applyFilter();
    this.displayDialog = false;
  }

  cancelDialog(): void {
    this.displayDialog = false;
  }
}
