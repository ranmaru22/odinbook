import { Request, Response, NextFunction } from "express";
import Post, { IPost } from "../models/post";
import User, { IUser } from "../models/user";
import Profile, { IProfile } from "../models/profile";

namespace Auth {
    export function protectRoute(req: Request, res: Response, next: NextFunction): void {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect("/");
        }
    }

    export async function confirmOwnerPost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const post = await Post.findById(req.params.id).populate("author").exec();
            if (post?.author.equals((req.user as IUser)._id)) {
                next();
            } else if (req.body._method === "PATCH" && req.body._query === "like") {
                next();
            } else {
                res.status(401).redirect("back");
            }
        } catch (err) {
            return next(err);
        }
    }

    export async function confirmOwnerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById(req.params.id).exec();
            if (!user) {
                res.status(404).redirect("back");
            } else {
                const profile = await Profile.findOne({ owner: user }).exec();
                if (profile?.owner.equals((req.user as IUser)._id)) {
                    next();
                } else {
                    res.status(401).redirect("back");
                }
            }
        } catch (err) {
            return next(err);
        }
    }
}

export default Auth;
