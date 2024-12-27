export interface CommentReply {
    id:number,
    commentId:number,
    userId:number,
    authorUsername:string,
    imageUrl:string,
    replyLikes:number,
    replyingToId:number,
    replyingToUsername:string,
    repliedAt:Date,
    content:string,
    isLikedByUser:boolean,
    isReplyOwner:boolean
}