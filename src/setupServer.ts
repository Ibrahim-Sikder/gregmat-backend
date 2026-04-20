import { CustomError } from '@global/helpers/error-handlers';
import { generalRateLimit } from '@global/helpers/rate-limiter';
import { config } from '@root/config';
import applicationRoutes from '@root/routes';
import { createAdapter } from '@socket.io/redis-adapter';
import type Logger from 'bunyan';
import compression from 'compression';
import cookieSession from 'cookie-session';
import cors from 'cors';
import type { Application, NextFunction, Request, Response } from 'express';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import http from 'http';
import HTTP_STATUS from 'http-status-codes';
import { createClient } from 'redis';
import { Server as SocketServer } from 'socket.io';
import apiStats from 'swagger-stats';
import cookieParser from 'cookie-parser';

const SERVER_PORT = process.env.PORT || 5000;
const log: Logger = config.createLogger('server');

const allowed = [
    config.CLIENT_URL,
    config.ADMIN_URL,
    'https://administration.gregmat.co',
    'https://www.gregmat.co',
    'https://gregmat.co',
];

export class Server {
    private app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    public start(): void {
        this.securityMiddleware(this.app);
        this.rateLimitMiddleware(this.app);
        this.standardMiddleware(this.app);
        this.apiMonitoring(this.app);
        this.routesMiddleware(this.app);
        this.globalErrorHandler(this.app);
        this.startServer(this.app);
    }

    private securityMiddleware(app: Application): void {
        app.use(cookieParser());
        app.set('trust proxy', 1);
        if (config.NODE_ENV === 'production') {
            app.use(
                cookieSession({
                    name: 'session',
                    keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
                    maxAge: 24 * 7 * 3600000, // 7 days
                    secure: true,
                    sameSite: 'none',
                    domain: '.gregmat.co',
                })
            );
        } else {
            app.use(
                cookieSession({
                    name: 'session',
                    keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
                    maxAge: 24 * 7 * 3600000, // 7 days
                    secure: false,
                })
            );
        }

        app.use(hpp());
        app.use(helmet());
        app.use(
            cors({
                origin: (origin, callback) => {
                    // allow requests with no origin (mobile apps, curl, etc.)
                    if (!origin) return callback(null, true);
                    if (allowed.indexOf(origin) !== -1) {
                        return callback(null, true);
                    }
                    return callback(new Error('Not allowed by CORS'));
                },
                credentials: true,
                optionsSuccessStatus: 200,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            })
        );
    }

    private rateLimitMiddleware(app: Application): void {
        app.use(generalRateLimit);
        log.info('Rate limiting enabled: 1000 requests per minute per IP');
    }

    private standardMiddleware(app: Application): void {
        app.use((req, res, next) => {
            req.setTimeout(120000, () => {
                log.error('Request timeout');
                if (!res.headersSent) {
                    res.status(HTTP_STATUS.REQUEST_TIMEOUT).json({
                        status: 'error',
                        message: 'Request timeout - operation took too long',
                    });
                }
            });

            res.setTimeout(120000, () => {
                log.error('Response timeout');
                if (!res.headersSent) {
                    res.status(HTTP_STATUS.REQUEST_TIMEOUT).json({
                        status: 'error',
                        message: 'Response timeout',
                    });
                }
            });

            next();
        });

        app.use(compression());

        app.use((req, res, next) => {
            if (
                req.path.includes('/upload') ||
                req.headers['content-type']?.includes('multipart/form-data')
            ) {
                return next();
            }

            json({ limit: '50mb' })(req, res, (err) => {
                if (err) return next(err);
                urlencoded({ extended: true, limit: '50mb' })(req, res, next);
            });
        });
    }

    private routesMiddleware(app: Application): void {
        applicationRoutes(app);
    }

    private apiMonitoring(app: Application): void {
        app.use(
            apiStats.getMiddleware({
                uriPath: '/api-monitoring',
            })
        );
    }

    private globalErrorHandler(app: Application): void {
        app.use((req: Request, res: Response) => {
            res.status(HTTP_STATUS.NOT_FOUND).json({
                status: 'error',
                statusCode: HTTP_STATUS.NOT_FOUND,
                message: `The requested resource ${req.originalUrl} was not found`,
            });
        });

        app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
            log.error(error);

            if (error instanceof CustomError) {
                return res.status(error.statusCode).json(error.serializeErrors());
            }

            // Handle multer specific errors
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'File too large',
                    status: 'error',
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                });
            }

            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: 'Unexpected file field',
                    status: 'error',
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                });
            }

            if (error.name === 'MongoServerError' && error.code === 11000) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: `Duplicate value entered for ${Object.keys(error.keyValue)} field, please choose another value`,
                    status: 'error',
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                });
            }

            if (error.name === 'ValidationError') {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: Object.values(error.errors)
                        .map((item: any) => item.message)
                        .join(', '),
                    status: 'error',
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                });
            }

            if (error.name === 'CastError') {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: `Resource not found with id of ${error.value}`,
                    status: 'error',
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                });
            }

            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                message: 'Something went wrong',
            });
        });
    }

    private async startServer(app: Application): Promise<void> {
        if (!config.JWT_TOKEN) {
            throw new Error('JWT_TOKEN must be provided');
        }
        try {
            const httpServer: http.Server = new http.Server(app);
            const socketIO: SocketServer = await this.createSocketIO(httpServer);
            this.startHttpServer(httpServer);
            this.socketIOConnections(socketIO);
        } catch (error) {
            log.error(error);
        }
    }

    private async createSocketIO(httpServer: http.Server): Promise<SocketServer> {
        const io: SocketServer = new SocketServer(httpServer, {
            cors: {
                origin: config.CLIENT_URL,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            },
        });
        const pubClient = createClient({ url: config.REDIS_HOST });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        return io;
    }

    private startHttpServer(httpServer: http.Server): void {
        log.info(`Worker with process id of ${process.pid} has started...`);
        log.info(`Server has started with process ${process.pid}`);

        httpServer.timeout = 120000; // 2 minutes
        httpServer.keepAliveTimeout = 65000; // 65 seconds
        httpServer.headersTimeout = 70000; // 70 seconds

        httpServer.listen(SERVER_PORT, () => {
            log.info(`Server running on port ${SERVER_PORT}`);
        });
    }

    private socketIOConnections(io: SocketServer): void {}
}
