import { Component, effect, ElementRef, NgZone, OnDestroy, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { HomeService } from '../../services/home.service';
import { Chat, ChatMessage } from '../../interfaces/chat.interface';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { ChatData } from '../../interfaces/chat-data-preview.interface';
import { ToastrService } from 'ngx-toastr';
import { handleBackendErrorResponse } from '../../handlers/errors-handlers';
import { ChangeDetectorRef } from '@angular/core';
import { ConfirmDialogService } from '../../services/confirmDialog.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
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


  userChats:Chat[] = [];

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

    console.log(chat.id);

    if (!this.authService.getToken){
      this.setFakeMessages(chat);
      return;
    }

    this.chatService.getChatMessages(chat.id, 0)
    .then(messages => {
      this.chatData.chatMessages = messages;
      this.chatService.sendMarkedAsReadChatMessages(messages, chat.otherUserId, chat.id)
      .subscribe({
        next: _ => {

          setTimeout(() => {
            this.scrollToMessagesContainerBottom();
          }, 0);


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

        },
        error: err => handleBackendErrorResponse(err, this.toastr)
      })
      
    });
  
    
    

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
    this.chatService.getChatMessages(this.chatData.chatId, this.num)
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
    this.userService.userInfoObservable$
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

    if (this.authService.getToken) {
      this.isTyping = false;
      this.homeService.typingMessage(this.userSenderId.toString(), 
                                   this.chatData.otherUserId,
                                   '');
      this.markMessagesAsRead(this.chatData.chatId);
      return;
    }

    this.homeService.showPreview = false;
  }

  @ViewChildren('isTyping') isTypingChats!:QueryList<ElementRef>;

  verifyTypingOnPreview(otherUserId:number){
    
    const typing = this.isTypingChats.find(e => (e.nativeElement as HTMLInputElement).id === otherUserId.toString())!.nativeElement as HTMLInputElement;

    if(typing.value === '1') this.isTyping = true;
   
  }

  sendMessage(message:HTMLTextAreaElement){

    if(!message.value.trim()) {
      return;
    }

    if(this.chatData.isBlockedByUser){
      this.toastr.warning("Unlock this user first to send a message");
      return;
    }

    if(!this.authService.getToken) {
      this.toastr.warning("Logging is required for this action");
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
    
    this.chatService.sendMessage(this.chatData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: _ => {
        this.scrollToMessagesContainerBottom();

        this.homeService.typingMessage(
          this.userSenderId.toString(),    
          this.chatData.otherUserId,
          ''
        );
      
      },
      error: err => {
        handleBackendErrorResponse(err, this.toastr);
        this.chatData.chatMessages.pop();
      }
    });

  }

  getUserChats(){

    if(this.chatUsername && this.userChats.length === 0) {
      return;
    }

    console.log("getUserChats se ejecuta");
    
    this.chatService.getUserChats();
    this.chatService.userChats.asObservable()
    .subscribe(chats => this.userChats = chats);

  }
  

  markMessagesAsRead(chatId:string){

    this.chatService.setUserChatMessagesMarkedAsRead(chatId)
    .subscribe({
      next: updatedChat => {
        
        const chatToRemoveIndex = this.userChats?.findIndex(c => c.id === chatId);
        if(chatToRemoveIndex !== -1) {
          this.userChats[chatToRemoveIndex] = updatedChat;
        }

        this.homeService.showPreview = false; 
        this.num = 0;
        this.moreMessages = true;

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

      },
      error: err => handleBackendErrorResponse(err, this.toastr)
    });

  }
  
  async unlockUser(otherUserId:string):Promise<void>{


    const isConfirmed = await firstValueFrom(this.confirmDialogService.openDialog());

    if(isConfirmed){
      
      this.userService.blockUser(parseInt(otherUserId))
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

    const typingDom = this.isTypingChats.find(e => (e.nativeElement as HTMLInputElement).id === otherUserId.toString())!.nativeElement as HTMLInputElement;


    if(typing) typingDom.value = '1';
    else typingDom.value = '0';
    
    if(otherUserId === parseInt(this.chatData.otherUserId)){
      if(typing) {
        this.isTyping = true;
      } else {
        this.isTyping = false;
      }
    }

  }

  @ViewChild('textareaMessage') textAreaMessage!:ElementRef;

  onTypingMessage(){

    if (this.chatData.isBlockedByUser) return;

    if (!this.authService.getToken) return;

    const message = this.textAreaMessage.nativeElement as HTMLTextAreaElement;
    const otherUserId = this.chatData.otherUserId;

    this.homeService.typingMessage(this.userSenderId.toString(), otherUserId, message.value);

    this.cdr.detectChanges();
  }

  onReceivedMarkedAsReadChatMessages(chatMessages:ChatMessage[]){
    chatMessages.forEach(message => {
      
      const messageFromChatIndex = this.chatData.chatMessages
      .findIndex(c => c.sentAt === message.sentAt);
      
      this.chatData.chatMessages[messageFromChatIndex] = message;

    });

    // if(chatMessages[0]){
    //   this.markMessagesAsRead(chatMessages[0].chatId);
    // }
  }

  //* DOM MANIPULATION 👇

  @ViewChild('messages_container') messagesContainer!:ElementRef;

  scrollToMessagesContainerBottom() {
    const container = this.messagesContainer.nativeElement as HTMLDivElement;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }

  images:string[] = [
    "./assets/images/thomas-person.jpg",
    "./assets/images/person2.jpg",
    "./assets/images/person3.jpg",
  ]

  private setFakeInfo(){
    
    let i = 0;

    do {

      const chat:Chat = {
        id: i.toString(),
        imageUrl: this.images[i],
        isBlockedByUser: false,
        lastChatMessage: `Fake message ${i}`,
        lastMessageUserId: i,
        messagesNumber: i,
        noReadMessages: i,
        otherUserId: i,
        username: `Fake username ${i}`
      };
      
      this.userChats.push(chat);
      
      i++;

    } while (i < 3)
    
  }

  fakeMessages: ChatMessage[] = [
  {
    chatId: 'chat-001',
    message: 'Good morning! Are we still on for the project review today?',
    sentAt: new Date('2025-09-05T09:00:00'),
    userId: 0,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-002',
    message: 'Morning! Yes, absolutely. I am looking forward to it. I have some ideas to share.',
    sentAt: new Date('2025-09-05T09:00:45'),
    userId: 1,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-003',
    message: 'Excellent. Is 2 PM still a good time for you?',
    sentAt: new Date('2025-09-05T09:01:10'),
    userId: 0,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-004',
    message: '2 PM works perfectly for me.',
    sentAt: new Date('2025-09-05T09:01:55'),
    userId: 1,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-005',
    message: 'Great. Also, could you please send over the preliminary data before the meeting?',
    sentAt: new Date('2025-09-05T09:02:30'),
    userId: 0,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-006',
    message: 'Of course. I just sent it to your email. Let me know if you get it.',
    sentAt: new Date('2025-09-05T09:03:15'),
    userId: 1,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-007',
    message: 'Got it. Thanks! I will take a quick look now.',
    sentAt: new Date('2025-09-05T09:03:40'),
    userId: 0,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-008',
    message: 'No problem. Talk to you at 2!',
    sentAt: new Date('2025-09-05T09:04:05'),
    userId: 1,
    isMarkedAsRead: true,
  },

  {
    chatId: 'chat-009',
    message: 'Hey, I\'m running about 5 minutes late. Just wrapping up another call.',
    sentAt: new Date('2025-09-05T13:58:00'),
    userId: 0,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-010',
    message: 'No worries at all. See you in a bit.',
    sentAt: new Date('2025-09-05T13:58:25'),
    userId: 1,
    isMarkedAsRead: true,
  },

  {
    chatId: 'chat-011',
    message: 'Great meeting! I think we have a solid plan now.',
    sentAt: new Date('2025-09-05T15:05:00'),
    userId: 0,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-012',
    message: 'I agree. I\'ll write up the action items and send them out by end of day.',
    sentAt: new Date('2025-09-05T15:05:45'),
    userId: 1,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-013',
    message: 'Sounds perfect. Thanks for organizing everything.',
    sentAt: new Date('2025-09-05T15:06:10'),
    userId: 0,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-014',
    message: 'My pleasure. Let\'s touch base again on Monday.',
    sentAt: new Date('2025-09-05T15:06:30'),
    userId: 1,
    isMarkedAsRead: true,
  },
  {
    chatId: 'chat-015',
    message: 'Will do. Have a great weekend!',
    sentAt: new Date('2025-09-05T15:07:00'),
    userId: 0,
    isMarkedAsRead: true,
  },
];

  private setFakeMessages(chat:Chat){

    this.userSenderId = 1;

    this.homeService.showPreview = true;
    
    this.chatData.imageUrl = chat.imageUrl;
    this.chatData.username = chat.username

    this.fakeMessages.forEach(message => this.chatData.chatMessages.push(message));


  }

  constructor(public homeService:HomeService, 
    private toastr:ToastrService, 
    private confirmDialogService:ConfirmDialogService,
    private cdr:ChangeDetectorRef,
    private chatService:ChatService,
    private userService:UserService,
    private authService:AuthService){}

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
    if (this.authService.getToken) {
      this.getUserChats();
      this.getUserId();
    } else this.setFakeInfo();
  }

}

