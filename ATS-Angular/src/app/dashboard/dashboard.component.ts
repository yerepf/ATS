import { AuthServiceService } from '../services/auth-service.service';
import { CommonModule } from '@angular/common';
import { ChartComponent } from "../chart/chart.component";
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  constructor(public authService: AuthServiceService) {}

  public userName: string = 'Usuario';

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.userName = localStorage.getItem('username') || 'Usuario';
    }
  }

  public totalAttendance = 70;
  public totalAbsences = 20;
  public AmountExcuses = 10;

  onItemClick(itemId: number) {
    console.log(`Item ${itemId} clicked`);
  }

}
