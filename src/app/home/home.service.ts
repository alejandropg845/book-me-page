import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, signal } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable, Subject, takeUntil } from 'rxjs';
import { environment } from '../../environments/environment';
import { Post } from '../interfaces/post.interface';
import { FormGroup } from '@angular/forms';
import { UserInfo } from '../interfaces/user-info.interface';
import { SearchUserInfo } from '../interfaces/search-user-info.interface';
import { UserAndPosts } from '../interfaces/my-user-and-posts.interface';
import { OtherUserAndPosts } from '../interfaces/other-user-and-posts.interface';
import { Chat, ChatMessage } from '../interfaces/chat.interface';
import { ChatData } from '../interfaces/chat-data-preview.interface';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { UserNotifications } from '../interfaces/user-notifications.interface';
import { MessagePopup } from '../interfaces/message-popup.interface';
import { CommentReply } from '../interfaces/commentreply.interface';
import { InterfaceData } from '../interfaces/interface-data.interface';
import { Router } from '@angular/router';
import { FollowRequestNotification } from '../interfaces/followrequest-notification.interface';
import { UserNotification } from '../interfaces/user-notification.interface';
import { SpinnerService } from '../shared/spinner.service';

@Injectable({
  providedIn: 'root'
})
export class HomeService implements OnDestroy{

  token!: string | null;
  urlP:string = `${environment.generalUrl}/posts`;
  urlA:string = `${environment.authUrl}`;
  urlC:string = `${environment.generalUrl}/comment`;
  urlF:string = `${environment.generalUrl}/followRequests`;
  urlCH:string = `${environment.generalUrl}/chats`;
  urlN:string = `${environment.generalUrl}/notification`
  hubConnection!:HubConnection;
  isNotificationIconClicked:boolean = false;
  isUserFromSearchClicked:boolean = false;
  showPreview:boolean = false;
  destroy$ = new Subject<void>();

  uploadImage(data:FormData):Observable<any>{
    return this.http.post("https://api.cloudinary.com/v1_1/dyihpj2hw/image/upload", data);
  }

  uploadProfilePic(image:FormData){
    return this.http.post("https://api.cloudinary.com/v1_1/dyihpj2hw/image/upload", image);
  }

  logOut(){
    this.token = null;
    localStorage.removeItem('bmt');
    this.router.navigate(["/bookme/auth/login"]);
  }

  postsSubject = new BehaviorSubject<Post[]>([]);
  postsObservable$ = this.postsSubject.asObservable();

  getAllUsersPosts(){
    this.http.get<Post[]>(this.urlP)
    .pipe(takeUntil(this.destroy$))
    .subscribe(posts => this.postsSubject.next(posts));
  }

  addPost(data:FormGroup):Observable<any>{
    return this.http.post(this.urlP, data.value);
  }

  changeProfilePic(image:string, publicId:string):Observable<any>{
    return this.http.post(`${this.urlA}/newProfilePic`, { ProfilePicUrl: image, publicId });
  }

  userInfoSubject = new BehaviorSubject<UserInfo>({id:0,imageUrl:'',status:'',username:''});
  userInfoObservable$ = this.userInfoSubject.asObservable();

  getUserInfoForSidebar(){
    this.http.get<UserInfo>(`${this.urlA}/userCredentials`)
    .pipe(takeUntil(this.destroy$))
    .subscribe(info => this.userInfoSubject.next(info));
  }

  addComment(postId:number, content:string, postUserId:number):Observable<any>{
    return this.http.post(`${this.urlC}/${postId}`, { content, postUserId });
  }

  deletePost(postId:number):Observable<any>{
    return this.http.delete(`${this.urlP}/${postId}`);
  }

  searchUser(username:string):Observable<SearchUserInfo[]>{
    return this.http.get<SearchUserInfo[]>(`${this.urlA}/filterUsers?Username=${username}`);
  }

  userAndPostsSubject = new BehaviorSubject<OtherUserAndPosts | null>(null);

  getUserAndPosts(userId:number) {
    this.http.get<OtherUserAndPosts>(`${this.urlA}/userAndPosts/${userId}`)
    .pipe(takeUntil(this.destroy$))
    .subscribe(userAndPostsInfo => this.userAndPostsSubject.next(userAndPostsInfo));
  }

  myProfileInfoSignal = signal<UserAndPosts | null>(null);

  getMyUserAndPosts(){
    this.http.get<UserAndPosts>(`${this.urlA}/myUserAndPosts`)
    .subscribe(info => {
      this.myProfileInfoSignal.set(info);
      this.spinner.isOtherThingLoading.set(false);
    });
  }

  getPostComments(postId:number, num?:number):Observable<any>{
    if(!num) num = 0;
    return this.http.get(`${this.urlC}/postComments/${postId}?number=${num}`)
  }

  userNotifications_signal = signal<UserNotifications | null>(null);

  getUserNotifications(){
    this.http.get<UserNotifications>(`${this.urlN}/getNotifications`).
    subscribe(nots => {
      this.userNotifications_signal.set(nots);
    });
  }

  followUser(userReceiverId:number):Observable<any>{
    return this.http.put(`${this.urlF}/sendFollowRequest/${userReceiverId}`, {});
  }

