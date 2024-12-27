export interface UserNotification {
    id:number,
    type:string
    username:string,
    postUsername:string,
    imageUrl:string,
    postId:number,
    isMarkedAsRead:boolean
}