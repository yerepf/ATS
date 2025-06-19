import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MainlayoutComponent } from './mainlayout/mainlayout.component';
import { AttendanceComponent } from './attendance/attendance.component';
import { NavbarComponent } from './navbar/navbar.component';
import { Router } from 'express';
import exp from 'constants';
import path from 'path';
import { StudentsComponent } from './students/students.component';
import { ExcusesComponent } from './excuses/excuses.component';
import { UsersComponent } from './users/users.component';
import { InstitutionsComponent } from './institutions/institutions.component';
import { DistrictsComponent } from './districts/districts.component';

export const routes: Routes = [
    {
        path: '', redirectTo: 'login', pathMatch: 'full'
    },
    {
        path: 'login', 
        component: LoginComponent
    },
    {
        path: 'dashboard', 
        component: MainlayoutComponent,
        children: [
            { path: '', component: DashboardComponent }
        ]
    },
    {
        path: 'attendance', 
        component: MainlayoutComponent,
        children: [
            { path: '', component: AttendanceComponent }
        ]
    },
    {
        path: 'students', 
        component: MainlayoutComponent,
        children: [
            { path: '', component: StudentsComponent }
        ]
    },
    {
        path: 'excuses', 
        component: MainlayoutComponent,
        children: [
            { path: '', component: ExcusesComponent }
        ]
    },
    {
        path: 'users', 
        component: MainlayoutComponent,
        children: [
            { path: '', component: UsersComponent }
        ]
    },
    {
        path: 'institutions', 
        component: MainlayoutComponent,
        children: [
            { path: '', component: InstitutionsComponent }
        ]
    },
    {
        path: 'districts', 
        component: MainlayoutComponent,
        children: [
            { path: '', component: DistrictsComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}