/**
 * @swagger
 * tags:
 *   name: Advertisements
 *   description: Advertisement management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Ad:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         level:
 *           type: integer
 *           enum: [0, 1, 2, 3]
 *           description: Ad level (0 for free, 1-3 for paid tiers)
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         paidFor:
 *           type: boolean
 *           default: false
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         views:
 *           type: integer
 *           default: 0
 *         clicks:
 *           type: integer
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     AdPaymentInitialization:
 *       type: object
 *       properties:
 *         authorization_url:
 *           type: string
 *           format: uri
 *         reference:
 *           type: string
 *         access_code:
 *           type: string
 */

import { Router } from "express";
import { AdService } from "./ad.service";
import { AdRepository } from "../repositories/ad.repository";
import { PaystackPaymentRepository } from "../repositories/payment.repository";
import { ProductRepository } from "../repositories/product.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { WinstonLogger } from "../utils/logger/winston.logger";
import { AdController } from "./ad.controller";
import { Validator } from "../utils/middlewares/validator.middleware";
import { MerchantAuthGaurd } from "../utils/middlewares/guards/merchant.auth.guard";
import { MerchantRepository } from "../repositories/merchant.repository";
import { JWTService } from "../utils/jwt/jwt.service";
import { InitializeAdPaymentDto } from "./dtos/initialize-ad-payment.dto";
import { IdDto } from "./dtos/Id.dto";
import { ProductIdDto } from "./dtos/productId.dto";
import { CustomerAuthGaurd } from "../utils/middlewares/guards/customer.auth.guard";
import { CustomerRepository } from "../repositories/customer.repository";
import { marketerService } from "../marketer/marketer.routes";
const router = Router();

const merchantRepository = new MerchantRepository();
const customerRepository = new CustomerRepository();
const jwtService = new JWTService();
const adRepository = new AdRepository();
const paymentService = new PaystackPaymentRepository();
const productRepository = new ProductRepository();
const transactionRepository = new TransactionRepository();
const logger = new WinstonLogger("AdService");
const adService = new AdService(
  adRepository,
  paymentService,
  productRepository,
  transactionRepository,
  marketerService,
  logger
);
const adController = new AdController(adService);

const validator = new Validator();
const customerAuthGuard = new CustomerAuthGaurd(
  customerRepository,
  logger,
  jwtService
);
const merchantAuthGaurd = new MerchantAuthGaurd(
  merchantRepository,
  logger,
  jwtService
);

/**
 * @swagger
 * /ads/free/{productId}:
 *   post:
 *     summary: Activate a free advertisement for a product
 *     description: Creates a free advertisement that lasts for 3 days. Each product can only have one free ad.
 *     tags: [Advertisements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Free advertisement activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ad'
 *       400:
 *         description: Product already has a free ad or product not found
 *       401:
 *         description: Unauthorized - only merchants can create ads
 *       403:
 *         description: Not your product - merchants can only create ads for their own products
 */
router.post(
  "/free/:productId",
  merchantAuthGaurd.authorise({ strict: true }),
  adController.activateFreeAd
);

/**
 * @swagger
 * /ads/initialize/{level}/{productId}:
 *   post:
 *     summary: Initialize payment for a paid advertisement
 *     description: Creates a payment session for a paid advertisement. Level determines the duration and visibility of the ad.
 *     tags: [Advertisements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['1', '2', '3']
 *         description: Ad level determining price and duration
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment initialization successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdPaymentInitialization'
 *       400:
 *         description: Invalid level or product not found
 *       401:
 *         description: Unauthorized - only merchants can create ads
 */
router.post(
  "/initialize/:level/:productId",
  validator.single(InitializeAdPaymentDto, "params"),
  merchantAuthGaurd.authorise({ strict: true }),
  adController.initializeAdPayment
);

/**
 * @swagger
 * /ads/verify/{reference}:
 *   get:
 *     summary: Verify advertisement payment
 *     description: Verifies the payment and activates the advertisement if payment is successful
 *     tags: [Advertisements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference from initialization
 *     responses:
 *       200:
 *         description: Payment verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [SUCCESS, PENDING, FAILED]
 *       400:
 *         description: Invalid reference or payment verification failed
 *       401:
 *         description: Unauthorized - only merchants can verify their payments
 */
router.get(
  "/verify/:reference",
  merchantAuthGaurd.authorise({ strict: true }),
  adController.verifyAdPayment
);

/**
 * @swagger
 * /ads/all:
 *   get:
 *     summary: Get all advertisements (including expired)
 *     tags: [Advertisements]
 *     parameters:
 *       - in: query
 *         name: marketId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter ads by market
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter ads by merchant
 *     responses:
 *       200:
 *         description: List of all advertisements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ad'
 */
router.get("/all", adController.getAllFilteredAds);

/**
 * @swagger
 * /ads:
 *   get:
 *     summary: Get active advertisements
 *     description: Returns only active and paid advertisements that haven't expired
 *     tags: [Advertisements]
 *     parameters:
 *       - in: query
 *         name: marketId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter ads by market
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter ads by merchant
 *     responses:
 *       200:
 *         description: List of active advertisements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ad'
 */
router.get("/", adController.getFilteredAds);

/**
 * @swagger
 * /ads/{adId}:
 *   get:
 *     summary: Get advertisement by ID
 *     tags: [Advertisements]
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Advertisement details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ad'
 *       404:
 *         description: Advertisement not found
 */
router.get("/:adId", validator.single(IdDto, "params"), adController.getAd);

/**
 * @swagger
 * /ads/product/{productId}:
 *   get:
 *     summary: Get advertisement by product ID
 *     tags: [Advertisements]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Advertisement details for the product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ad'
 *       404:
 *         description: No advertisement found for this product
 */
router.get(
  "/product/:productId",
  validator.single(ProductIdDto, "params"),
  adController.getAdByProduct
);

/**
 * @swagger
 * /ads/{adId}/click:
 *   put:
 *     summary: Track advertisement click
 *     description: Increment the click counter for an advertisement
 *     tags: [Advertisements]
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Click tracked successfully
 *       404:
 *         description: Advertisement not found
 */
router.put(
  "/:adId/click",
  validator.single(IdDto, "params"),
  adController.trackAdClick
);

/**
 * @swagger
 * /ads/{adId}/view:
 *   put:
 *     summary: Track advertisement view
 *     description: Increment the view counter for an advertisement
 *     tags: [Advertisements]
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: View tracked successfully
 *       404:
 *         description: Advertisement not found
 */
router.put(
  "/:adId/view",
  validator.single(IdDto, "params"),
  adController.trackAdView
);

export default router;
