import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class LikeService {

    likeReply(replyId:number, commentId:number, postId:number, likingToId:number):Observable<any>{
        return this.http.put(`${environment.likeUrl}/likeReply`, { replyId, commentId, postId, likingToId });
    }

    likeComment(commentId:number, postId:number, authorIdComment:number):Observable<any>{
        return this.http.put(`${environment.likeUrl}/likeComment`, { postId, commentId, authorIdComment });
    }
        
    constructor(private readonly http:HttpClient) { }
    
}