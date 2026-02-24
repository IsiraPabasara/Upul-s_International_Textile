export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details: any;

    constructor(message: string, statusCode:number, isOperational = true, details?:any) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this);
    }

}

// Not Found Error  
export class NotFoundError extends AppError {
    constructor(message = "Resources not found") {
        super(message, 404);
    }
}

// Validation Error (use for Joi/zod/react-hook-form validation errors)
export class ValidationError extends AppError {
    constructor(message = "Invalid request data", details?:any) {
        super(message, 400, true, details);
    }
}

// Authentication Error
export class AuthError extends AppError {
    constructor(message = "Unauthorizes") {
        super(message, 401);
    }
}

// Forbidden Error (For insufficient perimissions)
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden Access") {
        super(message, 403);
    }
}

// Database Error (For MongoDB/Postgres errors)
export class DatabaseError extends AppError {
    constructor(message = "Database Error", details?:any) {
        super(message, 500, true, details);
    }
}


//Rate Limit Error (If users exceeds API limits) 
export class RateLimitError extends AppError {
    constructor(message = "Too many requests, Please try again later") {
        super(message, 429);
    }
}