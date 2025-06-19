import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { OnInit } from '@angular/core';
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
  selector: 'app-institutions',
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
  templateUrl: './institutions.component.html',
  styleUrls: ['./institutions.component.css'],
})
export class InstitutionsComponent implements OnInit {
  institutions: any[] = [];
  filteredInstitutions: any[] = [];
  filterOptions = [
    { name: 'Nombre', value: 'Name' },
    { name: 'Dirección', value: 'Address' },
    { name: 'Estado', value: 'SubscriptionStatus' },
  ];

  selectedStatus: string = '';

  applyFilter(): void {
    if (this.selectedFilter === 'Estado' && this.selectedStatus) {
      this.filteredInstitutions = this.institutions.filter(
        (institution) =>
          institution.SubscriptionStatus?.toLowerCase() ===
          this.selectedStatus.toLowerCase()
      );
    } else if (this.selectedFilter && this.filterText) {
      this.filteredInstitutions = this.institutions.filter((institution) =>
        institution[this.selectedFilter]
          ?.toLowerCase()
          .includes(this.filterText.toLowerCase())
      );
    } else {
      this.filteredInstitutions = [...this.institutions];
    }
  }

  selectedInstitution: any = {
    Name: '',
    Address: '',
    SubscriptionStatus: null
};

  statusOptions = [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];
  selectedFilter: string = '';
  filterText: string = '';
  displayDialog: boolean = false;
  dialogHeader: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.http
        .get<{ institutions: any[] }>(
          'https://backendsas.onrender.com/api/institutions',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .subscribe({
          next: (response) => {
            this.institutions = response.institutions;
            this.filteredInstitutions = [...this.institutions];
            console.log('Instituciones obtenidas:', this.institutions);
          },
          error: (error) => {
            console.error('Error al obtener instituciones:', error);
          },
        });
    } else {
      console.error('No se encontró token en localStorage.');
    }
  }

  onFilterChange(event: any): void {
    this.applyFilter();
  }

  showAddInstitutionDialog(): void {
    this.dialogHeader = 'Añadir Institución';
    this.selectedInstitution = { Name: '', Address: '', SubscriptionStatus: '' };
    this.displayDialog = true;
  }

  editInstitution(institution: any): void {
    this.dialogHeader = 'Editar Institución';
    this.selectedInstitution = { ...institution };
    this.displayDialog = true;
  }

  deleteInstitution(institution: any): void {
    const index = this.institutions.indexOf(institution);
    if (index > -1) {
      this.institutions.splice(index, 1);
      this.applyFilter();
    }
  }

  saveInstitution(): void {
    if (this.dialogHeader === 'Añadir Institución') {
      this.institutions.push(this.selectedInstitution);
    } else {
      const index = this.institutions.findIndex(
        (inst) => inst === this.selectedInstitution
      );
      if (index > -1) {
        this.institutions[index] = this.selectedInstitution;
      }
    }
    this.applyFilter();
    this.displayDialog = false;
  }

  cancelDialog(): void {
    this.displayDialog = false;
  }
}
