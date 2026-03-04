import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { checkOtpRestrictions, handleForgotPassword, sendOtp, trackOtpRequests, validateRegistrationData, verifyForgotPasswordOtp, verifyOtp } from "./utils/auth.helper.js";

import { AuthError, ValidationError } from "../../../../../packages/error-handler/index.js";
import prisma from "../../../../../packages/libs/prisma/index.js";
import { setCookie } from "./utils/cookies/setCookie.js";
import redis from "../../../../../packages/libs/redis/index.js";


// Register a new user 
export const userRegistration = async (req: Request, res: Response, next: NextFunction) => {

    /* #swagger.parameters['body'] = {
            in: 'body',
            description: 'User registration data',
            schema: {
                $firstname: 'saminu',
                $lastname: 'hansaja',
                $email: 'saminuhansaja.w@gmail.com',
                $phonenumber: '0767406952',
                $password: '123456'
            }
    } */

    try {
        validateRegistrationData(req.body);

        const {firstname, email} = req.body;

        const existingUser = await prisma.users.findUnique({where: {email}});

        if(existingUser) {
            throw new ValidationError("User already exists with this email!");
        }

        await checkOtpRestrictions(email); 
        await trackOtpRequests(email);
        await sendOtp(firstname, email, "user-activation-mail");

        res.status(200).json({
            message: "OTP sent to email. Please verify your account.",
        })

    } catch (error) {
        return next(error);
    }
}


// Verify user with otp
export const verifyUser = async(req: Request, res: Response, next: NextFunction) =>{

    /* #swagger.parameters['body'] = {
            in: 'body',
            description: 'User registration verify',
            schema: {
                "email": "saminuhansaja.w@gmail.com",
                "otp": "any",
                "password": "123456",
                "firstname": "saminu",
                "lastname": "hansaja",
                "phonenumber": "0767406952"
                }
    } */

    try{
       const { email, otp, password, firstname, lastname, phonenumber} = req.body;
       if(!email || !otp || !password || !firstname || !lastname || !phonenumber) {
            return next(new ValidationError("All fields are required!"));
       } 
       const existingUser = await prisma.users.findUnique({where: {email}}); 

       if(existingUser) {
        return next(new ValidationError("User already exists with this email!"));
       }

       await verifyOtp(email, otp, next);
       const hashedPassword = await bcrypt.hash(password, 10);

       await prisma.users.create({
        data: {firstname, lastname, email, phonenumber, password: hashedPassword},
       });

       res.status(200).json({
        success: true,
        message: "User registered successfully!",
       });


    } catch (error) {
        return next(error);
    }
}

// Login user
export const loginUser = async(req: Request, res: Response, next: NextFunction) =>{
    try{
       const {email, password} = req.body;
       
       if(!email || !password) {
        return next(new ValidationError("Email and password are required!"));
       }

       const user = await prisma.users.findUnique({where: {email}});

       if(!user) return next(new ValidationError("User doesn't exsist!"));

       //verify password
       const isMatch = await bcrypt.compare(password, user.password!);
       if(!isMatch) {
        return next(new ValidationError("Invalid password!"))
       }

       //generate access and refresh token
       const accessToken = jwt.sign(
        {id: user.id, role: user.role},
        process.env.ACCESS_TOKEN_JWT_SECRET as string,
        {
            expiresIn: "15min",
        }
       );

       const refreshToken = jwt.sign(
        {id: user.id, role: user.role},
        process.env.REFRESH_TOKEN_JWT_SECRET as string,
        {
            expiresIn: "7d",
        }
       );

       //store the refresh and access token in an httpOnly secure cookie
       setCookie(res, "refresh_token", refreshToken);
       setCookie(res, "access_token", accessToken);

       res.status(200).json({
        message: "Login successfull!",
        user: {id: user.id, email: user.email, phonenumber: user.phonenumber, firstname: user.firstname, lastname: user.lastname},
       })

    } catch (error) {
        return next(error);
    }
}

// Refresh token
export const refreshToken = async(req:any, res:Response, next:NextFunction) => {
    try{
        const refreshToken = req.cookies["refresh_token"] || req.headers.authorization?.split(" ")[1];

        if(!refreshToken) {
            throw new ValidationError("Unauthorized! No refresh token.");
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_JWT_SECRET as string
        ) as {id: string, role: string};

        if(!decoded || !decoded.id || !decoded.role) {
            throw new JsonWebTokenError('Forbidden! Invalid refresh token.')
        }

        let account;
        if(decoded.role === "user") {
            account = await prisma.users.findUnique({
            where: {id: decoded.id}
        })}
        

        if(!account) {
            throw new AuthError("Forbidden! User/Seller not found");
        }

        const newAccessToken = jwt.sign(
        { id: decoded.id, role: decoded.role },
        process.env.ACCESS_TOKEN_JWT_SECRET as string,
        { expiresIn: "15min" }
        );

        
        setCookie(res, "access_token", newAccessToken);
       
        req.role = decoded.role;

        return res.status(201).json({success: true})

    } catch(error) {
        return next(error);
    }
}

// Get logged in user info
export const getUser = async(req:any, res:Response, next:NextFunction) => {
    try {
        const user = req.user;
        res.status(201).json({
            success: true,
            user,
        });

    } catch(error) {
        next(error);
    }
}

// User forgot password
export const userForgotPassword = async (req:Request, res:Response, next:NextFunction) => {
    await handleForgotPassword(req,res,next);
}

// Verify the forgot password otp
export const verifyUserForgotPassword = async(req:Request, res:Response, next:NextFunction) => {
    await verifyForgotPasswordOtp(req,res,next);
}

// Reset uesr password
export const resetUserPassword = async (req:Request, res:Response, next:NextFunction) => {
    try{
        const { email, newPassword} = req.body;
        if(!email || !newPassword) {
            return next(new ValidationError("Email and new password are required!"));
        }

        // We look for the key we set in the helper above
        const isAuthorized = await redis.get(`reset_authorized:${email}`);

        if (!isAuthorized) {
            return next(new ValidationError("Session expired or unauthorized. Please verify OTP again."));
        }

        const user = await prisma.users.findUnique({where: {email}});
        if(!user) return next(new ValidationError("User not found."));

        const isSamePassword = await bcrypt.compare(newPassword, user.password!);
        if(isSamePassword) {
            return next(new ValidationError("New password cannot be the same as the old password!"))
        }

        //hash the new password

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.users.update({
            where: {email},
            data: {password: hashedPassword},
        });

        await redis.del(`reset_authorized:${email}`);

        res.status(200).json({
            message: "Password reset successfully!",
        });

    } catch(error) {
        next(error)
    }
}

// Log out user
export const logOutUser = async (req: any, res: Response) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");

  res.status(201).json({
    success: true,
  });
};