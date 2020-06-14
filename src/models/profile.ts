import mongoose from "mongoose";
import { IUser } from "./user";
import { IPost } from "./post";

export interface IProfile extends mongoose.Document {
    owner: IUser | string;
    picture?: string;
    status?: string;
    posts?: IPost[] | string[];
}

const profileSchema = new mongoose.Schema({
    owner: { type: mongoose.Types.ObjectId, ref: "User", required: true, unique: true },
    picture: { type: String },
    status: { type: String },
    posts: [{ type: mongoose.Types.ObjectId, ref: "Post" }]
});

const profileModel = mongoose.model<IProfile>("Profile", profileSchema);

export default profileModel;