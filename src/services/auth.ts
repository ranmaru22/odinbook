import { Request, Response, NextFunction } from "express";

namespace Auth {
    export function protectRoute(req: Request, res: Response, next: NextFunction): void {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect("/");
        }
    }
}

export default Auth;