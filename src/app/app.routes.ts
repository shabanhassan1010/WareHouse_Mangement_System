import { Routes } from '@angular/router';
import { AuthLayout } from './Layouts/auth-layout/auth-layout';
import { BlankLayout } from './Layouts/blank-layout/blank-layout';
import { NotFound } from './Components/not-found/not-found';
import { Home } from './Components/home/home';
import { LoginComponent } from './Components/login/login';
import { Warehouses } from './Components/warehouses/warehouses';
import { OrderDetails } from './Components/order-details/order-details';
import { Profile } from './Components/profile/profile';
import { MedicinesComponent } from './Components/medicines/medicines';
import { authGuard } from './Core/Guards/auth-guard';



export const routes: Routes = 
[
    {path:'' , component:AuthLayout , children:
    [
        {path:'' , redirectTo:'login' , pathMatch:'full'},
        {path:'login' , component:LoginComponent},
    ]},

    {path:'dashboard', component:BlankLayout , 
        canActivate: [authGuard],
        children:
    [
        {path:'' , redirectTo:'home' , pathMatch:'full'},
        {path:'home' , component:Home},
        {path:'warehouses' , component:Warehouses},
        {path:'order-details/:id' , component:OrderDetails},
        {path:'profile', component:Profile},
        { path: 'medicines', component: MedicinesComponent },
        {
          path: 'medicines/edit/:medicineId',
          loadComponent: () => import('./Components/medicines/medicine-edit-form/medicine-edit-form').then(m => m.MedicineEditFormComponent)
        },
    ]},

    {path:'**'   , component:NotFound}
];
