import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import UserController from "../controllers/userController";

class UserRouter {
    public router: express.Router;

    constructor() {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes(): void {
        this.router.get("/", UserController.indexGet);
        this.router.post("/new", UserController.userValidationChain, UserController.register);
        this.router.get("/:id", UserController.profileGet);
        this.router.post("/login", passport.authenticate("local", {
            successRedirect: "/",
            failureRedirect: "/"
        }));
        this.router.get("/logout", (req: Request, res: Response, next: NextFunction) => {
            req.logout();
            res.redirect("/");
        });
    }
}

export default new UserRouter().router;