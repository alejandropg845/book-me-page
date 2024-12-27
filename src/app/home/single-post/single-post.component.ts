import { Component, effect, OnDestroy, OnInit } from '@angular/core';
import { HomeService } from '../home.service';
import { Post } from '../../interfaces/post.interface';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { handleBackendErrorResponse } from '../../handlers/errors-handlers';
import { ToastrService } from 'ngx-toastr';
import { UserLikedPosts } from '../../interfaces/user-liked-posts-interface';
import { LocationStrategy } from '@angular/common';

@Component({
  selector: 'app-single-post',
  templateUrl: './single-post.component.html',
  styles: ``
})
export class SinglePostComponent implements OnInit, OnDestroy{

  singlePost!:Post | null;
  destroy$ = new Subject<void>();

  getSinglePost(){
    this.activatedRoute.params
    .pipe
    ( 
      switchMap((({id}) => {
        this.homeService.getSinglePost(id)
        return this.homeService.singlePostSubject.asObservable();
      })),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: post => {
        this.singlePost = post;
      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    });
  }
 

  constructor(private homeService:HomeService, 
    private activatedRoute:ActivatedRoute, 
    private toastr:ToastrService,
    private locationStrategy:LocationStrategy){}

  ngOnInit(): void {
    this.getSinglePost();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
