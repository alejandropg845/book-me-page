import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../interfaces/user-notification.interface';

@Injectable({providedIn: 'root'})
export class NotificationService {

    
  markSingleNotificationAsRead(notificationId:number):Observable<any>{
    return this.http.put(`${environment.notificationUrl}/markNotiAsRead/${notificationId}`, null);
  }

    userNotifications_signal = signal<Notification[]>([]);
  
    getUserNotifications(){
      this.http.get<Notification[]>(`${environment.notificationUrl}/getNotifications`).
      subscribe(nots => {
        this.userNotifications_signal.set(nots);
      });
    }

    followUser(recipientId:number):Observable<any>{
      return this.http.put(`${environment.notificationUrl}/sendFollowRequest/${recipientId}`, {});
    }

    rejectFR(actorId:number) {
      return this.http.delete(`${environment.notificationUrl}/rejectFR/${actorId}`);
    }
  
    markNotificationsAsRead():Observable<any>{
      return this.http.put(`${environment.notificationUrl}/markNotisAsRead`, {});
    }
  

    constructor(private readonly http:HttpClient) { }
    
}