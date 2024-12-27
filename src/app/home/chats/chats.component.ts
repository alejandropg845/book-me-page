import { Component, effect, NgZone, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { HomeService } from '../home.service';
import { Chat, ChatMessage } from '../../interfaces/chat.interface';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { ChatData } from '../../interfaces/chat-data-preview.interface';
import { ToastrService } from 'ngx-toastr';
import { handleBackendErrorResponse } from '../../handlers/errors-handlers';
import { ChangeDetectorRef } from '@angular/core';
import { ConfirmDialogService } from '../../shared/confirmDialog.service';
import { animate, style, transition, trigger } from '@angular/animations';
@Component({
  selector: 'app-chats',
  templateUrl: './chats.component.html',
  styleUrl: './chats.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [   
        style({ opacity: 0 }),
        animate('150ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [   
        animate('150ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ChatsComponent implements OnInit, OnDestroy{

  destroy$ = new Subject<void>();


  userChats!:Chat[];

  userSenderId!:number;
  

  chatData:ChatData = {
    //Data necesitada para mostrarlo en el preview del chat
    imageUrl: "",
    username: "",
    otherUserId : "",
    isBlockedByUser : false,
    lastChatMessage : "",
    messagesNumber : 0,
  
    //Data necesitada para el backend
    chatId: "",
    message: "",
    chatMessages: []
  }

  chatUsername!:string;

  async setDataToChatPreview(chat:Chat){


    this.homeService.getChatMessages(chat.id, 0)
    .then(messages => {
      this.chatData.chatMessages = messages;
      this.homeService.sendMarkedAsReadChatMessages(messages, chat.otherUserId, chat.id);
      setTimeout(() => {
        this.scrollToMessagesContainerBottom();
      }, 0);
    });
  
    
    this.chatData.username = chat.username;
    this.chatData.imageUrl = chat.imageUrl;
    this.chatData.isBlockedByUser = chat.isBlockedByUser;
    this.chatData.lastChatMessage = chat.lastChatMessage;
    this.chatData.messagesNumber = chat.messagesNumber;

    //Data necesitada para el backend
    this.chatData.chatId = chat.id;
    this.chatData.otherUserId = chat.otherUserId.toString();
    this.verifyTypingOnPreview(chat.otherUserId);

    this.homeService.showPreview = true;

    this.homeService.userOpensChatPreview(this.userSenderId, this.chatData.chatId);

  }


  moreMessages:boolean = true;

  verifyMoreMessages(){
    
    if(this.chatData.chatMessages.length > 0){
      
      if (this.chatData.chatMessages.length === this.chatData.messagesNumber) {
        
        this.moreMessages = false;
      }
    }

  }

  num:number = 0;
  loadMoreMessages(){
    this.num++;
    this.homeService.getChatMessages(this.chatData.chatId, this.num)
    .then(newMessages => {
      this.chatData.chatMessages = [...newMessages, ...this.chatData.chatMessages];
      this.verifyMoreMessages();
    });
  }

  verifyUserSenderMessage(userSenderId:number){
    if(userSenderId === this.userSenderId){
      return true;
    } 
    return false;
  }

  getUserId(){
    this.homeService.userInfoObservable$
    .pipe(takeUntil(this.destroy$))
    .subscribe(({id}) => {
      this.userSenderId = id;
      if (id !== 0) {
        setTimeout(() => 
          this.initUserChatsHub(id), 
        0);
      }
      
    });

  }

  sendMessageKeyboardEvent(event:KeyboardEvent, message:HTMLTextAreaElement){
    
    if(event.key === "Enter"){
      event.preventDefault();
      this.sendMessage(message);
    }
  }

  closePreview(){
    this.isTyping = false;
    this.homeService.typingMessage(this.userSenderId.toString(), 
                                   this.chatData.otherUserId,
                                   '');
    
    this.homeService.showPreview = false; 
    this.num = 0;
    this.moreMessages = true;

    this.markMessagesAsRead(this.chatData.chatId);
    
    this.homeService.userClosesChatPreview(this.userSenderId, this.chatData.chatId);

    this.chatData = {
      imageUrl: "",
      username: "",
      otherUserId : "",
      isBlockedByUser : false,
      lastChatMessage : "",
      messagesNumber : 0,
      chatId: "",
      message: "",
      chatMessages: []
    }

    
  }

  verifyTypingOnPreview(otherUserId:number){
    
    const typingDom = document.getElementById(`isTyping${otherUserId}`) as HTMLInputElement;

    if(typingDom.value === '1') this.isTyping = true;
   
  }

  sendMessage(message:HTMLTextAreaElement){

    if(!message.value.trim()) {
      return;
    }

    if(this.chatData.isBlockedByUser){
      this.toastr.warning("Unlock this user first to send a message");
      return;
    }

    this.chatData.chatMessages.push({
      chatId: '',
      isMarkedAsRead: false,
      message: message.value,
      sentAt: new Date(),
      userId: this.userSenderId
    });

    this.chatData.message = message.value;
    
    message.value = "";
    
    setTimeout(() => {
      this.scrollToMessagesContainerBottom();
    }, 0);
    
    this.homeService.sendMessage(this.chatData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: _ => {
        this.scrollToMessagesContainerBottom();

        this.homeService.typingMessage(
          this.userSenderId.toString(),    
          this.chatData.otherUserId,
          ''
        );

        // this.chatData
        // .chatMessages.splice(this.chatData.chatMessages.length - 2, 1);
      
      },
      error: err => {
        handleBackendErrorResponse(err, this.toastr);
        this.chatData.chatMessages.pop();
      }
    });

  }

  async getUserChats(){

    if(this.chatUsername && this.userChats.length === 0) {
      return;
    }
    this.userChats = await this.homeService.getUserChats(this.chatUsername);
  }
  

  markMessagesAsRead(chatId:string){

    this.homeService.setUserChatMessagesMarkedAsRead(chatId)
    .subscribe({
      next: updatedChat => {
        
        const chatToRemoveIndex = this.userChats?.findIndex(c => c.id === chatId);
        if(chatToRemoveIndex !== -1) {
          this.userChats[chatToRemoveIndex] = updatedChat;
        }

      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    });

  }
  
  async unlockUser(otherUserId:string):Promise<void>{


    const isConfirmed = await firstValueFrom(this.confirmDialogService.openDialog());

    if(isConfirmed){
      
      this.homeService.blockUser(parseInt(otherUserId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async r => {

          const chat = this.userChats.find(c => c.otherUserId.toString() === otherUserId)!;

          chat.isBlockedByUser = false;

        },
        error: err => handleBackendErrorResponse(err, this.toastr)
      });
    }
  }


  //^ UserChatsHub

  initUserChatsHub(userId:number){

    // ? Obtener el id del usuario actual
    this.homeService.startUserChatsConnection(userId);
    this.homeService.setUserChatsReceiver(this.onReceivedUserChat.bind(this));
    this.homeService.setUserMessageChatsReceiver(this.onReceivedMessage.bind(this));
    this.homeService.setMarkedAsReadUserMessages(this.onReceivedMarkedAsReadChatMessages.bind(this));
    this.homeService.setTypingMessageReceiver(this.onReceiveTypingMessage.bind(this));
  }

  onReceivedUserChat(userChat:Chat){
    
    const chatToRemoveIndex = this.userChats?.findIndex(c => c.id === userChat.id);

    this.userChats[chatToRemoveIndex] = userChat;

    this.cdr.detectChanges();
  }

  onReceivedMessage(message:ChatMessage) {

    if(this.chatData.chatId === message.chatId)
    this.deleteFictitiousMessageAndAddMessage(message);

  }

  deleteFictitiousMessageAndAddMessage(message:ChatMessage){

    /*Obtenemos el index del message fictício que hemos agregado en el método
    SendMessage(), el cual únicamente existe para el usuario que envió el message, por lo 
    que no existe para el otro usuario.
    */
    const fictitiousMessageIndex = this.chatData.chatMessages
    .findIndex(c => !c.chatId && c.userId === this.userSenderId);

    /* Verificamos que el mensaje existe únicamente para el que lo envió, de esta forma, eliminamos
    ese mensaje fictício y agregamos el original que viene del backend (signal). De no hacer esto,
    nos encontraremos que al otro usuario se le elimina su mensaje ya enviado. */
    if(fictitiousMessageIndex !== -1)
    this.chatData.chatMessages.splice(fictitiousMessageIndex, 1);

    // Agregamos el message original proveniente del signal
    this.chatData.chatMessages.push(message);

    this.cdr.detectChanges();

    if(this.homeService.showPreview) {
      setTimeout(() => {
        this.scrollToMessagesContainerBottom();
      }, 0);
    }

  }

  isTyping:boolean = false;

  onReceiveTypingMessage(otherUserId:number, typing:boolean){

    const typingDom = document.getElementById(`isTyping${otherUserId}`)! as HTMLInputElement;

    if(typing) {
      typingDom.value = '1';
    } else {
      typingDom.value = '0';
    }

    if(otherUserId === parseInt(this.chatData.otherUserId)){
      if(typing) {
        this.isTyping = true;
      } else {
        this.isTyping = false;
      }
    }

  }

  onTypingMessage(){

    if(this.chatData.isBlockedByUser) return;

    const message = document.getElementById("textareaMessage") as HTMLTextAreaElement;
    const otherUserId = this.chatData.otherUserId;

    this.homeService.typingMessage(this.userSenderId.toString(), otherUserId, message.value);
  }

  onReceivedMarkedAsReadChatMessages(chatMessages:ChatMessage[]){
    chatMessages.forEach(message => {
      
      const messageFromChatIndex = this.chatData.chatMessages
      .findIndex(c => c.sentAt === message.sentAt);
      
      this.chatData.chatMessages[messageFromChatIndex] = message;

    });

    if(chatMessages[0]){
      this.markMessagesAsRead(chatMessages[0].chatId);
    }
  }

  //* DOM MANIPULATION 👇

  scrollToMessagesContainerBottom() {
    const container = document.getElementById("messages-container")!;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }

  constructor(public homeService:HomeService, 
    private toastr:ToastrService, 
    private confirmDialogService:ConfirmDialogService,
    private cdr:ChangeDetectorRef){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.homeService.hubUserChats) {
      this.homeService.hubUserChats.off("ReceivedUserChat");
      this.homeService.hubUserChats.off("ReceivedMessage");
      this.homeService.hubUserChats.off("ReceivedUpdatedMessages");
      this.homeService.hubUserChats.off("ReceiveOnTypingMessage");
      this.homeService.hubUserChats.stop()
        .then().catch(err => console.log(err));
    }
  }

  ngOnInit(): void {
    this.getUserChats();
    this.getUserId();
    
  }

}

