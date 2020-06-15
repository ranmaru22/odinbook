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
    status: { type: String }
});

profileSchema.virtual("posts", {
    ref: "Post",
    foreignField: "author",
    localField: "owner",
    match: { parent: { $exists: false } }
});

const profileModel = mongoose.model<IProfile>("Profile", profileSchema);

export default profileModel;