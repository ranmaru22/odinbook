import mongoose from "mongoose";
import { IPost } from "./post";

export interface IUser extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    joindate: Date;
    picture?: string;
    friends?: IUser[];
    sentFriendRequests?: IUser[];
    recvFriendRequests?: IUser[];
    url: string;
    posts: IPost[];
}

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true, minlength: 3 },
    email: { type: String, required: true, unique: true, minlength: 3 },
    password: { type: String, required: true },
    joindate: { type: Date, default: Date.now },
    picture: { type: String },
    friends: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    sentFriendRequests: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    recvFriendRequests: [{ type: mongoose.Types.ObjectId, ref: "User" }]
});

userSchema.virtual("url")
    .get((function (this: IUser): string { return `/user/${this._id}`; }));

userSchema.virtual("posts", {
    ref: "Post",
    localField: "_id",
    foreignField: "author"
});

const userModel = mongoose.model<IUser>("User", userSchema);

export default userModel;
