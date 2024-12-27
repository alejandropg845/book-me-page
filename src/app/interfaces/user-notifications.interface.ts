
import { FollowRequestNotification } from "./followrequest-notification.interface";
import { UserNotification } from "./user-notification.interface";


export interface UserNotifications {
    followRequests:FollowRequestNotification[],
    notifications:UserNotification[],
    notificationsNumber:number
}