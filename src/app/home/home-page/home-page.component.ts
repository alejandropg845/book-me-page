import { Component, input, Input, OnDestroy, OnInit} from '@angular/core';
import { HomeService } from '../home.service';
import { finalize, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { Post } from '../../interfaces/post.interface';
import { ToastrService } from 'ngx-toastr';
import { LocationStrategy } from '@angular/common';
import { handleBackendErrorResponse } from '../../handlers/errors-handlers';
import { Comment } from '../../interfaces/post.interface';
import { CommentReply } from '../../interfaces/commentreply.interface';
import { InterfaceData } from '../../interfaces/interface-data.interface';
import { ConfirmDialogService } from '../../shared/confirmDialog.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
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
export class HomePageComponent implements OnInit, OnDestroy{

  
  interfaceData: InterfaceData | null = {
    commentId: 0,
    content: '',
    postId: 0,
    username: '',
    replyingToId: 0
  };

  @Input() posts: Post[] = [];
  @Input() isMyProfile:boolean = false;
  @Input() myProfilePosts:boolean | null = null;
  isShowCommentsOpen:boolean = false;
  destroy$ = new Subject<void>();
  contentLength:number = 0;

  getAllUsersPosts(){
    this.homeService.getAllUsersPosts();
    this.homeService.postsObservable$
    .pipe(takeUntil(this.destroy$))
    .subscribe(posts => {
      this.posts = posts;
    });
  }

  countCharacters(textarea:HTMLTextAreaElement, p:HTMLParagraphElement){
    this.contentLength = textarea.value.length;
    if(this.contentLength > 500) {
      p.classList.add('red-color');
      this.contentLength = 500;
    } else {
      p.classList.remove('red-color');
    }
  }

  isAddingComment:boolean = false;

  addComment(postId:number, content:string, postUserId:number, ce:HTMLDivElement){ // * 500 Characters

    const focus = document.getElementsByClassName('focus-adding-comment')[0];
    
    if(!content) {
      this.toastr.error('Type at least one character in your comment');
      return;
    }

    if(content.length > 500) {
      this.toastr.warning('Max. characters is 500');
      return;
    }

    this.isAddingComment = true;

    this.homeService.addComment(postId, content, postUserId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: suc => {
        this.toastr.success(suc.message);
        content = '';
        this.homeService.getAllUsersPosts();
        focus.classList.remove('sfi');
        ce.classList.add("hci");
        this.isAddingComment = false;
        if(this.locationStrategy.path().includes('main-content/homepage')){
          this.getAllUsersPosts();
        } else if(this.locationStrategy.path().includes("single-post")){
          this.homeService.getSinglePost(postId)
        } else {
          this.homeService.getUserAndPosts(postUserId);
        };

      },
      error: err => {
        handleBackendErrorResponse(err, this.toastr);
        this.isAddingComment = false;
      }
    });


  }

  async deletePost(postId: number): Promise<void> {
    
    const isConfirmed = await firstValueFrom(this.confirmDialog.openDialog());

    if (isConfirmed) {

      this.homeService.deletePost(postId).subscribe({
        next: (suc) => {
          this.toastr.success(suc.message);
          this.homeService.getMyUserAndPosts();
        },
        error: (err) => handleBackendErrorResponse(err, this.toastr)
      });
    }
  }

  closeComments(){
    this.postComments = [];
    this.isShowCommentsOpen = false;
    this.replyToCommentIsOpen = false;
    this.num = 0;
    this.hasComments = true;
    this.interfaceData = {
      commentId: 0,
      content: '',
      postId: 0,
      replyingToId: 0,
      username: ''
    }

  }

  isCheckingMoreComments:boolean = false;

  num:number = 0;
  loadMoreComments(postId:number){
    this.isCheckingMoreComments = true;
    this.num++;
    this.getPostComments(postId, this.num);
  }


  processLikePosts = new Set<number>;

  likePost(post:Post){
    

    if(this.processLikePosts.has(post.id)) return;

    this.processLikePosts.add(post.id);

    //Guardar estado anterior en caso de errores
    const originalState = {
      isLikedByUser : post.isLikedByUser,
      postLikes: post.postLikes
    }

    this.setOptimisticUpdateToPost(post);
    
    this.homeService.likePost(post.id, post.postUserId)
    .pipe
    (
      takeUntil(this.destroy$),
      finalize(() => {
        this.processLikePosts.delete(post.id);
      })
    )
    .subscribe({
      error: err => {
        handleBackendErrorResponse(err, this.toastr);
        
        post.isLikedByUser = originalState.isLikedByUser;
        post.postLikes = originalState.postLikes

      }
    });
  }

  postComments:Comment[]= [];
  hasComments: boolean = true;
  isLoadingComments:boolean = false;

  getPostComments(postId:number, num?:number){

    if(this.isLoadingComments) return;

    this.isLoadingComments = true;

    this.addLoadingCommentsIcon(postId);

    if(!this.hasComments){
      return;
    }

    this.interfaceData!.postId = postId;

    this.homeService.getPostComments(postId, num)
    .pipe(takeUntil(this.destroy$), finalize(() => this.isLoadingComments = false))
    .subscribe(comments => {
      
      if(comments.length === 0 || comments.length < 3) this.hasComments = false;

      this.postComments = [...this.postComments, ...comments];
      this.isShowCommentsOpen = true;
      
      this.revertButtonContent(postId);
      this.isCheckingMoreComments = false;

    });
  }

  isReplying:boolean = false;

  replyToCommentIsOpen:boolean = false;

  processingReplies = new Set<number>;

  likeReply(reply:CommentReply){

    if(this.processingReplies.has(reply.id)) return;

    this.processingReplies.add(reply.id);

    //Guardar estado previo en caso de errores
    const originalState = {
      isLikedByUser : reply.isLikedByUser,
      replyLikes : reply.replyLikes
    }
    
    this.setOptimisticUpdateToReply(reply);

    this.homeService.likeReply(reply.id, reply.commentId, this.postComments[0].postId, reply.userId)
    .pipe(takeUntil(this.destroy$), finalize(() => this.processingReplies.delete(reply.id)))
    .subscribe({
      error: err => {
        handleBackendErrorResponse(err, this.toastr);
          reply.isLikedByUser = originalState.isLikedByUser;
          reply.replyLikes = originalState.replyLikes;
      }
    });

  }

  onKeySendComment(event:KeyboardEvent, postId:number, content:string, postUserId:number, ce:HTMLDivElement){
    if(event.key === "Enter") this.addComment(postId, content, postUserId, ce);
  }

  setOptimisticUpdateToReply(reply:CommentReply){

    if(reply.isLikedByUser){
      reply.isLikedByUser = false;
      reply.replyLikes = reply.replyLikes - 1;
    } else {
      reply.isLikedByUser = true;
      reply.replyLikes = reply.replyLikes + 1;
    }

  }

  setOptimisticUpdateToPost(post:Post){
    if(post.isLikedByUser) {
      post.isLikedByUser = false;
      post.postLikes--;
    } else {
      post.isLikedByUser = true;
      post.postLikes++;
    }
  }

  openReplyInterface(author:string,commentId:number,authorId:number){
    this.interfaceData!.username = author;
    this.interfaceData!.commentId = commentId;
    this.interfaceData!.replyingToId = authorId;
    this.replyToCommentIsOpen = true;
  }

  sendReply(content:HTMLTextAreaElement){

    if(!content.value) {
      this.toastr.info("You forgot to add content to your reply");
      return;
    }
    this.isReplying = true;
    this.interfaceData!.content = content.value;
    this.homeService
    .replyToComment(this.interfaceData!)
    .subscribe({
      next: res => {
        this.isReplying = false;
        this.toastr.success(res.message);
        this.setReplyToComment(res.insertedReply);
      },
      error: err => {
        handleBackendErrorResponse(err, this.toastr);
        this.isReplying = false;
      }
    });
  }

  newReply:CommentReply | null = null;

  setReplyToComment(reply:CommentReply){
    
    this.newReply = reply;
    reply.isReplyOwner = true;
    
    const commentIndex = this.postComments.findIndex(c => c.commentId === reply.commentId);


    if(commentIndex !== -1){ //Existe la posición

      if(this.postComments[commentIndex].commentReplies){ //Ya se encuentran respuestas en el comentario por lo que hacemos push

        this.postComments[commentIndex].commentReplies.push(reply);
        this.replyToCommentIsOpen = false;

      } else {                                                        //Si no hay nada, asignamos el valor deun arreglo vacío y pusheamos
        this.postComments[commentIndex].commentReplies = [];
        this.postComments[commentIndex].commentReplies.push(reply);
        this.replyToCommentIsOpen = false;
      }

    }

  }

  gettingRepliesList = new Set<number>;

  getCommentReplies(comment:Comment, commentIndex?:number){

    if(this.gettingRepliesList.has(comment.commentId)) return;
    

    this.gettingRepliesList.add(comment.commentId);

    this.addLoadingRepliesIcon(comment.commentId);

    const inputNum = document.getElementById(`inputNum${commentIndex}`) as HTMLInputElement;

    if(!comment.commentReplies) comment.commentReplies = [];


    if(comment.commentReplies){ 
      
      this.homeService.getCommentReplies(comment.commentId, inputNum.valueAsNumber)
      .pipe(takeUntil(this.destroy$), finalize(() => this.gettingRepliesList.delete(comment.commentId)))
      .subscribe(replies => {
        this.setRepliesToComment(replies, commentIndex!, comment);
        this.removeLoadingRepliesIcon(comment.commentId);
      });

    }

    inputNum.valueAsNumber++;
    
  }


  setRepliesToComment(replies:CommentReply[], commentIndex:number, comment:Comment){

    if(this.newReply) {
      this.verifyReplyExistence(comment.commentReplies, replies, comment);
      this.newReply = null;
    }
    

    comment.commentReplies = [...replies, ...comment.commentReplies];

    if(comment.commentReplies.length === comment.repliesNumber){
      const replies_paragraph = document.getElementById(`show-comments-paragraph${commentIndex}`);
      replies_paragraph?.classList.add('hci');
    }

  }

  verifyReplyExistence(oldReplies:CommentReply[], newReplies:CommentReply[], comment:Comment){
    
    /*Debemos verificar que no haya duplicados, y si los hay, eliminar uno, esto es porque al
    momento de agregar un newReply, la paginacion en la base de datos se ve afectada porque hemos
    agregado un nuevo reply y el número y orden de las filas cambia, trayendo inconsistencias como 
    comentarios duplicados. Tener en cuenta también que se aplica reversa en el backend, es decir,
    los comentarios se están trayendo los ultimos tres en orden descendente (reply 5, reply 4, reply 3, reply 2...,)
    por lo que en el backend hacemos reversa para que los traiga como el mas antiguo primero al mas reciente (reply 2, reply 3, reply 4, reply 5...,)
    .
     */

    oldReplies.forEach(reply => {

      const duplicatedReplyIndex = newReplies.findIndex(r => r.id === reply.id);

      if(duplicatedReplyIndex !== -1) {
        newReplies.splice(duplicatedReplyIndex, 1);

        /*Sumamos un reply mas al comentario, porque al momento de guardar un comentario, este no
        se actualiza en el contador, por lo que se va a ocultar antes de que traiga todos los comentarios,
        siendo por lo general el primer comentario en no traer. De esta forma tambien se mantiene actualizado
        el length del array de replies y el repliesNumber del comentario para que se oculte correctamente*/ 
        comment.repliesNumber++; 
      }

    });

  }

  likeComment(comment:Comment){

    const previousState = {
      isLikedByUser:comment.isLiked,
      commentLikes:comment.commentLikes
    }

    this.setOptimisticUpdateToComment(comment);

    this.homeService.likeComment(comment.commentId, comment.postId, comment.authorId)
    .subscribe({
      error: err => {
        handleBackendErrorResponse(err, this.toastr);
        comment.commentLikes = previousState.commentLikes;
        comment.isLiked = previousState.isLikedByUser;
      }
    });
  }

  setOptimisticUpdateToComment(comment:Comment){
    if(comment.isLiked){
      comment.isLiked = false;
      comment.commentLikes -= 1;
    } else {
      comment.isLiked = true;
      comment.commentLikes += 1;
    }
  }

  async deleteComment(commentId:number, postId:number) {

    const isConfirmed = await firstValueFrom(this.confirmDialog.openDialog());

    if(isConfirmed){
      this.homeService.deleteComment(commentId, postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {

          this.toastr.success(r.message);

          const commentIndex = this.postComments.findIndex(c => c.commentId === commentId);
  
          if(commentIndex !== -1) this.postComments.splice(commentIndex, 1);
          
        },
        error: err => handleBackendErrorResponse(err, this.toastr)
      });
    }

    
  }

  async deleteReply(commentId:number, replyId:number){

    const isConfirmed = await firstValueFrom(this.confirmDialog.openDialog());

    if(isConfirmed){

      this.homeService.deleteReply(commentId, replyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {

          this.toastr.success(r.message);

          const commentIndex = this.postComments.findIndex(c => c.commentId === commentId);

          if(commentIndex !== -1) {

            const replyIndex = this.postComments[commentIndex].commentReplies.findIndex(r => r.id === replyId);

            if(replyIndex !== -1) this.postComments[commentIndex].commentReplies.splice(replyIndex, 1);

          }
            
        },
        error: err => handleBackendErrorResponse(err, this.toastr)
      });

    }
  }

  hidePopups(){
    this.homeService.isNotificationIconClicked = false;
    this.homeService.isUserFromSearchClicked = true;
  }
  
  constructor(private homeService:HomeService, 
              private toastr:ToastrService, 
              private locationStrategy:LocationStrategy,
              private confirmDialog:ConfirmDialogService) {}
  
  ngOnInit(): void {
    if(this.locationStrategy.path().includes('main-content/homepage')){
      this.getAllUsersPosts();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // * METHODS FOR DOM MANIPULATION 👇

  addLoadingCommentsIcon(postId:number){

    const comments_button = document.getElementById(`post-comments-button${postId}`);

    if(comments_button) {

      let icon = document.createElement('i');

      icon.classList.add('fa', 'fa-spinner', 'fa-spin');

      icon.setAttribute('id', `iconId${postId}`);

      icon.style.marginLeft = '.5rem';

      comments_button.appendChild(icon);
    }

  }

  revertButtonContent(postId:number){

    const iconId = document.getElementById(`iconId${postId}`);

    if(iconId) iconId?.remove();

  }

  addLoadingRepliesIcon(commentId:number){
    const paragraph = document.getElementsByClassName(`loading-replies-paragraph${commentId}`)[0];

    if(paragraph){

      const icon = document.createElement('i');

      icon.classList.add('fa','fa-spinner','fa-spin');

      icon.style.marginLeft = '.5rem';

      icon.setAttribute('name', `iconLoading${commentId}`);

      paragraph.appendChild(icon);

    }
  }

  removeLoadingRepliesIcon(commentId:number){
    const icon = document.getElementsByName(`iconLoading${commentId}`)[0];
    if(icon) icon.remove();
  }

  showAddComment(comm_inter:HTMLDivElement, fac:HTMLDivElement){
    const div = comm_inter as HTMLElement;
    const facDiv = fac as HTMLElement;
    if(div.classList.contains('hci')){
      div.classList.remove('hci');
      div.classList.add('shi');
      facDiv.classList.add('sfi');
    } else {
      div.classList.add('hci');
      facDiv.classList.add('hci');
      div.classList.remove('shi');
      facDiv.classList.remove('sfi');
    }
  }

  closeAddComment(comm_inter:HTMLDivElement, fac:HTMLElement){
    const div = comm_inter as HTMLElement;
    const facDiv = fac as HTMLElement;
    div.classList.add('hci');
    div.classList.remove('shi')
    facDiv.classList.remove('sfi');
    facDiv.classList.add('hci');
  }

}
