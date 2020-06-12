import express from "express";

class App {
    public express: express.Application;

    constructor() {
        this.express = express();
        this.mountRoutes();
    }

    private mountRoutes(): void {
        const router = express.Router();
        router.get("/", (req, res) => res.json({ "msg": "Hello World" }));

        this.express.use("/", router);
    }
}

export default new App().express;