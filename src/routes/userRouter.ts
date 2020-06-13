import express, { Request, Response } from "express";
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
    }
}

export default new UserRouter().router;