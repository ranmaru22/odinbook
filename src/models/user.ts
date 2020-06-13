import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    joindate: Date;
    friends: IUser[] | string[];
}

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, min: 3 },
    email: { type: String, required: true, unique: true, min: 3 },
    password: { type: String, required: true },
    joindate: { type: Date, default: Date.now },
    friends: [{ type: mongoose.Types.ObjectId, ref: "User" }]
});

const userModel = mongoose.model<IUser>("User", userSchema);

export default userModel;