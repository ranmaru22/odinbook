import express from "express";
import path from "path";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocal from "passport-local";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

import IndexRouter from "./routes/indexRouter";
import UserRouter from "./routes/userRouter";

import User, { IUser } from "./models/user";
import StatusUpdate, { IStatusUpdate } from "./models/statusUpdate";

class App {
    public express: express.Application;
    public port: number;
    private db: mongoose.Connection;
    private indexRouter: express.Router;
    private userRouter: express.Router;

    constructor() {
        this.express = express();
        this.port = process.env.PORT ? Number(process.env.PORT) : 3000;
        this.express.set("views", path.join(__dirname, "views"));
        this.express.set("view engine", "pug");
        this.express.set("port", this.port);
        // Define database
        this.db = this.setupDatabase();
        this.db.on("error", console.error.bind(console, "MongoDB connection error"));
        // Define middleware
        this.express.use(session({ secret: process.env.SESSION_SECRET as string, resave: true, saveUninitialized: true }));
        this.setupPassport();
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(cookieParser());
        this.express.use(express.static(path.join(__dirname, "public")));
        this.express.use(this.passUserObject);
        // Define routes
        this.indexRouter = IndexRouter;
        this.userRouter = UserRouter;
        this.mountRoutes();
        // Define error handler
        this.express.use(this.errorHandler);
    }

    private setupDatabase(): mongoose.Connection {
        const mongoOpts = { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: true, useCreateIndex: true }
        mongoose.connect(process.env.MONGODB_URI as string, mongoOpts);
        return mongoose.connection;
    }

    private defineStrategy(): passportLocal.Strategy {
        return new passportLocal.Strategy(async (email: string, password: string, done: Function) => {
            try {
                const user = await User.findOne({ email: email });
                if (!user) {
                    return done(null, false, { msg: "User not found." });
                } else {
                    const passwordMatch = await bcrypt.compare(password, user.password);
                    if (passwordMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { msg: "Incorrect password. " });
                    }
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
                const user = User.findById(id);
                done(null, user);
            } catch (err) {
                done(err);
            }
        });
        this.express.use(passport.initialize());
        this.express.use(passport.session());
    }

    private mountRoutes(): void {
        this.express.use("/", this.indexRouter);
        this.express.use("/user", this.userRouter);
    }

    private passUserObject(req: express.Request, res: express.Response, next: express.NextFunction): void {
        res.locals.currentUser = req.user;
        next();
    }

    private errorHandler(err: Error, req: express.Request, res: express.Response, next: express.NextFunction): express.Response {
        return res.status(400).json({ status: 400, data: null, msg: err.message });
    }
}

export default new App().express;