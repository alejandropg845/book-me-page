import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Chat, ChatMessage } from '../interfaces/chat.interface';
import { ChatData } from '../interfaces/chat-data-preview.interface';
import { environment } from '../../environments/environment';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class ChatService {

  userChats = new BehaviorSubject<Chat[]>([]);

  getUserChats(keyword?:string) {
    if(!keyword) keyword = "%";
    
    this.http.get<Chat[]>(`${environment.chatUrl}?keyword=${keyword}`)
    .subscribe(chats => this.userChats.next(chats));
  }

  sendMessage(data:ChatData):Observable<any>{
    return this.http.post(`${environment.chatUrl}/sendMessage`, data);
  }

  async getChatMessages(chatId:string, num:number):Promise<ChatMessage[]>{
    return firstValueFrom(this.http.get<ChatMessage[]>(`${environment.chatUrl}/chatMessages/${chatId}?number=`+num));
  }

  setUserChatMessagesMarkedAsRead(chatId:string):Observable<Chat>{
    return this.http.put<Chat>(`${environment.chatUrl}/markChatMessages/${chatId}`,{});
  }

  sendMarkedAsReadChatMessages(chatMessages:ChatMessage[], otherUserId:number, chatId:string){
    return this.http.put(`${environment.chatUrl}/sendMarkedAsReadMessages`, 
    { chatMessages, otherUserId, chatId });
  }

  constructor(private readonly http:HttpClient) { }
    
}