import mongoose from "mongoose";
import { IUser } from "./user";

export interface IPost extends mongoose.Document {
    text: string;
    author: IUser | string;
    likes: number;
    dateposted: Date;
    parent?: IPost | string;
    url: string;
}

const postSchema = new mongoose.Schema<IPost>({
    text: { type: String, required: true, minlength: 3 },
    author: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    likes: { type: Number, default: 0 },
    dateposted: { type: Date, default: Date.now },
    parent: { type: mongoose.Types.ObjectId, ref: "Post" }
});

postSchema.virtual("replies", {
    ref: "Post",
    localField: "_id",
    foreinField: "parent"
});

const postModel = mongoose.model<IPost>("Post", postSchema);

export default postModel;