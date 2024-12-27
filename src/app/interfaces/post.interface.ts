import { CommentReply } from "./commentreply.interface"

export interface Post {
    id: number,
    postUserId:number,
    authorImageUrl:string,
    postImageUrl: string,
    username: string,
    description: string,
    postLikes: number,
    postedDate: Date,
    commentsNumber: number,
    isLikedByUser:boolean
}

export interface Comment {
    commentId: number,
    authorImage: string | null,
    postId:number,
    isCommentOwner:boolean,
    author: string,
    authorId: number,
    content: string,
    commentDate: Date,
    commentLikes: number,
    repliesNumber: number,
    isLiked:boolean,
    commentReplies:CommentReply[]
}