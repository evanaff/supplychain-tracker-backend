import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';

import config from './common/config/index.js';
import ClientError from './common/exceptions/ClientError.js';

import authRoutes from "./api/routes/auth.routes.js";
import locationRoutes from "./api/routes/location.routes.js";
import actorRoutes from "./api/routes/actor.routes.js";
import productRoutes from "./api/routes/product.routes.js";
import productLotRoutes from "./api/routes/product-lot.routes.js"
import productEventRoutes from "./api/routes/product-event.routes.js"
import dashboardRoutes from "./api/routes/dashboard.routes.js"

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

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    config.app.clientUrl,
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins
}));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to the Supply Chain Tracker API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/actors', actorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-lots', productLotRoutes);
app.use('/api/product-events', productEventRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

export default app;