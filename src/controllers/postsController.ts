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
                const savedPost = await post.save();
                return res.redirect("back");
            }
        } catch (err) {
            return next(err);
        }
    }

    static async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const x = await Post.findOneAndDelete({ _id: req.params.id }).exec();
            res.redirect("back");
        } catch (err) {
            return next(err);
        }
    }
}

