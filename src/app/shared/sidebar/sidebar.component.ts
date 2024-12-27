import { ChangeDetectorRef, Component, effect, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HomeService } from '../../home/home.service';
import { BehaviorSubject, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { UserInfo } from '../../interfaces/user-info.interface';
import { SearchUserInfo } from '../../interfaces/search-user-info.interface';
import { handleBackendErrorResponse, handleCloudinaryErrorResponse } from '../../handlers/errors-handlers';
import { UserNotifications } from '../../interfaces/user-notifications.interface';
import { MessagePopup } from '../../interfaces/message-popup.interface';
import { ConfirmDialogService } from '../confirmDialog.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { FollowRequestNotification } from '../../interfaces/followrequest-notification.interface';
import { UserNotification } from '../../interfaces/user-notification.interface';
import { SafetyService } from '../safety.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [   
        style({ opacity: 0 }),
        animate('150ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [   
        animate('150ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class SidebarComponent implements OnInit, OnDestroy{

  showAddPostForm:boolean = false;
  count:number = 0;
  uploadedFile!:File | null;
  userInfo:UserInfo = ({id:0,imageUrl:'',status:'',username:''});
  destroy$ = new Subject<void>();
  postForm:FormGroup;
  searchUsersResponse: SearchUserInfo[] = [];
  searchKeywords:string = "";
  anyNotifications:any[] = [];
  isLoadingPost:boolean = false;
  //Es un signal porque se actualizan datos desde otros componentes
  userNotifications:UserNotifications
  | null = this.homeService.userNotifications_signal();

  

  onSubmitPost(inputFile:HTMLInputElement){

    const addPostButton = document.getElementById('add-post-button')!;

    if(!this.uploadedFile) {
      this.toastr.warning("You forgot to upload an image");
      return;
    }
    
    if(!this.postForm.valid){
      this.toastr.warning("Please add a description");
      return;
    }
    addPostButton.style.pointerEvents = 'none';

    this.isLoadingPost = true;

    const data = new FormData();
    data.append('file', this.uploadedFile);
    data.append('upload_preset', 'bookMe_info');

    this.homeService.uploadImage(data)
    .subscribe({
      next: (image:any) => {
        const secure_url = image.secure_url;
        this.postForm.get('postImageUrl')?.setValue(secure_url);
        this.postForm.get('publicId')?.setValue(image.public_id);

        this.safetyService.showSafety();

        this.homeService.addPost(this.postForm)
        .subscribe({
          next: resp => {
            this.toastr.success(resp.message);
            this.showAddPostForm = false;
            this.isLoadingPost = false;
            addPostButton.style.pointerEvents = 'all';
            this.deleteUploadedImage(inputFile);
            this.postForm.reset();
            this.homeService.getAllUsersPosts();
            this.homeService.getMyUserAndPosts();
            this.safetyService.hideSafety();
          },
          error: err => {
            handleBackendErrorResponse(err, this.toastr);
            this.isLoadingPost = false;
            addPostButton.style.pointerEvents = 'all';
            this.safetyService.hideSafety();
          }
        })
      },
      error: err => {
        handleCloudinaryErrorResponse(err, this.toastr);
        this.isLoadingPost = false;
        addPostButton.style.pointerEvents = 'all';
        
      }
    });
  }

  onSelectedImage(event:Event){
    const e = event.target as HTMLInputElement;
    const file = e.files![0];

    if(file?.size>5242880){
      this.toastr.error('Image size must be less than 5MB');
      return;
    }

    if(!file?.type.includes('image')){
      this.toastr.error('That\'s not an image', 'File format error');
      return;
    }

    this.uploadedFile = file;
  }

  getUserInfo(){
    this.homeService.getUserInfoForSidebar();
    this.homeService.userInfoObservable$
    .pipe(takeUntil(this.destroy$))
    .subscribe(user => {
      this.userInfo = user;
      if(user.id !== 0) {
        this.initFirstHubConnection(user.id);
      }
      }
    );
  }

  markNotificationsAsRead(){
    this.homeService.markNotificationsAsRead() 
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: suc => {
        this.homeService.getUserNotifications();
      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    })
  }

  hidePopups(){
    this.homeService.isUserFromSearchClicked = true; 
    this.homeService.isNotificationIconClicked = false
  }

  searchUser(){

    if(!this.searchKeywords) {
      return;
    }

    this.searchUsersResponse = [];

    this.homeService.searchUser(this.searchKeywords)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: res => {
        this.searchUsersResponse = res;
      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    });

  }

  async respondToFollowRequest(isA:boolean, isR:boolean, senderId:number):Promise<void>{

    const isConfirmed = await firstValueFrom(this.confirmDialogService.openDialog());

    if(isConfirmed){
      this.homeService.respondToUserFollowRequest(senderId.toString(), isA, isR)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          
          if(!isR) this.toastr.success(res.message, "This user was accepted");
            else
          this.toastr.success(res.message, "This user was rejected");

          this.homeService.getUserNotifications();
          this.homeService.getUserChats();
          this.homeService.getUserAndPosts(senderId);
        },
        error: err => {
          handleBackendErrorResponse(err, this.toastr);
        }
      });
    }

  }

  hideMessagePopup(pos:number){
    this.userNotificationsPopup.splice(pos, 1);
  }

  

  // * NOTIFICATIONS HUB CONFIG

  initFirstHubConnection(userId:number){
    this.homeService.startConnectionAfterLogIn(userId);
    this.homeService.setFRNotificationReceiver(this.onReceivedFRNotification.bind(this));
    this.homeService.setNotificationReceiver(this.onReceivedNotification.bind(this));
    this.homeService.setPopupNotificationReceiver(this.onReceivedAnyNotification.bind(this));
  }

  onReceivedFRNotification(FRNotification:FollowRequestNotification){
    this.userNotifications?.followRequests.unshift(FRNotification);
    this.userNotifications!.notificationsNumber++;
  }

  onReceivedNotification(notification:UserNotification){
    this.userNotifications?.notifications.unshift(notification);
    this.userNotifications!.notificationsNumber++;
  }

  userNotificationsPopup:MessagePopup[] = [];

  onReceivedAnyNotification(notification:MessagePopup){
    
    this.userNotificationsPopup.unshift(notification);
    this.setTimeOutToNotification();
  }

  markSingleNotificationAsRead(notificationId:number, keyword:string){

    if(!keyword){
      this.toastr.error("Error, please try again");
      return;
    }

    this.homeService
    .isNotificationIconClicked = false; //Ocultar notificaciones

    this.homeService.markSingleNotificationAsRead(notificationId, keyword)
    .subscribe({
      next: _ => {

        if(keyword === "n") {
          
          const noti = this.userNotifications!.notifications
          .find(n => n.id === notificationId)!;

          noti.isMarkedAsRead = true;

          this.userNotifications!.notificationsNumber--;

        } else {

          const noti = this.userNotifications!.followRequests
          .find(f => f.id === notificationId)!;

          noti.isNotificationOpen = true;
          this.userNotifications!.notificationsNumber--;

        }

      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    });
    
  }

  @ViewChild('divNotification') divNotification!:ElementRef;

  setTimeOutToNotification(){


    setTimeout(() => {
      
      this.cdr.detectChanges();

      const div = this.divNotification.nativeElement;
      
      setTimeout(() => {
        
      div?.classList.add('hide');

      }, 3000);

    }, 0);
    
      
  }

  darkMode(){
    
    const darkMode = localStorage.getItem("darkmode");

    if(darkMode !== null){
      this.renderer.addClass(document.body, "darkmode");
    } else {
      this.renderer.removeClass(document.body, "darkmode");
    }
  }


  constructor(private toastr:ToastrService, 
    private fb:FormBuilder, 
    public homeService:HomeService,
    private confirmDialogService:ConfirmDialogService,
    private renderer:Renderer2,
    private safetyService:SafetyService,
    private cdr:ChangeDetectorRef){

    this.postForm = this.fb.group({
      postImageUrl: [null],
      description: [null, [Validators.required, Validators.maxLength(300)]],
      publicId: [null]
    });

    effect(() => {
      this.userNotifications = this.homeService.userNotifications_signal();
    });
  };


  ngOnInit(): void {
    this.darkMode();
    this.getUserInfo();
    this.homeService.getUserNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  // * METHODS THAT MANIPULATE DOM 👇

  countCharacters(parameter:HTMLTextAreaElement, paragraph:HTMLParagraphElement) {
    let textarea = parameter.value.length;
    this.count = textarea;
    
    if(this.count >= 300) {
      paragraph.classList.add('red-color');
      this.count = 300;
      return;
    } else {
      paragraph.classList.remove('red-color');
    }

  }
  addToDropzone(file:File){

    if(file.size>5242880){
      this.toastr.error('Image size must be less than 5MB');
      return;
    }

    if(!file.type.includes('image')){
      this.toastr.error('That\'s not an image', 'File format error');
      return;
    }

    this.uploadedFile = file;
    
  }

  setValueToSrcAttribute(img:HTMLImageElement){
    const url = URL.createObjectURL(this.uploadedFile!);
    img.setAttribute('src', url);
  }
  
  deleteUploadedImage(inputFileType:HTMLInputElement){
    this.uploadedFile = null;
    inputFileType.value = '';
  }

  onDropFiles(event:DragEvent){
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files[0];
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.remove('background-drag-over');
    dropzone.textContent = 'Image was deleted. Select a new one';
    dropzone.classList.add('background-image-deleted');
    this.addToDropzone(file!);
  }

  onDragLeave(event:DragEvent){
    event.preventDefault();
    event.stopPropagation();
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.add('background-drag-leave');
    dropzone.classList.remove('background-drag-over');
    dropzone.classList.remove('background-image-deleted');
    dropzone.textContent = 'Your image is out of range';
  }

  onDragOver(event:DragEvent){
    event.preventDefault();
    event.stopPropagation();
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.add('background-drag-over');
    dropzone.classList.remove('background-drag-leave');
    dropzone.classList.remove('background-image-deleted');
    dropzone.textContent = 'Drop your selected image here';
  }

  hideUserFromList(user:HTMLDivElement){
    user.classList.remove('shown');
    user.classList.add('hidden');
  }

}
