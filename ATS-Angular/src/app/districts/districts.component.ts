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
  selector: 'app-districts',
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
  templateUrl: './districts.component.html',
  styleUrls: ['./districts.component.css'],
})
export class DistrictsComponent implements OnInit {
  districts: any[] = [];
  filteredDistricts: any[] = [];
  filterOptions = [
    { name: 'Nombre', value: 'Name' },
    { name: 'Región', value: 'Region' },
    { name: 'Estado', value: 'Status' },
  ];

  selectedStatus: string = '';

  applyFilter(): void {
    if (this.selectedFilter === 'Estado' && this.selectedStatus) {
      this.filteredDistricts = this.districts.filter(
        (district) =>
          district.Status?.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    } else if (this.selectedFilter && this.filterText) {
      this.filteredDistricts = this.districts.filter((district) =>
        district[this.selectedFilter]
          ?.toLowerCase()
          .includes(this.filterText.toLowerCase())
      );
    } else {
      this.filteredDistricts = [...this.districts];
    }
  }

  selectedDistrict: any = {
    Name: '',
    Region: '',
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.http
        .get<{ districts: any[] }>(
          'https://backendsas.onrender.com/api/districts',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .subscribe({
          next: (response) => {
            this.districts = response.districts;
            this.filteredDistricts = [...this.districts];
            console.log('Distritos obtenidos:', this.districts);
          },
          error: (error) => {
            console.error('Error al obtener distritos:', error);
          },
        });
    } else {
      console.error('No se encontró token en localStorage.');
    }
  }

  onFilterChange(event: any): void {
    this.applyFilter();
  }

  showAddDistrictDialog(): void {
    this.dialogHeader = 'Añadir Distrito';
    this.selectedDistrict = { Name: '', Region: '', Status: '' };
    this.displayDialog = true;
  }

  editDistrict(district: any): void {
    this.dialogHeader = 'Editar Distrito';
    this.selectedDistrict = { ...district };
    this.displayDialog = true;
  }

  deleteDistrict(district: any): void {
    const index = this.districts.indexOf(district);
    if (index > -1) {
      this.districts.splice(index, 1);
      this.applyFilter();
    }
  }

  saveDistrict(): void {
    if (this.dialogHeader === 'Añadir Distrito') {
      this.districts.push(this.selectedDistrict);
    } else {
      const index = this.districts.findIndex(
        (dist) => dist === this.selectedDistrict
      );
      if (index > -1) {
        this.districts[index] = this.selectedDistrict;
      }
    }
    this.applyFilter();
    this.displayDialog = false;
  }

  cancelDialog(): void {
    this.displayDialog = false;
  }
}
