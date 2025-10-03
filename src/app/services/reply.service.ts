import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommentReply } from '../interfaces/commentreply.interface';
import { Observable } from 'rxjs';
import { InterfaceData } from '../interfaces/interface-data.interface';
import { environment } from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class ReplyService {

    
    deleteReply(commentId:number, replyId:number): Observable<any> {
        return this.http.put(`${environment.replyUrl}/deleteReply`, { commentId, replyId });
    }
    
    getCommentReplies(commentId:number, num?:number):Observable<CommentReply[]>{
        return this.http.get<CommentReply[]>(`${environment.replyUrl}/commentReplies/${commentId}?number=`+num);
    }


    replyToComment(data:InterfaceData):Observable<any>{
        return this.http.post(`${environment.replyUrl}/replyToComment`, data)
    }

    constructor(private readonly http:HttpClient) { }
    
}