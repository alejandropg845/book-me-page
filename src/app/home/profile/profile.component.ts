import { Component, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HomeService } from '../../services/home.service';
import { firstValueFrom, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { OtherUserAndPosts } from '../../interfaces/other-user-and-posts.interface';
import { handleBackendErrorResponse } from '../../handlers/errors-handlers';
import { UserLikedPosts } from '../../interfaces/user-liked-posts-interface';
import { ConfirmDialogService } from '../../services/confirmDialog.service';
import { SpinnerService } from '../../services/spinner.service';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy{

  thisUserProfile!:OtherUserAndPosts | null;
  destroy$ = new Subject<void>();
  username!:string;;
  userSentFollowRequest:boolean | null = null;
  isSendingFR:boolean = false;
  isBlocking:boolean = false;
  isLoadingInfo:boolean = false;

  loadUserInfo(){
    this.isLoadingInfo = true;
    this.activatedRoute.params
    .pipe(
      switchMap(({id}) => {
        this.userService.getUserAndPosts(id);
        return this.userService.userAndPostsSubject.asObservable();
      }
      ),
      takeUntil(this.destroy$)
    )
    .subscribe(thisUserProfile => {
      this.thisUserProfile = thisUserProfile;
      this.isLoadingInfo = false;
      console.log(thisUserProfile);
    });
  }

  getUsernameFromSidebar(){
    this.userService.userInfoObservable$
    .pipe(switchMap((({username}) => this.username = username)))
    .subscribe();
  }

  sendFollowRequest(userReceiverId:number){
    this.isSendingFR = true;
    this.notificationService.followUser(userReceiverId)
    .subscribe({
      next: res => {
        this.toastr.success(res.message);
        this.notificationService.getUserNotifications();
        this.loadUserInfo();
        this.chatService.getUserChats();
        this.isSendingFR = false;
      },
      error: err => {
        handleBackendErrorResponse(err, this.toastr);
        this.isSendingFR = false;
      }
    });
  }

  async blockUser(otherUserId:number):Promise<void>{
    
    const isConfirmed = await firstValueFrom(this.confirmDialogService.openDialog());

    if (isConfirmed) {
      this.isBlocking = true;
      this.userService.blockUser(otherUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.toastr.success(res.message)
          this.loadUserInfo();
          this.isBlocking = false;
        },
        error: err => {
          handleBackendErrorResponse(err, this.toastr);
          this.isBlocking = false;
        }
      });
    }
  }
  
  constructor(private activatedRoute:ActivatedRoute,
    private toastr:ToastrService,
    private confirmDialogService:ConfirmDialogService,
    private userService:UserService,
    private notificationService:NotificationService,
    private chatService:ChatService){}

  ngOnInit(): void {
    this.loadUserInfo();
    this.getUsernameFromSidebar();
    window.scrollTo({
      top: 0
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
