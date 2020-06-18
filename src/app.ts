import express, { Request, Response, NextFunction } from "express";
import path from "path";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocal from "passport-local";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

import IndexRouter from "./routes/indexRouter";
import UserRouter from "./routes/userRouter";
import PostsRouter from "./routes/postsRouter";

import User, { IUser } from "./models/user";

class App {
    public express: express.Application;
    public port: number;
    private db: mongoose.Connection;

    constructor() {
        this.express = express();
        this.port = process.env.PORT ? Number(process.env.PORT) : 3000;
        this.setupExpress();
        // Define database
        this.db = this.setupDatabase();
        this.db.on("error", console.error.bind(console, "MongoDB connection error"));
        // Define middleware
        this.setupMiddleware();
        // Define routes
        this.mountRoutes();
        // Define error handler
        this.express.use(this.errorHandler);
    }

    private setupExpress(): void {
        this.express.set("views", path.join(__dirname, "../views"));
        this.express.set("view engine", "pug");
        this.express.set("port", this.port);
    }

    private setupDatabase(): mongoose.Connection {
        const mongoOpts = { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: true, useCreateIndex: true }
        mongoose.connect(process.env.MONGODB_URI as string, mongoOpts);
        return mongoose.connection;
    }

    private defineStrategy(): passportLocal.Strategy {
        return new passportLocal.Strategy({ usernameField: "email", passwordField: "password" },
            async (email: string, password: string, done: Function) => {
                try {
                    const user = await User.findOne({ email: email }).exec();
                    if (!user) {
                        return done(null, false, { msg: "User not found." });
                    } else {
                        return await bcrypt.compare(password, user.password)
                            ? done(null, user)
                            : done(null, false, { msg: "Incorrect password." });
                    }
                } catch (err) {
                    return done(err);
                }
            });
    }

    private setupPassport(): void {
        passport.use(this.defineStrategy());
        passport.serializeUser((user: IUser, done: Function) => {
            done(null, user.id);
        });
        passport.deserializeUser(async (id: string, done: Function) => {
            try {
                const user = await User.findById(id).exec();
                done(null, user);
            } catch (err) {
                done(err);
            }
        });
        this.express.use(passport.initialize());
        this.express.use(passport.session());
    }

    private setupMiddleware(): void {
        this.express.use(session({ secret: process.env.SESSION_SECRET as string, resave: true, saveUninitialized: true }));
        this.setupPassport();
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(cookieParser());
        this.express.use(express.static(path.join(__dirname, "../public")));
        this.express.use(this.passUserObject);
    }

    private mountRoutes(): void {
        this.express.use("/", IndexRouter);
        this.express.use("/user", UserRouter);
        this.express.use("/posts", PostsRouter);
    }

    private passUserObject(req: Request, res: Response, next: NextFunction): void {
        res.locals.currentUser = req.user;
        next();
    }

    private errorHandler(err: Error, req: Request, res: Response, next?: NextFunction): void {
        res.locals.message = err.message;
        res.locals.error = err;
        res.status(500).render("error");
    }
}

export default new App().express;
