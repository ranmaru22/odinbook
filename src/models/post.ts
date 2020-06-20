import mongoose from "mongoose";
import moment from "moment";
import { IUser } from "./user";

export interface IPost extends mongoose.Document {
    text: string;
    author: IUser;
    likes: number;
    likedBy?: IUser[];
    dateposted: Date;
    parent?: IPost;
    replies?: IPost[];
    url: string;
}

const postSchema = new mongoose.Schema<IPost>({
    text: { type: String, required: true, minlength: 3 },
    author: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    likedBy: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    dateposted: { type: Date, default: Date.now },
    parent: { type: mongoose.Types.ObjectId, ref: "Post" }
});

postSchema.pre("findOneAndDelete", async function (this: IPost, next: mongoose.HookNextFunction): Promise<void> {
    try {
        const post = await postModel.findOne(this).populate("replies").exec();
        post?.replies?.forEach(async (child: any) => {
            await postModel.findOneAndDelete({ _id: child._id });
        });
    } catch (err) {
        console.error(err);
    } finally {
        next();
    }
});

postSchema.virtual("likes")
    .get(function (this: IPost): number {
        return this.likedBy?.length ?? 0;
    });

postSchema.virtual("replies", {
    ref: "Post",
    foreignField: "parent",
    localField: "_id",
    options: { sort: { "dateposted": -1 } }
});

postSchema.virtual("replyCount", {
    ref: "Post",
    foreignField: "parent",
    localField: "_id",
    count: true
});

postSchema.virtual("url")
    .get((function (this: IPost): string { return `/posts/${this._id}`; }));

postSchema.virtual("datepostedRelative")
    .get(function (this: IPost): string {
        return moment(this.dateposted).fromNow();
    });

export const postModel = mongoose.model<IPost>("Post", postSchema);

export default postModel;
