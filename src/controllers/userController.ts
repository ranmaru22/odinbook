import { Request, Response, NextFunction } from "express";
import * as validator from "express-validator";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import Multer from "../services/multer";

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

    static userUpdateValidationChain: validator.ValidationChain[] = [
        validator.body("name").trim().isLength({ min: 3 }).withMessage("Name can't be less than 3 characters."),
        validator.body("email").trim()
            .isEmail().withMessage("Invalid email address")
            .custom(async (val: string, { req }): Promise<string> => {
                const user = await User.findOne({ email: val }).exec();
                if (user && !user.equals(req.user)) {
                    throw new Error("A user with that email address already exists.");
                } else {
                    return val;
                }
            }),
        validator.body("currentPassword").trim()
            .custom(async (val: string, { req }): Promise<string> => {
                const user = await User.findById(req.params?.id).exec();
                const match = await bcrypt.compare(val, user!.password);
                if (!match) {
                    throw new Error("Wrong password.");
                } else {
                    return val;
                }
            }),
        validator.body("password").optional({ checkFalsy: true }).trim()
            .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long.")
            .custom((val: string, { req }): string => {
                if (val !== req.body.confirmPassword) {
                    throw new Error("Passwords don't match.");
                } else {
                    return val;
                }
            })
    ];

    private static async getPwdHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    }

    private static uploadImage(image: string, userId: string): Promise<cloudinary.UploadApiResponse> {
        return new Promise((resolve, reject) => {
            cloudinary.v2.uploader.upload(image, { public_id: `odinbook_profile_images/${userId}`, overwrite: true },
                (err, url) => {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve(url);
                    }
                }
            );
        });
    }

    private static deleteImage(userId: string): Promise<cloudinary.DeleteApiResponse> {
        return new Promise((resolve, reject) => {
            cloudinary.v2.uploader.destroy(`odinbook_profile_images/${userId}`, (err, result) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        });
    }

    private static async loadPosts(profileOwner: IUser, includeFriendPosts?: boolean): Promise<IPost[]> {
        try {
            const profile = await Profile
                .findOne({ owner: profileOwner })
                .populate({
                    path: "posts",
                    populate: [
                        { path: "author", select: [ "name", "picture" ] },
                        { path: "replies", populate: { path: "author", select: [ "name", "picture" ] } },
                        { path: "replyCount" },
                    ],
                    options: { sort: { "dateposted": -1 } }
                })
                .exec();
            if (!profile) {
                return new Array();
            } else if (!includeFriendPosts) {
                return profile.posts ?? new Array();
            } else {
                const friendPromises = await Promise.all(
                    profileOwner.friends?.map(x => UserController.loadPosts(x))!
                ).catch(err => err);
                const posts = friendPromises
                    .reduce((acc: IPost[], val: IPost) => acc.concat(val), profile.posts)
                    .sort((a: IPost, b: IPost) => a.dateposted > b.dateposted ? -1 : a.dateposted < b.dateposted ? 1 : 0);
                return posts ?? [];
            }
        } catch (err) {
            return err;
        }
    }

    static async indexGet(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById((req.user as IUser)._id).exec();
            if (user) {
                const posts = await UserController.loadPosts(user, true);
                res.render("profile_timeline", { user, posts });
            } else {
                res.status(404).redirect("/");
            }
        } catch (err) {
            return next(err);
        }
    }
    
    static registerGet(req: Request, res: Response, next: NextFunction): void {
       res.render("register");
    }

    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validationErrors = validator.validationResult(req);
            if (!validationErrors.isEmpty()) {
                res.render("register", { errors: validationErrors.array() });
            } else {
                const passHash = await UserController.getPwdHash(req.body.password);
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: passHash
                });
                const savedUser = await user.save();
                const profile = new Profile({ owner: savedUser });
                await profile.save();
                res.redirect(307, "/user/login");
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

    static async allUsersGet(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const users = await User.find().exec();
            if (!users) {
                res.status(500).redirect("/");
            } else {
                res.render("userlist", { users });
            }
        } catch (err) {
            return next(err);
        }
    }

    private static async profileGetPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById(req.params.id).exec();
            if (!user) {
                res.status(404).render("profile", { notFound: true });
            } else {
                const profile = await Profile.findOne({ owner: user }).exec();
                const posts = await UserController.loadPosts(user);
                const friendStatus =
                    await User.findOne({ _id: req.params.id, friends: res.locals.currentUser }).exec()
                        ? "friend"
                        : await User.findOne({ _id: req.params.id, sentFriendRequests: res.locals.currentUser }).exec()
                            || await User.findOne({ _id: req.params.id, recvFriendRequests: res.locals.currentUser }).exec()
                            ? "pending"
                            : "none";
                res.render("profile", { user, profile, posts, friendStatus });
            }
        } catch (err) {
            return next(err);
        }
    }

    private static async profileGetFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById(req.params.id)
                .populate({ path: "friends", select: [ "name", "picture" ] })
                .populate({ path: "recvFriendRequests", select: [ "name", "picture" ] })
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
                res.render("profile_friends", { user, profile, friendStatus });
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

    static async profileUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const validationErrors = validator.validationResult(req);
            const user = await User.findById(req.params.id).exec();
            const profile = await Profile.findOne({ owner: user! }).exec();
            if (!user || !profile) {
                res.status(404).redirect("back");
            } else if (!validationErrors.isEmpty()) {
                res.render("profile_edit", { user, profile, errors: validationErrors.array() });
            } else {
                const passHash = req.body.password
                    ? await UserController.getPwdHash(req.body.password)
                    : undefined;
                const userChanges = {
                    name: req.body.name || user.name,
                    email: req.body.email || user.email,
                    password: passHash || user.password,
                    picture: user.picture || ""
                };
                const profileChanges = {
                    status: req.body.status,
                };
                if (req.body.deleteImage && user.picture) {
                    await UserController.deleteImage(user._id);
                    userChanges.picture = "";
                } else if (req.file) {
                    const image = await UserController.uploadImage(Multer.dataUri(req).content as string, user._id);
                    userChanges.picture = image.secure_url;
                }
                await User.updateOne(user, userChanges);
                await Profile.updateOne(profile, profileChanges);
                res.redirect(user.url);
            }
        } catch (err) {
            return next(err);
        }
    }
}
