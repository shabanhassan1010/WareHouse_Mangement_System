import { Routes } from '@angular/router';
import { AuthLayout } from './Layouts/auth-layout/auth-layout';
import { BlankLayout } from './Layouts/blank-layout/blank-layout';
import { NotFound } from './Components/not-found/not-found';
import { Login } from './Components/login/login';
import { Register } from './Components/register/register';
import { Home } from './Components/home/home';

export const routes: Routes = 
[
    {path:'' , component:AuthLayout , children:
    [
        {path:'' , redirectTo:'login' , pathMatch:'full'},
        {path:'login' ,    component:Login},
        {path:'register' , component:Register}        
    ]},

    {path:'', component:BlankLayout , children:
    [
        {path:'' , redirectTo:'home' , pathMatch:'full'},
        {path:'home' , component:Home},
    ]},

    {path:'**'   , component:NotFound}
];
