import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';

import config from './common/config/index.js';
import ClientError from './common/exceptions/ClientError.js';

import actorRoutes from "./api/routes/actor.routes.js";
import authRoutes from "./api/routes/auth.routes.js";

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ClientError) {
        return res.status(err.statusCode).json({
            status: 'fail',
            message: err.message
        });
    }

    console.error(err);
    return res.status(500).json({
        status: 'error',
        message: 'An internal server error occurred'
    });
};

const init = async () => {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.get('/', (req: Request, res: Response) => {
        res.json({ message: 'Welcome to the Supply Chain Tracker API' });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/actors', actorRoutes);

    app.use(errorHandler);

    const host = config.app.host;
    const port = config.app.port;

    app.listen(port, () => {
        console.log(`📡 Server is running at http://${host}:${port}`);
    });
}

init();