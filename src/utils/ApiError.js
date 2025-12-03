class ApiError extends Error {
    constructor(
        message,
        statusCode ,
        errors = [],
        errorStack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;   
        this.message = message;
        this.errors = errors;
        this.errorStack = errorStack;

        if(errorStack) {
            this.stack = errorStack;
        }else {
            Error.captureStackTrace(this, this.constructor);
        }

    }
}

export { ApiError };