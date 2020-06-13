import mongoose from "mongoose";
import { IUser } from "./user";

export interface IStatusUpdate extends mongoose.Document {
    text: string;
    author: IUser | string;
    likes: number;
    dateposted: Date;
}

const statusUpdateSchema = new mongoose.Schema({
    text: { type: String, required: true, min: 3 },
    author: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    likes: { type: Number, default: 0 },
    dateposted: { type: Date, default: Date.now }
});

const statusUpdateModel = mongoose.model<IStatusUpdate>("StatusUpdate", statusUpdateSchema);

export default statusUpdateModel;