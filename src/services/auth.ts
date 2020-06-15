import { Request, Response, NextFunction } from "express";
import Post, { IPost } from "../models/post";
import User, { IUser } from "../models/user";
import Profile, { IProfile } from "../models/profile";
import mongoose from "mongoose";

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
            if ((post?.author as mongoose.Document).equals(req.user as mongoose.Document)) {
                next();
            } else {
                res.redirect("back");
            }
        } catch (err) {
            return next(err);
        }
    }

    export async function confirmOwnerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const profile = await Profile.findById(req.params.id).populate("owner").exec();
            if ((profile?.owner as mongoose.Document).equals(req.user as mongoose.Document)) {
                next();
            } else {
                res.redirect("back");
            }
        } catch (err) {
            return next(err);
        }
    }
}

export default Auth;