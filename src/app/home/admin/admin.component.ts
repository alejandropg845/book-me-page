import { Component, OnDestroy, OnInit } from '@angular/core';
import { HomeService } from '../../services/home.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { PasswordService } from '../../services/password.service';
import { handleBackendErrorResponse } from '../../handlers/errors-handlers';
import { Router } from '@angular/router';
import { ConfirmDialogService } from '../../services/confirmDialog.service';
import { PostService } from '../../services/post.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy{

  authorized:boolean = false;
  destroy$ = new Subject<void>();
  posts!:{id: number,
          postImageUrl: string,
          description: string}[];
  users!:{id:number, username:string}[];
  deletedPosts!:{postImageUrl:string, description:string}[];
  disabledUsers!:string[];

  async onSubmitPassword(){

    const value = await firstValueFrom(this.dialog.openDialog());

    if(value) {
      
      this.homeService.submitPassword(value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: _ => {
          this.getPosts();
          this.getUsers();
          this.getDeletedPosts();
          this.getDisabledUsers();
          this.authorized = true;
        },
        error: err => {
          handleBackendErrorResponse(err, this.toastr);
          this.router.navigate(["/bookmecontent/main-content/homepage"]);
        }
      })
    }


  }

  getPosts(){
    this.postService.getPosts()
    .pipe(takeUntil(this.destroy$))
    .subscribe(posts => this.posts = posts);
  }

  getUsers(){
    this.homeService.getUsers()
    .pipe(takeUntil(this.destroy$))
    .subscribe(users => this.users = users);
  }

  getDeletedPosts(){
    this.postService.getDeletedPosts()
    .pipe(takeUntil(this.destroy$))
    .subscribe(posts => this.deletedPosts = posts);
  }

  getDisabledUsers(){
    this.homeService.getDisabledUsers()
    .pipe(takeUntil(this.destroy$))
    .subscribe(users => this.disabledUsers = users);
  }

  async deletePost(postId:number){

    const isConfirmed = await firstValueFrom(this.confirmDialog.openDialog());

    if(isConfirmed) {

      this.homeService.deletePostAdmin(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          this.toastr.success(r.message);
          this.getDeletedPosts();
          this.getPosts();
        },
        error: err => handleBackendErrorResponse(err, this.toastr)
      });

    }

  }

  async disableUser(userId:number){

    const isConfirmed = await firstValueFrom(this.confirmDialog.openDialog());

    if(isConfirmed) {
      
      this.homeService.disableUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          this.toastr.success(r.message);
          this.getDisabledUsers();
          this.getUsers();
        },
        error: err => handleBackendErrorResponse(err, this.toastr)
      });
      
    }

    
  }

  constructor(private homeService:HomeService, 
    private toastr:ToastrService, 
    private dialog:PasswordService,
    private router:Router,
    private confirmDialog:ConfirmDialogService,
    private postService:PostService){}

  ngOnInit(): void {
    this.onSubmitPassword();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
