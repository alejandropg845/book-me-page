import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ChatsComponent } from "./chats/chats.component";
import { MyProfileComponent } from "./my-profile/my-profile.component";

import { ProfileComponent } from "./profile/profile.component";
import { HomePageComponent } from "./home-page/home-page.component";
import { MainComponent } from "../auth/main/main.component";
import { SinglePostComponent } from "./single-post/single-post.component";
import { AdminComponent } from "./admin/admin.component";

export const routes:Routes = [
    {
        path: 'main-content',
        component: MainComponent,
        children: [
            {
                path: 'chats',
                component: ChatsComponent
            },
            {
                path: 'my-profile', 
                component: MyProfileComponent
            },
            {
                path: 'homepage',
                component: HomePageComponent
            },
            {
                path: 'profile/:id',
                component: ProfileComponent
            },
            {
                path: 'admin',
                component: AdminComponent
            },
            {
                path: 'single-post/:id',
                component: SinglePostComponent
            },
            {
                path: '**',
                redirectTo: 'homepage'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'main-content'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)]
})
export class HomeRoutingModule {}