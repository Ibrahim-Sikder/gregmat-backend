import { config } from '@root/config';
import type { Request, Response, Router } from 'express';
import express from 'express';
import HTTP_STATUS from 'http-status-codes';
import moment from 'moment';
import { performance } from 'perf_hooks';

class HealthRoutes {
    // Root endpoint
    public root(): Router {
        const router = express.Router();
        router.get('/', (req: Request, res: Response) => {
            res.status(HTTP_STATUS.OK).send(
                `Health: Server instance is healthy with process id ${process.pid} on ${moment().format('LL')}`
            );
        });
        return router;
    }

    // Health endpoint
    public health(): Router {
        const router = express.Router();
        router.get('/health', (req: Request, res: Response) => {
            res.status(HTTP_STATUS.OK).send(
                `Health: Server instance is healthy with process id ${process.pid} on ${moment().format('LL')}`
            );
        });
        return router;
    }

    // Environment endpoint
    public env(): Router {
        const router = express.Router();
        router.get('/env', (req: Request, res: Response) => {
            res.status(HTTP_STATUS.OK).send(`This is the ${config.NODE_ENV} environment.`);
        });
        return router;
    }

    // Instance info endpoint
    public instance(): Router {
        const router = express.Router();
        router.get('/instance', (req: Request, res: Response) => {
            res.status(HTTP_STATUS.OK).send(
                `Server is running with process id ${process.pid} on ${moment().format('LL')}`
            );
        });
        return router;
    }

    // Fibonacci endpoint
    public fiboRoutes(): Router {
        const router = express.Router();
        router.get('/fibo/:num', (req: Request, res: Response) => {
            const { num } = req.params;
            const start = performance.now();
            const result = this.fibo(parseInt(num, 10));
            const end = performance.now();

            res.status(HTTP_STATUS.OK).send(
                `Fibonacci of ${num} is ${result} (calculated in ${(end - start).toFixed(2)}ms, process id ${process.pid})`
            );
        });
        return router;
    }

    private fibo(data: number): number {
        if (data < 2) return 1;
        return this.fibo(data - 2) + this.fibo(data - 1);
    }
}

const healthRoutes = new HealthRoutes();

export default healthRoutes;
