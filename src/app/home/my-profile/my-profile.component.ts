import { Component, effect, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { HomeService } from '../../services/home.service';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserAndPosts } from '../../interfaces/my-user-and-posts.interface';
import { EventEmitter } from 'node:stream';
import { handleBackendErrorResponse, handleCloudinaryErrorResponse } from '../../handlers/errors-handlers';
import { json } from 'stream/consumers';
import { SafetyService } from '../../services/safety.service';
import { SpinnerService } from '../../services/spinner.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnDestroy, OnInit{

  userInfo:UserAndPosts | null = this.userService.myProfileInfoSignal();
  destroy$ = new Subject<void>();
  isChangingPic:boolean = false;
  uploadedFile!:File;

  onSelectedImage(event:Event){

    const input = event.target as HTMLInputElement;
    
    const file = input.files![0];

    if (!this.authService.getToken){
      this.toastr.warning("You must be logged in to do this action");
      return;
    }

    if(!file){
      this.toastr.warning("You haven't selected any image");
      return;
    }

    if(!file.type.includes("image")) {
      this.toastr.error("This is not an image");
      return;
    }

    if(file.size > 5242880) {
      this.toastr.error("Size must be less than 5.2 MB");
      return;
    }

    this.isChangingPic = true;

    const formData = new FormData();

    this.uploadedFile = file;
    formData.append('file', this.uploadedFile);
    formData.append('upload_preset', 'bookMe_profilePics');


    this.userService.uploadProfilePic(formData)
    .subscribe({
      next: (cloudinaryInfo:any) => {
        this.safety.showSafety();
        this.userService.changeProfilePic(cloudinaryInfo.secure_url, cloudinaryInfo.public_id)
        .subscribe({
          next: resp => {
            this.toastr.success(resp.message);
            this.isChangingPic = false;
            this.userService.getMyUserAndPosts();
            this.userService.getUserInfoForSidebar();
            this.safety.hideSafety();
          },
          error: err => {
            handleBackendErrorResponse(err, this.toastr);
            this.isChangingPic = false;
            this.safety.hideSafety();
          }
        });
      },
      error: err => {
        this.isChangingPic = false;
        handleCloudinaryErrorResponse(err, this.toastr);
      }
    });

  }

  isDarkMode:boolean = false;

  toggleDarkMode(){
    this.isDarkMode = !this.isDarkMode

    if(this.isDarkMode){
      this.renderer.addClass(document.body, "darkmode");
      localStorage.setItem("darkmode", "darkmode");
    } else {
      this.renderer.removeClass(document.body, "darkmode");
      localStorage.removeItem("darkmode");
    }

  }

  verifyDarkmode(){

    const darkmode = localStorage.getItem("darkmode");

    if(darkmode !== null) {
      this.isDarkMode = true;
    } else {
      this.isDarkMode = false;
    }
  }

  hidePopups(){
    this.homeService.isNotificationIconClicked = false;
    this.homeService.isUserFromSearchClicked = true;
  }

  setFakeProfileInfo(){

    setTimeout(() => {
      this.userInfo = {
      user: {
          id: 0,
          imageUrl: "",
          status: 'online',
          username: 'guest'
        },
        userPosts: []
      }
    }, 0);

  }

  constructor(private homeService:HomeService, 
              private toastr:ToastrService, 
              private renderer:Renderer2,
              private safety:SafetyService,
              private spinner:SpinnerService,
              private userService:UserService,
              private authService:AuthService) { 

    effect(() => {
      this.userInfo = this.userService.myProfileInfoSignal();
    });

  }

  ngOnInit(): void {
    if(this.authService.getToken) {
      this.spinner.isOtherThingLoading.set(true);
      this.userService.getMyUserAndPosts();
      this.verifyDarkmode();
    } else this.setFakeProfileInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
