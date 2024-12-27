import { Component, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HomeService } from '../home.service';
import { firstValueFrom, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { OtherUserAndPosts } from '../../interfaces/other-user-and-posts.interface';
import { handleBackendErrorResponse } from '../../handlers/errors-handlers';
import { UserLikedPosts } from '../../interfaces/user-liked-posts-interface';
import { ConfirmDialogService } from '../../shared/confirmDialog.service';
import { SpinnerService } from '../../shared/spinner.service';

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
        this.homeService.getUserAndPosts(id);
        return this.homeService.userAndPostsSubject.asObservable();
      }
      ),
      takeUntil(this.destroy$)
    )
    .subscribe(thisUserProfile => {
      this.thisUserProfile = thisUserProfile;
      this.isLoadingInfo = false;

    });
  }

  getUsernameFromSidebar(){
    this.homeService.userInfoObservable$
    .pipe(switchMap((({username}) => this.username = username)))
    .subscribe();
  }

  sendFollowRequest(userReceiverId:number){
    this.isSendingFR = true;
    this.homeService.followUser(userReceiverId)
    .subscribe({
      next: res => {
        this.toastr.success(res.message);
        this.homeService.getUserNotifications();
        this.loadUserInfo();
        this.homeService.getUserChats();
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

    if(isConfirmed) {
      this.isBlocking = true;
      this.homeService.blockUser(otherUserId)
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
    private homeService:HomeService, 
    private toastr:ToastrService,
    private confirmDialogService:ConfirmDialogService,
    private spinner:SpinnerService){}

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
