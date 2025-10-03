export interface Chat {
    id:string,
    otherUserId:number,
    imageUrl:string,
    username:string,
    lastChatMessage:string,
    lastMessageUserId:number,
    noReadMessages:number,
    isBlockedByUser:boolean,
    messagesNumber:number
}


export interface ChatMessage {
    chatId:string,
    sentAt:Date,
    message:string,
    userId:number,
    isMarkedAsRead:boolean
}