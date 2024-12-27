import { OtherUserProfile } from "./other-user-profile-interface";
import { Post } from "./post.interface";

export interface OtherUserAndPosts {
    otherUserProfile:OtherUserProfile,
    otherUserPosts: Post[]
}