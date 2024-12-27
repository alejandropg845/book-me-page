
import { Post } from "./post.interface";
import { UserInfo } from "./user-info.interface";

export interface UserAndPosts {
    user:UserInfo,
    userPosts: Post []
}