import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MainComponent } from "./main/main.component";
import { LoginComponent } from "./login/login.component";
import { RegisterComponent } from "./register/register.component";
import { AdminComponent } from "../home/admin/admin.component";

export const routes:Routes = [
    {
        path: 'auth',
        component: MainComponent,
        children: [
            {
                path: 'login',
                component: LoginComponent
            },
            {
                path: 'register',
                component: RegisterComponent
            },
            {
                path: '**',
                redirectTo: 'login'
            }
        ],
    },
    {
        path: '**',
        redirectTo: 'auth'
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)]
})
export class AuthRoutingModule{}