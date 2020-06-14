import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import auth from "../services/auth";
import UserController from "../controllers/userController";

class UserRouter {
    public router: express.Router;

    constructor() {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes(): void {
        this.router.get("/", auth.protectRoute, UserController.indexGet);
        this.router.post("/login", passport.authenticate("local", {
            successRedirect: "/user",
            failureRedirect: "/"
        }));
        this.router.get("/logout", (req: Request, res: Response, next: NextFunction) => {
            req.logout();
            res.redirect("/");
        });
        this.router.post("/new", auth.protectRoute, UserController.userValidationChain, UserController.register);
        this.router.get("/:id", auth.protectRoute, UserController.profileGet);
    }
}

export default new UserRouter().router;