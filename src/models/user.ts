import mongoose from "mongoose";
import { IPost } from "./post";

export interface IUser extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    joindate: Date;
    friends?: IUser[] | string[];
    friendRequests?: IUser[] | string[];
    likedPosts?: IPost[] | string[];
    url: string;
    posts: IPost[] | string[];
}

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true, minlength: 3 },
    email: { type: String, required: true, unique: true, minlength: 3 },
    password: { type: String, required: true },
    joindate: { type: Date, default: Date.now },
    friends: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    friendRequests: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    likedPosts: [{ type: mongoose.Types.ObjectId, ref: "Post" }],
});

userSchema.virtual("url")
    .get((function (this: IUser): string { return `/user/${this._id}` }));

userSchema.virtual("posts", {
    ref: "Post",
    localField: "_id",
    foreignField: "author"
});

const userModel = mongoose.model<IUser>("User", userSchema);

export default userModel;