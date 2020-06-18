import { Request, Response, NextFunction } from "express";
import * as validator from "express-validator";
import bcrypt from "bcrypt";

import User, { IUser } from "../models/user";
import Post, { IPost } from "../models/post";
import Profile, { IProfile } from "../models/profile";

/*
 * GET / - Own profile, same as GET /<yourId>
 * POST / - Add a new user
 * GET /:id - Profile of some user
 * PATCH /:id - Update profile
 * DELETE /:id - Delete profile
*/

export default abstract class UserController {
    static userValidationChain: validator.ValidationChain[] = [
        validator.body("name").trim().isLength({ min: 3 }).withMessage("Name can't be less than 3 characters."),
        validator.body("email").trim()
            .isEmail().withMessage("Invalid email address")
            .custom(async (val: string): Promise<string> => {
                if (await User.findOne({ email: val }).exec()) {
                    throw new Error("A user with that email address already exists.");
                } else {
                    return val;
                }
            }),
        validator.body("password").trim()
            .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long.")
            .custom((val: string, { req }): string => {
                if (val !== req.body.confirmPassword) {
                    throw new Error("Passwords don't match.");
                } else {
                    return val;
                }
            })
    ];

    static async indexGet(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById((req.user as IUser)._id).exec();
            if (user) {
                res.redirect(user.url);
            } else {
                res.redirect("/");
            }
        } catch (err) {
            return next(err);
        }
    }

    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validationErrors = validator.validationResult(req);
            if (!validationErrors.isEmpty()) {
                return res.render("index", { errors: validationErrors.array() });
            } else {
                const salt = await bcrypt.genSalt(10);
                const passHash = await bcrypt.hash(req.body.password, salt);
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: passHash
                });
                const savedUser = await user.save();
                const profile = new Profile({ owner: savedUser });
                await profile.save();
                return res.redirect(307, "/user/login");
            }
        } catch (err) {
            return next(err);
        }
    }

    static profileGet(req: Request, res: Response, next: NextFunction): void {
        if (req.params.page === "friends") {
            UserController.profileGetFriends(req, res, next);
        } else {
            UserController.profileGetPosts(req, res, next);
        }
    }

    private static async profileGetPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById(req.params.id).exec();
            if (!user) {
                res.status(404).render("profile", { notFound: true });
            } else {
                const profile = await Profile
                    .findOne({ owner: user })
                    .populate({
                        path: "posts",
                        populate: [
                            { path: "author", select: "name" },
                            { path: "replies", populate: { path: "author", select: "name" } },
                            { path: "replyCount" },
                        ],
                        options: { sort: { "dateposted": -1 } }
                    })
                    .exec();
                const friendStatus =
                    await User.findOne({ _id: req.params.id, friends: res.locals.currentUser }).exec()
                        ? "friend"
                        : await User.findOne({ _id: req.params.id, sentFriendRequests: res.locals.currentUser }).exec()
                            || await User.findOne({ _id: req.params.id, sentFriendRequests: res.locals.currentUser }).exec()
                            ? "pending"
                            : "none";
                const isFriend = await User.findOne({ _id: req.params.id, friends: res.locals.currentUser }).exec() !== null;
                res.render("profile", { user: user, profile: profile, friendStatus: friendStatus });
            }
        } catch (err) {
            return next(err);
        }
    }

    private static async profileGetFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById(req.params.id)
                .populate({ path: "friends", select: "name" })
                .populate({ path: "recvFriendRequests" })
                .exec();
            if (!user) {
                res.status(404).render("profile", { notFound: true });
            } else {
                const profile = await Profile.findOne({ owner: user });
                const friendStatus =
                    await User.findOne({ _id: req.params.id, friends: res.locals.currentUser }).exec()
                        ? "friend"
                        : await User.findOne({ _id: req.params.id, sentFriendRequests: res.locals.currentUser }).exec()
                            || await User.findOne({ _id: req.params.id, sentFriendRequests: res.locals.currentUser }).exec()
                            ? "pending"
                            : "none";
                res.render("profile_friends", { user: user, profile: profile, friendStatus: friendStatus });
            }
        } catch (err) {
            return next(err);
        }
    }

    static async sendFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const friend = await User.findById(req.params.id).exec();
            const user = await User.findOne(req.user).exec();
            if (!friend || !user) {
                res.status(404).redirect("back");
            } else {
                if (friend.recvFriendRequests?.indexOf(user._id) === -1) {
                    await User.updateOne(friend, { $push: { recvFriendRequests: user } });
                }
                if (user.sentFriendRequests?.indexOf(friend._id) === -1) {
                    await User.updateOne(user, { $push: { sentFriendRequests: friend } });
                }
                next();
            }
        } catch (err) {
            return next(err);
        }
    }

    static async acceptFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findOne(req.user).exec();
            const friend = await User.findById(req.params.id).exec();
            if (!friend || !user) {
                res.status(404).redirect("back");
            } else {
                await User.updateOne(user, {
                    $pull: { recvFriendRequests: friend?._id },
                    $push: { friends: friend }
                });
                await User.updateOne(friend, {
                    $pull: { sentFriendRequests: user._id },
                    $push: { friends: user }
                });
                res.redirect("back");
            }
        } catch (err) {
            return next(err);
        }
    }

    static async declineFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findOne(req.user).exec();
            const friend = await User.findById(req.params.id).exec();
            if (!friend || !user) {
                res.status(404).redirect("back");
            } else {
                await User.updateOne(user, { $pull: { recvFriendRequests: friend?._id } });
                await User.updateOne(friend, { $pull: { sentFriendRequests: user._id } });
                res.redirect("back");
            }
        } catch (err) {
            return next(err);
        }
    }

    static async profileGetEdit(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById(req.params.id).exec();
            if (!user) {
                res.status(404).redirect("back");
            } else {
                const profile = await Profile.findOne({ owner: user }).exec();
                res.render("profile_edit", { user, profile });
            }
        } catch (err) {
            return next(err);
        }
    }
}
