import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './auth/main/main.component';
import { MainContentComponent } from './home/main-content/main-content.component';
import { authGuard } from './guards/auth-guards/auth.guard';
import { homeGuard } from './guards/home-guards/home.guard';

const routes: Routes = [
  {
    path: 'bookme',
    component: MainComponent,
    canActivate: [authGuard],
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'bookmecontent',
    component: MainContentComponent,
    canActivate: [homeGuard],
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule)
  },
  {
    path: '**',
    redirectTo: 'bookme/auth'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
