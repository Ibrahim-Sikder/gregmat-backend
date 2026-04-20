import authMiddleware from '@global/helpers/auth';
import { PairingController } from '@practice/controllers/pairing.controller';
import { Router } from 'express';

class PairingRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get(
            '/pairings',
            authMiddleware.verifyUser,
            PairingController.prototype.getPairings
        );

        this.router.get(
            '/pairings/:id',
            authMiddleware.verifyUser,
            PairingController.prototype.getPairing
        );

        this.router.post(
            '/pairings/create',
            authMiddleware.verifyUser,
            PairingController.prototype.createPairing
        );

        this.router.post(
            '/pairings/attempt',
            authMiddleware.verifyUser,
            PairingController.prototype.submitAttempt
        );

        this.router.delete(
            '/pairings/reset',
            authMiddleware.verifyUser,
            PairingController.prototype.resetProgress
        );

        return this.router;
    }
}

const pairingRoutes = new PairingRoutes();
export default pairingRoutes;
