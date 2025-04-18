/**
 * @swagger
 * tags:
 *   name: Merchants
 *   description: Merchant management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
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
 *         phoneNumbers:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 2
 *           maxItems: 2
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Address'
 *         market:
 *           $ref: '#/components/schemas/Market'
 *         referredBy:
 *           $ref: '#/components/schemas/Marketer'
 *         emailVerifiedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     MerchantUpdateRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         brandName:
 *           type: string
 *         phoneNumbers:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 2
 *           maxItems: 2
 *           description: Array of exactly 2 phone numbers
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Address'
 *         marketName:
 *           type: string
 *           description: Name of the market to associate with
 *     
 *     MerchantReferrerRequest:
 *       type: object
 *       required:
 *         - referrerCode
 *       properties:
 *         referrerCode:
 *           type: string
 *           description: Unique referrer code of the marketer
 *         referrerUsername:
 *           type: string
 *           description: Optional username of the marketer
 */

import { Router } from "express";
import { MerchantController } from "./merchant.controller";
import { MerchantService } from "./merchant.service";
import { MerchantRepository } from "../repositories/merchant.repository";
import { AddressRepository } from "../repositories/address.repository";
import { PhoneNumberRepository } from "../repositories/phone-number.repository";
import { WinstonLogger } from "../utils/logger/winston.logger";
import { Validator } from "../utils/middlewares/validator.middleware";
import { MerchantAuthGaurd } from "../utils/middlewares/guards/merchant.auth.guard";
import { JWTService } from "../utils/jwt/jwt.service";
import { IdDto } from "../dtos/id.dto";
import { MerchantUpdateDto } from "./dtos/merchant-update.dto";
import { MarketRepository } from "../repositories/market.repository";
import { MarketerRepository } from "../repositories/marketer.repository";
import { MerchantReferrerDto } from "./dtos/merchant-referrer.dto";

const router = Router();
const addressRepository = new AddressRepository();
const phoneNumberRepository = new PhoneNumberRepository();
export const merchantRepository = new MerchantRepository();
const marketRepository = new MarketRepository();
const marketerRepository = new MarketerRepository();
const logger = new WinstonLogger("MerchantService");
const jwtService = new JWTService();
const merchantService = new MerchantService(
  merchantRepository,
  marketRepository,
  addressRepository,
  phoneNumberRepository,
  marketerRepository,
  logger
);
const merchantController = new MerchantController(merchantService);
const validator = new Validator();
const merchantAuthGaurd = new MerchantAuthGaurd(
  merchantRepository,
  logger,
  jwtService
);

/**
 * @swagger
 * /merchants/{merchantId}:
 *   get:
 *     summary: Get merchant details by ID
 *     tags: [Merchants]
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Merchant details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Merchant'
 *       404:
 *         description: Merchant not found
 */
router.get(
  "/:merchantId",
  validator.single(IdDto, "params"),
  merchantController.getMerchantById
);

/**
 * @swagger
 * /merchants/market/{marketId}:
 *   get:
 *     summary: Get all merchants in a market
 *     tags: [Merchants]
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of merchants in the market
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Merchant'
 *       404:
 *         description: Market not found
 */
router.get(
  "/market/:marketId",
  validator.single(IdDto, "params"),
  merchantController.getMerchantsByMarket
);

/**
 * @swagger
 * /merchants/{merchantId}:
 *   put:
 *     summary: Update merchant details
 *     tags: [Merchants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MerchantUpdateRequest'
 *     responses:
 *       200:
 *         description: Merchant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Merchant'
 *       400:
 *         description: Invalid input or email already exists
 *       401:
 *         description: Unauthorized - only the merchant can update their own details
 *       404:
 *         description: Merchant or market not found
 */
router.put(
  "/:merchantId",
  validator.multiple([
    { schema: IdDto, source: "params" },
    { schema: MerchantUpdateDto, source: "body" },
  ]),
  merchantAuthGaurd.authorise({ id: true }),
  merchantController.updateMerchant
);

/**
 * @swagger
 * /merchants/{merchantId}:
 *   delete:
 *     summary: Delete a merchant
 *     tags: [Merchants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Merchant deleted successfully
 *       401:
 *         description: Unauthorized - only the merchant can delete their own account
 *       404:
 *         description: Merchant not found
 */
router.delete(
  "/:merchantId",
  merchantAuthGaurd.authorise({ id: true }),
  validator.single(IdDto, "params"),
  merchantController.deleteMerchant
);

/**
 * @swagger
 * /merchants/{merchantId}/referrer:
 *   post:
 *     summary: Connect merchant to a marketer using referrer code
 *     tags: [Merchants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MerchantReferrerRequest'
 *     responses:
 *       200:
 *         description: Merchant connected to marketer successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Merchant'
 *       400:
 *         description: Merchant already has a referrer or marketer is not verified
 *       401:
 *         description: Unauthorized - only the merchant can connect to a marketer
 *       404:
 *         description: Merchant or marketer not found
 */
router.post(
  "/:merchantId/referrer",
  merchantAuthGaurd.authorise(),
  validator.multiple([
    { schema: IdDto, source: "params" },
    { schema: MerchantReferrerDto, source: "body" },
  ]),
  merchantController.connectToMarketer
);

export default router;
