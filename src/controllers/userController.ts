import { Request, Response, NextFunction } from "express";
import * as validator from "express-validator";
import bcrypt from "bcrypt";

import User, { IUser } from "../models/user";

/*
 * GET / - Own profile, same as GET /<yourId>
 * POST / - Add a new user
 * GET /:id - Profile of some user
 * PATCH /:id - Update profile
 * DELETE /:id - Delete profile
*/

export default class UserController {
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

    static indexGet(req: Request, res: Response): Response {
        return res.send("Hello User");
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
                return res.redirect(savedUser.url);
            }
        } catch (err) {
            return next(err);
        }
    }

    static async profileGet(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await User.findById(req.params.id).exec();
            // TODO: find profile
            if (!user) {
                res.status(404).render("profile", { notFound: true });
            } else {
                res.render("profile", { user: user });
            }
        } catch (err) {
            return next(err);
        }
    }
}

