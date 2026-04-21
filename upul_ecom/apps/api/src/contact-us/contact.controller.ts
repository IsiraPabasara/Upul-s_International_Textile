// contact.controller.ts (or add to an existing public controller)
import { Request, Response, NextFunction } from 'express';
import { sendContactFormAlert } from '../email-service/email.service'; 
import { ValidationError } from '../../../../packages/error-handler';

export const submitContactForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phoneNumber, email, comment } = req.body;

    // Validate required fields based on your screenshot
    if (!email || !comment) {
      throw new ValidationError("Email and Comment are required fields.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format.");
    }

    // Send the email to the admin
    await sendContactFormAlert({ name, phone: phoneNumber, email, comment });

    res.status(200).json({
      success: true,
      message: "Thank you! Your message has been sent.",
    });
  } catch (error) {
    next(error);
  }
};