import { Request, Response, NextFunction } from "express";
import * as validator from "express-validator";

import User, { IUser } from "../models/user";
import Profile, { IProfile } from "../models/profile";
import Post, { IPost } from "../models/post";

/*
 * GET / - Homepage
*/

export default class PostsController {
    static postValidationChain: validator.ValidationChain[] = [
        validator.body("post").trim().isLength({ min: 3 }).withMessage("Text can't be less than 3 characters.")
    ];

    static index(req: Request, res: Response): Response {
        return res.send("index");
    }

    static async newPost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validationErrors = validator.validationResult(req);
            if (!validationErrors.isEmpty()) {
                return res.redirect(400, "back");
            } else {
                const post = new Post({
                    text: req.body.post,
                    author: req.user
                });
                if (req.body.parentpost) {
                    post.parent = req.body.parentpost;
                }
                await post.save();
                return res.redirect("back");
            }
        } catch (err) {
            return next(err);
        }
    }

    static async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await Post.findOneAndDelete({ _id: req.params.id }).exec();
            res.redirect("back");
        } catch (err) {
            return next(err);
        }
    }

    static async likePost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const post = await Post.findOne({ _id: req.params.id }).exec();
            if (post?.likedBy?.indexOf((req.user as IUser)._id) === -1) {
                await Post.updateOne(post!, { $push: { likedBy: req.user as IUser } });
            } else {
                await Post.updateOne(post!, { $pull: { likedBy: (req.user as IUser)._id } });
            }
            await post?.save();
            res.redirect("back");
        } catch (err) {
            return next(err);
        }
    }
}

