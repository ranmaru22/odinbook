import express from "express";
import IndexController from "../controllers/indexController";

class IndexRouter {
    public router: express.Router;

    constructor() {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes(): void {
        this.router.get("/", IndexController.index);
    }
}

export default new IndexRouter().router;
