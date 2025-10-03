import { ChangeDetectorRef, Component, effect, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HomeService } from '../../services/home.service';
import { BehaviorSubject, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { UserInfo } from '../../interfaces/user-info.interface';
import { SearchUserInfo } from '../../interfaces/search-user-info.interface';
import { handleBackendErrorResponse, handleCloudinaryErrorResponse } from '../../handlers/errors-handlers';
import { MessagePopup } from '../../interfaces/message-popup.interface';
import { ConfirmDialogService } from '../../services/confirmDialog.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Notification } from '../../interfaces/user-notification.interface';
import { SafetyService } from '../../services/safety.service';
import { NotificationService } from '../../services/notification.service';
import { PostService } from '../../services/post.service';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { LikeService } from '../../services/like.service';

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

  //signal porque se actualizan datos desde otros componentes
  userNotifications:Notification[] = this.notisService.userNotifications_signal();
  notisNumber:number = 0;

  @ViewChild('addPostButton') addPostButton!:ElementRef;

  onSubmitPost(inputFile:HTMLInputElement){

    const addPostButton = this.addPostButton.nativeElement as HTMLButtonElement;

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

    this.userService.uploadImage(data)
    .subscribe({
      next: (image:any) => {
        const secure_url = image.secure_url;
        this.postForm.get('postImageUrl')?.setValue(secure_url);
        this.postForm.get('publicId')?.setValue(image.public_id);

        this.safetyService.showSafety();

        this.postService.addPost(this.postForm)
        .subscribe({
          next: resp => {
            this.toastr.success(resp.message);
            this.showAddPostForm = false;
            this.isLoadingPost = false;
            addPostButton.style.pointerEvents = 'all';
            this.deleteUploadedImage(inputFile);
            this.postForm.reset();
            this.postService.getAllUsersPosts();
            this.userService.getMyUserAndPosts();
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
    this.userService.getUserInfoForSidebar();
    this.userService.userInfoObservable$
    .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.userInfo = user;
        
        if(user.id !== 0) 
          this.initFirstHubConnection(user.id)

      }
    );
  }

  markNotificationsAsRead(){
    this.notificationService.markNotificationsAsRead() 
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: suc => {
        this.notificationService.getUserNotifications();
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

    this.userService.searchUser(this.searchKeywords)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: res => {
        this.searchUsersResponse = res;
      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    });

  }

  acceptFollowRequest(actorId:number, notificationId:number){

    this.notificationService.followUser(actorId)
    .subscribe({
      next: res => {

        const notification = this.userNotifications.find(n => n.id === notificationId)!;

        notification.status === 'Accepted';

        this.toastr.success(res.message);
      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    })

  }

  rejectFR(actorId:number){
    this.notificationService.rejectFR(actorId)
    .subscribe({
      next: _ => {
        
        const notificationIndex = this.userNotifications.findIndex(n => n.actorId === actorId && n.type === 'FollowRequest')!;

        this.userNotifications.splice(notificationIndex, 1);

      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    });
  }

  hideMessagePopup(pos:number){
    this.userNotificationsPopup.splice(pos, 1);
  }

  

  // * NOTIFICATIONS HUB CONFIG

  initFirstHubConnection(userId:number){
    this.homeService.startConnectionAfterLogIn(userId);
    this.homeService.setNotificationReceiver(this.onReceivedNotification.bind(this));
    this.homeService.setPopupNotificationReceiver(this.onReceivedAnyNotification.bind(this));
  }


  onReceivedNotification(notification:Notification){
    this.userNotifications.unshift(notification);
    console.log(notification);
    this.notisNumber++;
  }

  userNotificationsPopup:MessagePopup[] = [];

  onReceivedAnyNotification(notification:MessagePopup){
    console.log("llega notification")
    this.userNotificationsPopup.unshift(notification);
    this.setTimeOutToNotification();
  }

  markSingleNotificationAsRead(notificationId:number){

    this.homeService
    .isNotificationIconClicked = false; //Ocultar notificaciones

    const isAlreadyRead = this.checkNotification(notificationId);

    if (isAlreadyRead) return;

    this.notisService.markSingleNotificationAsRead(notificationId)
    .subscribe({
      next: _ => {

          const noti = this.userNotifications
          .find(n => n.id === notificationId)!;

          noti.isRead = true;

          this.notisNumber--;


      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    });
    
  }

  private checkNotification(notificationId:number): boolean{

    const notification = this.userNotifications.find(n => n.id === notificationId)!;

    return notification.isRead;

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
    private renderer:Renderer2,
    private safetyService:SafetyService,
    private cdr:ChangeDetectorRef,
    private notisService:NotificationService,
    private postService:PostService,
    private userService:UserService,
    private notificationService:NotificationService,
    public authService:AuthService){

    this.postForm = this.fb.group({
      postImageUrl: [null],
      description: [null, [Validators.required, Validators.maxLength(300)]],
      publicId: [null]
    });

    effect(() => {
      this.userNotifications = this.notisService.userNotifications_signal();
      const notificationsNumber = this.userNotifications.filter(n => !n.isRead).length;
      this.notisNumber = notificationsNumber;
    });

  };


  ngOnInit(): void {

    this.darkMode();
    this.getUserInfo();
    this.notificationService.getUserNotifications();
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
