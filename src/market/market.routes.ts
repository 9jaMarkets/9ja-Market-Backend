/**
 * @swagger
 * tags:
 *   name: Markets
 *   description: Market and mall management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Market:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         displayImage:
 *           type: string
 *           format: uri
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         isMall:
 *           type: boolean
 *           default: false
 *         merchants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Merchant'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     MarketCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - address
 *       properties:
 *         name:
 *           type: string
 *           description: Unique name for the market/mall
 *         displayImage:
 *           type: string
 *           format: binary
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         isMall:
 *           type: boolean
 *           default: false
 *     
 *     MarketUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         displayImage:
 *           type: string
 *           format: binary
 *         description:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         isMall:
 *           type: boolean
 */

import { Router } from "express";
import { MarketController } from "./market.controller";
import { MarketService } from "./market.service";
import { MarketRepository } from "../repositories/market.repository";
import { WinstonLogger } from "../utils/logger/winston.logger";
import { Validator } from "../utils/middlewares/validator.middleware";
import { IdDto } from "../dtos/id.dto";
import { MarketUpdateDto } from "./dtos/market-update.dto";
import { MarketCreateDto } from "./dtos/market-create.dto";
import { GetByNameDto } from "./dtos/get-by-name.dto";
import { MulterMiddleware } from "../utils/middlewares/file-parser.middleware";
import { httpCacheDuration } from "../utils/middlewares/httpCache.middleware";
import { CustomerRepository } from "../repositories/customer.repository";
import { CustomerAuthGaurd } from "../utils/middlewares/guards/customer.auth.guard";
import { Role } from "@prisma/client";
import { JWTService } from "../utils/jwt/jwt.service";

const router = Router();
const marketRepository = new MarketRepository();
const logger = new WinstonLogger("MarketService");
const marketService = new MarketService(marketRepository, logger);
const marketController = new MarketController(marketService);
const validator = new Validator();
const fileParser = new MulterMiddleware(logger);
const customerRepository = new CustomerRepository();
const jwtService = new JWTService();
const customerAuthGuard = new CustomerAuthGaurd(customerRepository, logger, jwtService);

/**
 * @swagger
 * /markets/names:
 *   get:
 *     summary: Get list of market names
 *     tags: [Markets]
 *     responses:
 *       200:
 *         description: List of market names
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get("/names", marketController.getMarketNames);

/**
 * @swagger
 * /markets:
 *   get:
 *     summary: Get all markets (excluding malls)
 *     tags: [Markets]
 *     responses:
 *       200:
 *         description: List of markets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Market'
 */
router.get("/", httpCacheDuration(3600), marketController.getAllMarkets);

/**
 * @swagger
 * /markets/malls:
 *   get:
 *     summary: Get all malls
 *     tags: [Markets]
 *     responses:
 *       200:
 *         description: List of malls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Market'
 */
router.get("/malls", httpCacheDuration(3600), marketController.getAllMalls);

/**
 * @swagger
 * /markets:
 *   post:
 *     summary: Create a new market/mall
 *     tags: [Markets]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MarketCreateRequest'
 *     responses:
 *       201:
 *         description: Market created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Market'
 *       400:
 *         description: Invalid input or market name already exists
 *       401:
 *         description: Unauthorized - only admins can create markets
 */
router.post("/", fileParser.single("displayImage"), validator.single(MarketCreateDto, "body"), marketController.createMarket);

/**
 * @swagger
 * /markets/{marketId}:
 *   get:
 *     summary: Get market by ID
 *     tags: [Markets]
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Market details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Market'
 *       404:
 *         description: Market not found
 */
router.get("/:marketId", httpCacheDuration(3600), validator.single(IdDto, "params"), marketController.getMarketById);

/**
 * @swagger
 * /markets/{marketId}:
 *   put:
 *     summary: Update a market
 *     tags: [Markets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MarketUpdateRequest'
 *     responses:
 *       200:
 *         description: Market updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Market'
 *       401:
 *         description: Unauthorized - only admins can update markets
 *       404:
 *         description: Market not found
 */
router.put("/:marketId", customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }), fileParser.single("displayImage"), validator.multiple([
    { schema: IdDto, source: "params" },
    { schema: MarketUpdateDto, source: "body" }
]), marketController.updateMarket);

/**
 * @swagger
 * /markets/{marketId}:
 *   delete:
 *     summary: Delete a market
 *     tags: [Markets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Market deleted successfully
 *       401:
 *         description: Unauthorized - only admins can delete markets
 *       404:
 *         description: Market not found
 */
router.delete("/:marketId", customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }), validator.single(IdDto, "params"), marketController.deleteMarket);

/**
 * @swagger
 * /markets:
 *   delete:
 *     summary: Delete all markets (Admin only)
 *     tags: [Markets]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All markets deleted successfully
 *       401:
 *         description: Unauthorized - only admins can perform this action
 */
router.delete("/", customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }), marketController.deleteAllMarkets);

export default router;
