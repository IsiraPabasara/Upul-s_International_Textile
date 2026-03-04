import type { NextFunction, Request, Response } from "express";

import { sendEmail } from "./sendMail/index.js";
import crypto from 'crypto';
import { ValidationError } from "../../../../../../packages/error-handler/index.js";
import redis from "../../../../../../packages/libs/redis/index.js";
import prisma from "../../../../../../packages/libs/prisma/index.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (data: any) => {
    const { firstname, lastname, email, password, phonenumber} = data;

    if(!firstname || !lastname || !email || !password || !phonenumber) {
        throw new ValidationError("Missing required fields!")
    }

    if(!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format!")
    }
};

export const checkOtpRestrictions = async (email: string) => {
    if (await redis.get(`otp_lock:${email}`)) {
        throw new ValidationError("Account locked! Try again in 30 mins.");
    }
    if (await redis.get(`otp_spam_lock:${email}`)) {
        throw new ValidationError("Too many requests! Wait 1 hour.");
    }
    if (await redis.get(`otp_cooldown:${email}`)) {
        throw new ValidationError("Please wait 1 minute before retrying.");
    }

};

export const trackOtpRequests = async (email:string) => {
    const otpRequestKey = `otp_request_count:${email}`;
    let otpRequests = parseInt( (await redis.get(otpRequestKey)) || "0");

    if(otpRequests > 3) {
        await redis.set(`otp_spam_lock:${email}`, 'locked', "EX", 3600);
        throw new ValidationError("OTP limit reached. Try again in 1 hour.");
    }

    await redis.set(otpRequestKey, otpRequests + 1, "EX", 3600);
};

export const sendOtp = async (name: String, email:string, template:string) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    console.log(email);
    await sendEmail(email, "Verify Your Email", template, {name, otp});
    await redis.set(`otp:${email}`, otp, "EX", 300);
    await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
};


export const verifyOtp = async (email:string, otp:string, next:NextFunction) => {
    const storedOtp = await redis.get(`otp:${email}`);

    if(!storedOtp) {
        throw (new ValidationError("Invalid or expired OTP!"));
    }

    const failedAttemptsKey = `otp_attempts:${email}`;
    const failedAttempts = parseInt(await redis.get(failedAttemptsKey) || "0");

    if(storedOtp != otp) {
        if(failedAttempts >= 3) {
            await redis.set(`otp_lock:${email}`, "locked", "EX", 1800);
            await redis.del(`otp:${email}`, failedAttemptsKey);
            throw new ValidationError("Too many failed attempts. Your account is locked for 30minutes.");
        }
        await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300);
        throw new ValidationError(`Incorrect OTP. ${3 - failedAttempts} attempts left.`)
    }

    await redis.del(`otp:${email}`, failedAttemptsKey);
}

export const handleForgotPassword = async (req:Request, res:Response, next:NextFunction) => {
    try{
        const {email} = req.body;
        if(!email) throw new ValidationError("Email is required!");

        // Find user/seller in db
        const user = await prisma.users.findUnique({where: {email}});
        if(!user) throw new ValidationError(`User not found!`);

        // Check otp restrictions
        await checkOtpRestrictions(email);
        await trackOtpRequests(email);

        // Generate OTP and send
        await sendOtp(user.firstname, email, "forgot-password-user-mail");

        res.status(200).json({
            message: "OTP sent to email. Please verify your account."
        })

    } catch(error) {
        next(error);
    }
}

export const verifyForgotPasswordOtp = async (req:Request, res:Response, next:NextFunction) => {
    try{
       const {email, otp} = req.body;
       
       if(!email || !otp) throw new ValidationError("Email and otp are required!");

       await verifyOtp(email,otp,next);

       await redis.set(`reset_authorized:${email}`, "true", "EX", 300);
       
        res.status(200).json({
            message: "OTP verified. You can now reset your password!",
        });

    } catch(error) {
        next(error);
    }
}