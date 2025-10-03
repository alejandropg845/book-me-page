import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Comment } from '../interfaces/post.interface';

@Injectable({providedIn: 'root'})
export class CommentService {

    deleteComment(commentId:number, postId:number): Observable<any> {
        return this.http.put(`${environment.commentUrl}/deleteComment/${commentId}?postId=${postId}`, {});
    }

      
    getPostComments(postId:number, num?:number):Observable<any>{
        if(!num) num = 0;
        return this.http.get(`${environment.commentUrl}/postComments/${postId}?number=${num}`)
    }

    
    addComment(postId:number, content:string, postUserId:number):Observable<any>{
        return this.http.post<Comment>(`${environment.commentUrl}/${postId}`, { content, postUserId });
    }
    
    constructor(private readonly http:HttpClient) { }
    
}