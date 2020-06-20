import { Request, Response } from "express";

/*
 * GET / - Homepage
*/

export default class IndexController {
    static index(req: Request, res: Response): void {
        if (req.user) {
            res.redirect("/user")
        } else {
            res.render("index");
        }
    }
}

