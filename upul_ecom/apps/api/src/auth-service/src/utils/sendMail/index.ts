import { Resend } from 'resend';
import dotenv from 'dotenv';
import ejs from 'ejs';
import path from 'path';

dotenv.config();

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// Render an EJS email template (Unchanged - this was already perfect!)
const rendererEmailTemplate = async (templateName: string, data: Record<string, any>): Promise<string> => {
    const templatePath = path.join(
        process.cwd(),
        "apps",
        "api",
        "src",
        "auth-service",
        "src",
        "utils",
        "email-templates",
        `${templateName}.ejs`
    );

    return ejs.renderFile(templatePath, data);
}

// Send an email using Resend
export const sendEmail = async (to: string, subject: string, templateName: string, data: Record<string, any>) => {
    try {
        // 1. Generate the HTML from your EJS template
        const html = await rendererEmailTemplate(templateName, data);

        // 2. Send via Resend's API
        const { data: responseData, error } = await resend.emails.send({
            from: 'Upul International <noreply@upuls.lk>', // Using your verified domain!
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error("Resend API Error:", error);
            return false;
        }

        console.log("Email sent successfully. ID:", responseData?.id);
        return true;

    } catch (error) {
        console.error("Critical error sending email:", error);
        return false;
    }
}