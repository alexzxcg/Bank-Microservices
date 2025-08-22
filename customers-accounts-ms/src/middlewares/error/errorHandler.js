class AppError extends Error {
    constructor(message, statusCode = 400, details = []) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erro interno no servidor';
    
    const errorResponse = {
        mensagem: message,
        status: statusCode,
        dataHora: new Date().toISOString(),
        detalhes: err.details || []
    };

    if (process.env.NODE_ENV === 'development') {
        console.error(err);
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Endpoint não encontrado - ${req.originalUrl}`, 404);
    next(error);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler,
    notFoundHandler
};