import express, { Request, Response } from "express";

class IndexRouter {
    public router: express.Router;

    constructor() {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes(): void {
        this.router.get("/", (req: Request, res: Response) => res.send("Hello World"));
    }
}

export default new IndexRouter().router;