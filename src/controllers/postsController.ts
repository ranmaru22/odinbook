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
                const author = await User.findById(req.user).exec();
                const post = new Post({
                    text: req.body.post,
                    author: author
                });
                if (req.body.parentpost) {
                    post.parent = req.body.parentpost;
                }
                const savedPost = await post.save();
                if (req.body.profileId) {
                    const success = await Profile.updateOne(
                        { _id: req.body.profileId, owner: req.user },
                        { $push: { posts: savedPost } }
                    );
                    if (success.nModified === 0) {
                        await Post.findOneAndRemove(savedPost).exec();
                    }
                }
                return res.redirect("back");
            }
        } catch (err) {
            return next(err);
        }
    }

    static async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await Post.findByIdAndDelete(req.params.id).exec();
            res.redirect("back");
        } catch (err) {

        }
    }
}

