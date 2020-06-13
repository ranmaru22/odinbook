import { Request, Response } from "express";

/*
 * GET / - Homepage
*/

export default class IndexController {
    static index(req: Request, res: Response): void {
        return res.render("index");
    }
}

