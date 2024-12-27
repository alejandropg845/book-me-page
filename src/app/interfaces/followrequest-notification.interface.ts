export interface FollowRequestNotification {
    id:number,
    senderImageUrl:string,
    senderUsername:string,
    isAccepted:boolean,
    isRejected:boolean,
    isNotificationOpen:boolean,
    userSenderId:number
}