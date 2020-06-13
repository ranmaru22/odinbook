import mongoose from "mongoose";
import { IUser } from "./user";
import { IPost } from "./post";

export interface IProfile extends mongoose.Document {
    owner: IUser | string;
    picture: string;
}

const profileSchema = new mongoose.Schema({

});

const profileModel = mongoose.model<IProfile>("Profile", profileSchema);

export default profileModel;