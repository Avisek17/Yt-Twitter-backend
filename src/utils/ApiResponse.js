class ApiRespone{
    constructor(
        data = null,
        message = "Success",
        statusCode = 200,
    ) {
        this.statusCode = statusCode;
        this.data = data;   
        this.message = message;
        this.success = statusCode < 400;
    }

}

export { ApiRespone };