import { NextFunction, Response } from "express"
import jwt from "jsonwebtoken";
import prisma from "../libs/prisma";

const isAuthenticated = async(req:any, res:Response, next:NextFunction) => {
    try{
        const token = req.cookies["access_token"] || req.headers.authorization?.split(" ")[1];

        if(!token) {
            return res.status(401).json({
                message: "Unauthorized! Token missing."
            })
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_JWT_SECRET!) as {
            id:string,
            role: "user" | "admin",
        }

        if(!decoded) {
            return res.status(401).json({
                message: "Unauthorized! Invalid token"
            })
        }

        let account;

        if(decoded.role === "user" || "admin") {
            account = await prisma.users.findUnique({where : {id: decoded.id}});
        
            req.user = account;
        }

        
        if(!account) {
            return res.status(401).json({
                message: "Account not found"
            })
        }
        
        req.role = decoded.role;

        return next();
    } catch(error) {
        return res.status(401).json({
            message: "Middleware: Something went wrong."
        })
    }
}

export default isAuthenticated;