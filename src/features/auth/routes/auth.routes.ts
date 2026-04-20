import EmailVerification from '@auth/controllers/email-verify';
import Password from '@auth/controllers/password';
import SignIn from '@auth/controllers/signin';
import { SignOut } from '@auth/controllers/signout';
import SignUp from '@auth/controllers/signup';
import OAuth from '@auth/controllers/oauth';
import authMiddleware from '@global/helpers/auth';
import { Router } from 'express';

class AuthRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get('/oauth/google/auth-url', OAuth.prototype.getAuthUrl);
        this.router.get('/oauth/google/oauth2callback', OAuth.prototype.handleCallback);
        this.router.get('/oauth/google/status', OAuth.prototype.checkAuthStatus);

        this.router.post('/signout', authMiddleware.verifyUser, SignOut.prototype.execute);
        this.router.post('/signin', SignIn.prototype.execute);
        this.router.post('/signup', SignUp.prototype.execute);
        this.router.get('/verify-email', EmailVerification.prototype.verifyEmail);
        this.router.post('/resend-verification', EmailVerification.prototype.resendVerification);
        this.router.post('/forgot-password', Password.prototype.forgotPassword);
        this.router.post('/reset-password/:token', Password.prototype.resetPassword);

        return this.router;
    }
}

const authRoutes: AuthRoutes = new AuthRoutes();

export default authRoutes;
