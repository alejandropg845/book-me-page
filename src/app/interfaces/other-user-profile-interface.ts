export interface OtherUserProfile {
    id:number,
    username:string,
    imageUrl:string,
    status:string,
    userSentFollowRequest:boolean
    currentUserSentFollowRequest:boolean
    bothUsersFollow:boolean,
    isBlockedByUser:boolean,
    currentUserIsBlocked:boolean
}
