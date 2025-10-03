export interface Notification {
    id          :number,
    postId      :number,
    createdAt   :Date,
    actorId     :number,
    imageUrl    :string,
    isRead      :boolean,
    status      :string,
    type        :string,
    username    :string
}