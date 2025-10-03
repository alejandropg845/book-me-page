import { ChatMessage } from "./chat.interface";

export interface ChatData {
    //Data para preview
    username:string,
    imageUrl:string,
    chatMessages:ChatMessage[],
    isBlockedByUser:boolean,
    lastChatMessage:string,
    messagesNumber:number,

    //Data para backend
    chatId:string,
    message:string,
    otherUserId:string
}