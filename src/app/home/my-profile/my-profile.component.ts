import { Component, effect, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { HomeService } from '../home.service';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserAndPosts } from '../../interfaces/my-user-and-posts.interface';
import { EventEmitter } from 'node:stream';
import { handleBackendErrorResponse, handleCloudinaryErrorResponse } from '../../handlers/errors-handlers';
import { json } from 'stream/consumers';
import { SafetyService } from '../../shared/safety.service';
import { SpinnerService } from '../../shared/spinner.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnDestroy, OnInit{

  userInfo:UserAndPosts | null = this.homeService.myProfileInfoSignal();
  destroy$ = new Subject<void>();
  isChangingPic:boolean = false;
  uploadedFile!:File;

  onSelectedImage(event:Event){

    const input = event.target as HTMLInputElement;
    
    const file = input.files![0];

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


    this.homeService.uploadProfilePic(formData)
    .subscribe({
      next: (cloudinaryInfo:any) => {
        this.safety.showSafety();
        this.homeService.changeProfilePic(cloudinaryInfo.secure_url, cloudinaryInfo.public_id)
        .subscribe({
          next: resp => {
            this.toastr.success(resp.message);
            this.isChangingPic = false;
            this.homeService.getMyUserAndPosts();
            this.homeService.getUserInfoForSidebar();
          },
          error: err => {
            handleBackendErrorResponse(err, this.toastr);
            this.isChangingPic = false;
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

  constructor(private homeService:HomeService, 
              private toastr:ToastrService, 
              private renderer:Renderer2,
              private safety:SafetyService,
              private spinner:SpinnerService) { 

    effect(() => {
      this.userInfo = this.homeService.myProfileInfoSignal();
    });

  }

  ngOnInit(): void {
    this.spinner.isOtherThingLoading.set(true);
    this.homeService.getMyUserAndPosts();
    this.verifyDarkmode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