  likePost(postId:number, postUserId:number):Observable<any>{
    return this.http.put<any>(`${this.urlP}/likePost`, 
    { postId, postUserId });
  }

  singlePostSubject = new BehaviorSubject<Post | null>(null);

  getSinglePost(postId:number){
    this.http.get<Post>(`${this.urlP}/post/${postId}`)
    .subscribe(post => this.singlePostSubject.next(post));
  }

  respondToUserFollowRequest(userSenderId:string, 
                             isAccepted:boolean, 
                             isRejected:boolean):Observable<any>{
    return this.http
    .put(`${this.urlF}/respondUserFollowRequest`, {
      userSenderId, isAccepted, isRejected
    });
  }


  async getUserChats(keyword?:string):Promise<Chat[]>{
    if(!keyword) keyword = "%";
    return firstValueFrom(this.http.get<Chat[]>(`${this.urlCH}?keyword=${keyword}`));
  }

  sendMessage(data:ChatData):Observable<any>{
    return this.http.post(`${this.urlCH}/sendMessage`, data);
  }

  async getChatMessages(chatId:string, num:number):Promise<ChatMessage[]>{
    return firstValueFrom(this.http.get<ChatMessage[]>(`${this.urlCH}/chatMessages/${chatId}?number=`+num));
  }

  setUserChatMessagesMarkedAsRead(chatId:string):Observable<Chat>{
    return this.http.put<Chat>(`${this.urlCH}/markChatMessages/${chatId}`,{});
  }

  markNotificationsAsRead():Observable<any>{
    return this.http.put(`${this.urlN}/markNotisAsRead`, {});
  }

  blockUser(otherUserId:number):Observable<any>{
    return this.http.put(`${this.urlA}/blockOrUnlock/${otherUserId}`, {});
  }

  getCommentReplies(commentId:number, num?:number):Observable<CommentReply[]>{
    return this.http.get<CommentReply[]>(`${this.urlC}/commentReplies/${commentId}?number=`+num);
  }

  likeReply(replyId:number, commentId:number, postId:number, likingToId:number):Observable<any>{
    return this.http.put(`${this.urlC}/likeReply`, { replyId, commentId, postId, likingToId });
  }

  replyToComment(data:InterfaceData):Observable<any>{
    return this.http.post(`${this.urlC}/replyToComment`, data)
  }

  likeComment(commentId:number, postId:number, authorIdComment:number):Observable<any>{
    return this.http.put(`${this.urlC}/likeComment`, { postId, commentId, authorIdComment });
  }

  deleteComment(commentId:number, postId:number): Observable<any> {
    console.log({ commentId, postId })

    return this.http.put(`${this.urlC}/deleteComment/${commentId}?postId=${postId}`, {});
  }

  deleteReply(commentId:number, replyId:number): Observable<any> {
    return this.http.put(`${this.urlC}/deleteReply`, { commentId, replyId });
  }

  markSingleNotificationAsRead(notificationId:number, keyword:string):Observable<any>{
    return this.http.put(`${this.urlN}/markNotiAsRead/${notificationId}?keyword=${keyword}`, null);
  }

  sendMarkedAsReadChatMessages(chatMessages:ChatMessage[], otherUserId:number, chatId:string){
    this.http.put(`${this.urlCH}/sendMarkedAsReadMessages`, 
    { chatMessages, otherUserId, chatId })
    .subscribe();
  }


  // * HUB FIRST CONNECTION CONFIG

  firstConnection!:HubConnection;

  startConnectionAfterLogIn(userId:number){
    
    this.spinner.isOtherThingLoading.set(true);

    this.firstConnection = new HubConnectionBuilder()
    .withUrl(`${environment.hubUrl}/hub-notification?userId=`+userId.toString(), {logger: LogLevel.None})
    .build();

    this.firstConnection.start()
    .then(() => {
      this.spinner.isOtherThingLoading.set(false);
    })
    .catch(err => {
      console.log(err);
      this.spinner.isOtherThingLoading.set(false);
    });

  }

  //Mostrar en notificaciones las FR
  setFRNotificationReceiver(callback: (userNotifications:FollowRequestNotification) => void){
    this.firstConnection.on("ReceivedFRNotification", callback);
  }

  //Mostrar en notificaciones cualquier otra notificacion que no sea FR
  setNotificationReceiver(callback: (notification:UserNotification) => void) {
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
    .build();

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
    this.hubUserChats.invoke("OnOpenChat", userId, chatId)
    .then();
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

  getPosts() {
    return this.http.get<{id:number, postImageUrl:string, description:string}[]>(`${environment.admin}/postsAdmin`);
  }

  getUsers(){
    return this.http.get<{id:number, username:string}[]>(`${environment.admin}/usersAdmin`);
  }

  getDeletedPosts(){
    return this.http.get<{postImageUrl:string, description:string}[]>(`${environment.admin}/deletedPostsAdmin`);
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

  constructor(private http:HttpClient, private router:Router, private spinner:SpinnerService) {

    if (typeof window !== 'undefined' && window.localStorage) {
      this.token = localStorage.getItem('bmt');
    }

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
