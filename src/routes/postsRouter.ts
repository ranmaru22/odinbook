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
        this.router.get("/", auth.protectRoute, PostsController.index);
        this.router.post("/new", auth.protectRoute, PostsController.postValidationChain, PostsController.newPost);
        this.router.post("/:id", auth.protectRoute, auth.confirmOwnerPost, this.methodHandler, PostsController.index);

    }

    private methodHandler(req: Request, res: Response, next: NextFunction): void {
        if (req.body._method === "DELETE") {
            req.method = "DELETE";
            PostsController.deletePost(req, res, next);
        } else {
            next();
        }
    }
}

export default new IndexRouter().router;