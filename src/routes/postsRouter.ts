import express, { Request, Response, NextFunction } from "express";
import auth from "../services/auth";
import PostsController from "../controllers/postsController";

class IndexRouter {
    public router: express.Router;

    constructor() {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes(): void {
        this.router.get("/", PostsController.index);
        this.router.post("/new", auth.protectRoute, PostsController.postValidationChain, PostsController.newPost);
    }
}

export default new IndexRouter().router;