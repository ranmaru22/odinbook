import express, { Request, Response } from "express";

class UserRouter {
    public router: express.Router;

    constructor() {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes(): void {
        this.router.get("/", (req: Request, res: Response) => res.send("Hello User"));
    }
}

export default new UserRouter().router;