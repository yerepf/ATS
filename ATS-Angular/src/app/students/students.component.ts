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

@Component({
  selector: 'app-students',
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
  ],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css'],
})
export class StudentsComponent implements OnInit {
  students: any[] = [];
  filteredStudents: any[] = [];
  filterOptions = [
    { name: 'Nombre', value: 'FirstName' },
    { name: 'Apellido', value: 'LastName' },
    { name: 'Estado', value: 'Status' },
  ];

  selectedFilter: string = '';
  filterText: string = '';
  selectedStatus: string = '';
  statusOptions = [
    { label: 'Activo', value: 'Active' },
    { label: 'Inactivo', value: 'Inactive' },
  ];

  selectedStudent: any = {
    FirstName: '',
    LastName: '',
    Gender: '',
    GroupName: '',
    Status: '',
  };

  genderOptions = [
    { label: 'Masculino', value: 'Male' },
    { label: 'Femenino', value: 'Female' },
  ]

  displayDialog: boolean = false;
  dialogHeader: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('authToken');
    }
    if (token) {
      this.http
        .get<any>('https://backendsas.onrender.com/api/students/students-with-groups', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .subscribe({
          next: (response) => {
            this.students = response.students;
            this.filteredStudents = [...this.students];
          },
          error: (error) => {
            console.error('Error fetching students:', error);
          },
        });
    } else {
      console.error('No token found in localStorage.');
    }
  }

  applyFilter(): void {
    if (this.selectedFilter === 'Status' && this.selectedStatus) {
      this.filteredStudents = this.students.filter(
        (student) =>
          student.Status?.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    } else if (this.selectedFilter && this.filterText) {
      this.filteredStudents = this.students.filter((student) =>
        student[this.selectedFilter]
          ?.toLowerCase()
          .includes(this.filterText.toLowerCase())
      );
    } else {
      this.filteredStudents = [...this.students];
    }
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  showAddStudentDialog(): void {
    this.dialogHeader = 'Añadir Estudiante';
    this.selectedStudent = {
      FirstName: '',
      LastName: '',
      Gender: '',
      GroupName: '',
      Status: '',
    };
    this.displayDialog = true;
  }

  editStudent(student: any): void {
    this.dialogHeader = 'Editar Estudiante';
    this.selectedStudent = { ...student };
    this.displayDialog = true;
  }

  deleteStudent(student: any): void {
    const index = this.students.indexOf(student);
    if (index > -1) {
      this.students.splice(index, 1);
      this.applyFilter();
    }
  }

  saveStudent(): void {
    if (this.dialogHeader === 'Añadir Estudiante') {
      this.students.push({ ...this.selectedStudent, Status: 'Active' });
    } else {
      const index = this.students.findIndex(
        (std) => std.StudentID === this.selectedStudent.StudentID
      );
      if (index > -1) {
        this.students[index] = this.selectedStudent;
      }
    }
    this.applyFilter();
    this.displayDialog = false;
  }

  cancelDialog(): void {
    this.displayDialog = false;
  }
}
