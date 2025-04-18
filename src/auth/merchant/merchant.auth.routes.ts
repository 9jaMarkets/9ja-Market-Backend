/**
 * @swagger
 * tags:
 *   name: Merchant Authentication
 *   description: Merchant authentication and registration operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MerchantRegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - brandName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Merchant's email address
 *         password:
 *           type: string
 *           format: password
 *           description: Merchant's password (min 8 characters)
 *         brandName:
 *           type: string
 *           description: Unique brand name for the merchant
 *         marketName:
 *           type: string
 *           description: Name of the market/mall where merchant operates
 *         displayImage:
 *           type: string
 *           format: uri
 *           description: URL of merchant's display image
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Address'
 *         phoneNumbers:
 *           type: array
 *           items:
 *             type: string
 *         referrerCode:
 *           type: string
 *           description: Optional referrer code from a marketer
 *     
 *     Merchant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         brandName:
 *           type: string
 *         displayImage:
 *           type: string
 *           format: uri
 *         emailVerifiedAt:
 *           type: string
 *           format: date-time
 *         market:
 *           $ref: '#/components/schemas/Market'
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Address'
 *         phoneNumbers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PhoneNumber'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

import { Router } from "express";
import { MerchantAuthController } from "./merchant.auth.controller";
import { MerchantAuthService } from "./merchant.auth.service";
import { WinstonLogger } from "../../utils/logger/winston.logger";
import { BcryptService } from "../../utils/bcrypt/bcrypt.service";
import { JWTService } from "../../utils/jwt/jwt.service";
import { MerchantRepository } from "../../repositories/merchant.repository";
import { Validator } from "../../utils/middlewares/validator.middleware";
import { LoginRequestDto } from "../dtos/login-request.dto";
import { MerchantRegisterRequestDto } from "../dtos/merchant-register-request.dto";
import { EmailVerificationRequestDto } from "../dtos/email-verification-request.dto";
import { VerifyEmailRequestByCodeDto, VerifyEmailRequestByTokenDto } from "../dtos/verify-email-request.dto";
import { ForgotPasswordRequestDto } from "../dtos/forgot-password-request.dto";
import { ResetPasswordRequestDto } from "../dtos/reset-password-request.dto";
import passport from "passport";
import { MarketRepository } from "../../repositories/market.repository";

const router = Router();
const validator = new Validator();

// Merchant Auth Service Dependencies
const logger = new WinstonLogger('MerchantAuthService');
const bcryptService = new BcryptService();
const jwtService = new JWTService();
const merchantRepository = new MerchantRepository();
const marketRepository = new MarketRepository();


// Merchant Auth Service
const merchantAuthService = new MerchantAuthService(logger, bcryptService, jwtService, merchantRepository, marketRepository);

// Merchant Auth Controller
const merchantAuthController = new MerchantAuthController(merchantAuthService);

/**
 * @swagger
 * /auth/merchant/login:
 *   post:
 *     summary: Login a merchant
 *     tags: [Merchant Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     id:
 *                       type: string
 *                       format: uuid
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validator.single(LoginRequestDto), merchantAuthController.login);

/**
 * @swagger
 * /auth/merchant/signup:
 *   post:
 *     summary: Register a new merchant
 *     tags: [Merchant Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MerchantRegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *                 data:
 *                   $ref: '#/components/schemas/Merchant'
 *       400:
 *         description: Invalid input or brand name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', validator.single(MerchantRegisterRequestDto), merchantAuthController.register);

/**
 * @swagger
 * /auth/merchant/email-verification:
 *   post:
 *     summary: Request email verification
 *     tags: [Merchant Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/email-verification', validator.single(EmailVerificationRequestDto), merchantAuthController.emailVerification);

/**
 * @swagger
 * /auth/merchant/verify-email-token:
 *   post:
 *     summary: Verify email with token
 *     tags: [Merchant Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/verify-email-token', validator.single(VerifyEmailRequestByTokenDto, "query"), merchantAuthController.verifyEmailByQuery);

/**
 * @swagger
 * /auth/merchant/verify-email:
 *   post:
 *     summary: Verify email with code
 *     tags: [Merchant Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/verify-email', validator.single(VerifyEmailRequestByCodeDto), merchantAuthController.verifyEmail);

/**
 * @swagger
 * /auth/merchant/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Merchant Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/forgot-password', validator.single(ForgotPasswordRequestDto), merchantAuthController.forgotPassword);

/**
 * @swagger
 * /auth/merchant/reset-password:
 *   put:
 *     summary: Reset password
 *     tags: [Merchant Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/reset-password', validator.single(ResetPasswordRequestDto), merchantAuthController.resetPassword);

/**
 * @swagger
 * /auth/merchant/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Merchant Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refresh successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 */
router.post('/refresh-token', merchantAuthController.refreshToken);

/**
 * @swagger
 * /auth/merchant/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Merchant Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google login page
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false, state: 'merchant' }));

/**
 * @swagger
 * /auth/merchant/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Merchant Authentication]
 *     parameters:
 *       - in: query
 *         name: profile
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend with authentication token
 */
router.get('/google/callback', merchantAuthController.googleAuth);

/**
 * @swagger
 * /auth/merchant/exchange-token:
 *   get:
 *     summary: Exchange temporary token for access tokens
 *     tags: [Merchant Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token exchange successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 */
router.get("/exchange-token", merchantAuthController.exchangeToken)

/**
 * @swagger
 * /auth/merchant/logout:
 *   delete:
 *     summary: Logout merchant
 *     tags: [Merchant Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/logout', merchantAuthController.logout);

export default router;