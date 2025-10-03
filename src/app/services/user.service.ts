import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, takeUntil } from 'rxjs';
import { UserAndPosts } from '../interfaces/my-user-and-posts.interface';
import { OtherUserAndPosts } from '../interfaces/other-user-and-posts.interface';
import { SearchUserInfo } from '../interfaces/search-user-info.interface';
import { UserInfo } from '../interfaces/user-info.interface';
import { environment } from '../../environments/environment';
import { SpinnerService } from './spinner.service';

@Injectable({providedIn: 'root'})
export class UserService {

    
    userInfoSubject = new BehaviorSubject<UserInfo>({id:0,imageUrl:'',status:'',username:''});
    userInfoObservable$ = this.userInfoSubject.asObservable();
    
    getUserInfoForSidebar(){
    this.http.get<UserInfo>(`${environment.userUrl}/userCredentials`)
    .subscribe(info => this.userInfoSubject.next(info));
    }
    
      
      
    changeProfilePic(image:string, publicId:string):Observable<any>{
        return this.http.post(`${environment.userUrl}/newProfilePic`, { ProfilePicUrl: image, publicId });
    }
    
    
    
    searchUser(username:string):Observable<SearchUserInfo[]>{
        return this.http.get<SearchUserInfo[]>(`${environment.userUrl}/filterUsers?Username=${username}`);
    }
    
    userAndPostsSubject = new BehaviorSubject<OtherUserAndPosts | null>(null);
    
    getUserAndPosts(userId:number) {
        this.http.get<OtherUserAndPosts>(`${environment.userUrl}/userAndPosts/${userId}`)
        .subscribe(userAndPostsInfo => this.userAndPostsSubject.next(userAndPostsInfo));
    }

    myProfileInfoSignal = signal<UserAndPosts | null>(null);
    
    getMyUserAndPosts(){
        this.http.get<UserAndPosts>(`${environment.userUrl}/myUserAndPosts`)
        .subscribe(info => {
            this.myProfileInfoSignal.set(info);
            this.spinner.isOtherThingLoading.set(false);
        });
    }

          
  uploadImage(data:FormData):Observable<any>{
    return this.http.post("https://api.cloudinary.com/v1_1/dyihpj2hw/image/upload", data);
  }

  uploadProfilePic(image:FormData){
    return this.http.post("https://api.cloudinary.com/v1_1/dyihpj2hw/image/upload", image);
  }

  blockUser(otherUserId:number):Observable<any>{
    return this.http.put(`${environment.userUrl}/blockOrUnlock/${otherUserId}`, {});
  }
    constructor(private readonly http:HttpClient, private spinner:SpinnerService) { }
    
}