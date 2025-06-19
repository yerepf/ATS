import { Component } from '@angular/core';
import { NgModule } from '@angular/core'; // <-- This line is likely the problem
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-attendance',
  standalone: true, // <-- This tells us it's a standalone component
  imports: [CommonModule, ButtonModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})

export class AttendanceComponent { // <-- The error points to 'export' here
  constructor() {}

}