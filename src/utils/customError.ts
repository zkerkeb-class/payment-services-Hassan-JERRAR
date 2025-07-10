export class CustomError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        // Maintenir la stack trace correcte pour ES5/ES6
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }

        this.name = this.constructor.name;
    }
}
