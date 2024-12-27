import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SidebarComponent } from "../shared/sidebar/sidebar.component";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ProfileComponent } from './profile/profile.component';
import { ChatsComponent } from './chats/chats.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { HomeRoutingModule } from "./home.routes";
import { MainContentComponent } from './main-content/main-content.component';
import { HomePageComponent } from './home-page/home-page.component';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SinglePostComponent } from './single-post/single-post.component';

@NgModule({
    declarations: [
                SidebarComponent, 
                ProfileComponent, 
                ChatsComponent,
                MyProfileComponent, 
                MainContentComponent,
                HomePageComponent,
                SinglePostComponent],
    imports: [CommonModule, 
            RouterOutlet, 
            RouterLink,
            HomeRoutingModule,
            ReactiveFormsModule,
            FormsModule],
    exports: []
})
export class HomeModule {}