import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Chat, ChatMessage } from '../interfaces/chat.interface';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { MessagePopup } from '../interfaces/message-popup.interface';
import { Router } from '@angular/router';
import { Notification } from '../interfaces/user-notification.interface';
import { SpinnerService } from './spinner.service';
import { NotificationService } from './notification.service';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class HomeService implements OnDestroy{

  token!: string | null;
  hubConnection!:HubConnection;
  isNotificationIconClicked:boolean = false;
  isUserFromSearchClicked:boolean = false;
  showPreview:boolean = false;
  destroy$ = new Subject<void>();

  logOut(){
    this.token = null;
    localStorage.removeItem('bmt');
    this.router.navigate(["/bookme/auth/login"]);
  }

  // * HUB FIRST CONNECTION CONFIG

  firstConnection!:HubConnection;

  startConnectionAfterLogIn(userId:number){
    
    this.spinner.isOtherThingLoading.set(true);

    this.firstConnection = new HubConnectionBuilder()
    .withUrl(`${environment.hubUrl}/hub-notification?userId=`+userId.toString(), {logger: LogLevel.None})
    .withAutomaticReconnect()
    .build();

    this.firstConnection.onreconnected(() => {
      this.notisService.getUserNotifications();
    });

    this.firstConnection.start()
    .then(() => {
      this.spinner.isOtherThingLoading.set(false);
    })
    .catch(err => {
      this.spinner.isOtherThingLoading.set(false);
    });

  }


  //Mostrar en notificaciones cualquier otra notificacion que no sea FR
  setNotificationReceiver(callback: (notification:Notification) => void) {
    this.firstConnection.on("ReceivedNotification", callback);
  }

  //Mostrar los mensajes en popup
  setPopupNotificationReceiver(callback: (notification: MessagePopup) => void) {
    this.firstConnection.on("ReceivedAnyNotification", callback);
  }


  //* USER CHATS HUB CONFIG

  hubUserChats!:HubConnection;

  startUserChatsConnection(userId:number){
  
    this.hubUserChats = new HubConnectionBuilder()
    .withUrl(`${environment.hubUrl}/userChats-hub?userId=${userId}`,  { logger: LogLevel.None })
    .withAutomaticReconnect()
    .build();

    this.hubUserChats.onreconnected(() => {
      this.chatService.getUserChats();
    });

    this.hubUserChats.start()
    .then()
    .catch(err => console.log(err));
  }

  setUserChatsReceiver(callback: (userChat:Chat) => void){
    this.hubUserChats.on("ReceivedUserChat", callback);
  }

  setUserMessageChatsReceiver(callback: (message:ChatMessage) => void){
    this.hubUserChats.on("ReceivedMessage", callback);
  }

  userOpensChatPreview(userId:number, chatId:string){
    this.hubUserChats.invoke("OnOpenChat", userId, chatId);
  }

  userClosesChatPreview(userId:number, chatId:string){
    this.hubUserChats.invoke("OnCloseChat", userId, chatId);
  }

  setMarkedAsReadUserMessages(callback: (chatMessages:ChatMessage[]) => void) {
    this.hubUserChats.on("ReceivedUpdatedMessages", callback);
  }

  typingMessage(userId:string, otherUserId:string, message:string){
    this.hubUserChats.invoke("OnTypingMessage", parseInt(userId), parseInt(otherUserId), message);
  }

  setTypingMessageReceiver(callback: (otherUserId:number, typing:boolean) => void) {
    this.hubUserChats.on("ReceiveOnTypingMessage", callback);
  }

  submitPassword(password:string){
    return this.http.post(`${environment.admin}/password/${password}`, null);
  }

  

  getUsers(){
    return this.http.get<{id:number, username:string}[]>(`${environment.admin}/usersAdmin`);
  }

  

  getDisabledUsers(){
    return this.http.get<string[]>(`${environment.admin}/disabledUsersAdmin`);
  }

  deletePostAdmin(postId:number){
    return this.http.put<any>(`${environment.admin}/deletePost/${postId}`, null);
  }

  disableUser(userId:number){
    return this.http.put<any>(`${environment.admin}/disableUser/${userId}`, null);
  }

  constructor(private http:HttpClient, 
    private router:Router, 
    private spinner:SpinnerService, 
    private notisService:NotificationService,
    private chatService:ChatService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
