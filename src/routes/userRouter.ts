import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import auth from "../services/auth";
import Multer from "../services/multer";
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
        this.router.get("/all", auth.protectRoute, UserController.allUsersGet);
        this.router.get("/new", UserController.registerGet);
        this.router.post("/new", UserController.userValidationChain, UserController.register);
        this.router.get("/:id", auth.protectRoute, UserController.profileGet);
        this.router.get("/:id/edit", auth.protectRoute, auth.confirmOwnerProfile, UserController.profileGetEdit);
        this.router.post("/:id/edit", auth.protectRoute, auth.confirmOwnerProfile, Multer.uploads, UserController.userUpdateValidationChain, UserController.profileUpdate);
        this.router.post("/:id", auth.protectRoute, this.methodHandler, UserController.indexGet);
        this.router.get("/:id/:page", auth.protectRoute, UserController.profileGet);
    }

    private methodHandler(req: Request, res: Response, next: NextFunction): void {
        if (req.body._method === "DELETE") {
            req.method = "DELETE";
            // * What about this route?
            next();
        } else if (req.body._method === "PATCH") {
            req.method = "PATCH";
            switch (req.body._query) {
                case "sendFriendRequest":
                    UserController.sendFriendRequest(req, res, next);
                    break;
                case "acceptFriendRequest":
                    UserController.acceptFriendRequest(req, res, next);
                    break;
                case "declineFriendRequest":
                    UserController.declineFriendRequest(req, res, next);
                    break;
                default: next();
            }
        } else {
            next();
        }
    }
}

export default new UserRouter().router;
