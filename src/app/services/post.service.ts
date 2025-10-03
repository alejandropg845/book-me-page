import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, takeUntil } from 'rxjs';
import { Post } from '../interfaces/post.interface';
import { FormGroup } from '@angular/forms';
import { environment } from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class PostService {

    getPosts() {
        return this.http.get<{id:number, postImageUrl:string, description:string}[]>(`${environment.admin}/postsAdmin`);
    }
    getDeletedPosts(){
        return this.http.get<{postImageUrl:string, description:string}[]>(`${environment.admin}/deletedPostsAdmin`);
    }
      
    
    likePost(postId:number, postUserId:number):Observable<any>{
        return this.http.put<any>(`${environment.postUrl}/likePost`, 
        { postId, postUserId });
    }
    
    
    singlePostSubject = new BehaviorSubject<Post | null>(null);
    
    getSinglePost(postId:number){
    this.http.get<Post>(`${environment.postUrl}/post/${postId}`)
    .subscribe(post => this.singlePostSubject.next(post));
    }
    

    deletePost(postId:number):Observable<any>{
        return this.http.delete(`${environment.postUrl}/${postId}`);
    } 

    postsSubject = new BehaviorSubject<Post[]>([]);
    postsObservable$ = this.postsSubject.asObservable();
    
    getAllUsersPosts(){
    this.http.get<Post[]>(environment.postUrl)
    .subscribe(posts => this.postsSubject.next(posts));
    }

    addPost(data:FormGroup):Observable<any>{
    return this.http.post(environment.postUrl, data.value);
    }

    constructor(private readonly http:HttpClient) { }
    
}