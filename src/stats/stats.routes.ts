/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: Platform statistics and analytics operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PlatformStats:
 *       type: object
 *       properties:
 *         totalCustomers:
 *           type: integer
 *           description: Total number of registered customers
 *         totalMerchants:
 *           type: integer
 *           description: Total number of registered merchants
 *         totalProducts:
 *           type: integer
 *           description: Total number of products listed
 *         totalAds:
 *           type: integer
 *           description: Total number of advertisements
 *         totalMarketers:
 *           type: integer
 *           description: Total number of registered marketers
 *     
 *     RevenueStats:
 *       type: object
 *       properties:
 *         monthRevenue:
 *           type: number
 *           format: float
 *           description: Total revenue for the current month
 *         yearRevenue:
 *           type: number
 *           format: float
 *           description: Total revenue for the current year
 *         totalRevenue:
 *           type: number
 *           format: float
 *           description: All-time total revenue
 *     
 *     AllStats:
 *       type: object
 *       allOf:
 *         - $ref: '#/components/schemas/PlatformStats'
 *         - type: object
 *           properties:
 *             revenue:
 *               $ref: '#/components/schemas/RevenueStats'
 */

import { Router } from "express";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";
import { CustomerRepository } from "../repositories/customer.repository";
import { MerchantRepository } from "../repositories/merchant.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { WinstonLogger } from "../utils/logger/winston.logger";
import { CustomerAuthGaurd } from "../utils/middlewares/guards/customer.auth.guard";
import { Role } from "@prisma/client";
import { JWTService } from "../utils/jwt/jwt.service";
import { ProductRepository } from "../repositories/product.repository";
import { AdRepository } from "../repositories/ad.repository";
import { MarketerRepository } from "../repositories/marketer.repository";

const router = Router();

const customerRepository = new CustomerRepository();
const merchantRepository = new MerchantRepository();
const transactionRepository = new TransactionRepository();
const productRepository = new ProductRepository();
const adRepository = new AdRepository();
const marketerRepository = new MarketerRepository();
const logger = new WinstonLogger("StatsService");
const jwtService = new JWTService();

const statsService = new StatsService(
  customerRepository,
  merchantRepository,
  transactionRepository,
  productRepository,
  adRepository,
  marketerRepository,
  logger
);
const statsController = new StatsController(statsService);

const customerAuthGuard = new CustomerAuthGaurd(
  customerRepository,
  logger,
  jwtService
);

/**
 * @swagger
 * /stats/platform:
 *   get:
 *     summary: Get basic platform statistics (Admin only)
 *     description: Returns counts of customers, merchants, products, ads, and marketers
 *     tags: [Statistics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlatformStats'
 *       401:
 *         description: Unauthorized - only admins can access this endpoint
 */
router.get(
  "/platform",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  statsController.getPlatformStats
);

/**
 * @swagger
 * /stats/revenue:
 *   get:
 *     summary: Get revenue statistics (Admin only)
 *     description: Returns revenue statistics for current month, year, and all-time
 *     tags: [Statistics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenueStats'
 *       401:
 *         description: Unauthorized - only admins can access this endpoint
 */
router.get(
  "/revenue",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  statsController.getAdRevenue
);

/**
 * @swagger
 * /stats/all:
 *   get:
 *     summary: Get all platform statistics (Admin only)
 *     description: Returns all platform statistics including counts and revenue
 *     tags: [Statistics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AllStats'
 *       401:
 *         description: Unauthorized - only admins can access this endpoint
 */
router.get(
  "/all",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  statsController.getAllStats
);

/**
 * @swagger
 * /stats/products/count:
 *   get:
 *     summary: Get total products count (Admin only)
 *     description: Returns the total number of products listed on the platform
 *     tags: [Statistics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Total products count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of products
 *       401:
 *         description: Unauthorized - only admins can access this endpoint
 */
router.get(
  "/products/count",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  statsController.getTotalProducts
);

/**
 * @swagger
 * /stats/ads/count:
 *   get:
 *     summary: Get total advertisements count (Admin only)
 *     description: Returns the total number of advertisements on the platform
 *     tags: [Statistics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Total advertisements count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of advertisements
 *       401:
 *         description: Unauthorized - only admins can access this endpoint
 */
router.get(
  "/ads/count",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  statsController.getTotalAds
);

export default router;
