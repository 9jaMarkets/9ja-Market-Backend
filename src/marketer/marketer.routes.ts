/**
 * @swagger
 * tags:
 *   name: Marketers
 *   description: Marketer management and earnings operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Marketer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         username:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         accountName:
 *           type: string
 *         accountBank:
 *           type: string
 *         accountNumber:
 *           type: string
 *         BusinessType:
 *           type: string
 *         marketingExperience:
 *           type: string
 *         IdentityCredentialType:
 *           type: string
 *         IdentityCredentialImage:
 *           type: string
 *           format: uri
 *         verified:
 *           type: boolean
 *           default: false
 *         referrerCode:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     MarketerCreate:
 *       type: object
 *       required:
 *         - email
 *         - firstName
 *         - lastName
 *         - username
 *         - phoneNumber
 *         - accountName
 *         - accountBank
 *         - accountNumber
 *         - BusinessType
 *         - IdentityCredentialType
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         username:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         accountName:
 *           type: string
 *         accountBank:
 *           type: string
 *         accountNumber:
 *           type: string
 *         BusinessType:
 *           type: string
 *         marketingExperience:
 *           type: string
 *         IdentityCredentialType:
 *           type: string
 *         IdentityCredentialImage:
 *           type: string
 *           format: binary
 *     
 *     MarketerUpdate:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         username:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         accountName:
 *           type: string
 *         accountBank:
 *           type: string
 *         accountNumber:
 *           type: string
 *         BusinessType:
 *           type: string
 *         marketingExperience:
 *           type: string
 *         IdentityCredentialType:
 *           type: string
 *         IdentityCredentialImage:
 *           type: string
 *           format: binary
 *     
 *     MarketerEarnings:
 *       type: object
 *       properties:
 *         totalEarnings:
 *           type: number
 *           format: float
 *         paidEarnings:
 *           type: number
 *           format: float
 *         unpaidEarnings:
 *           type: number
 *           format: float
 *         earnings:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 format: float
 *               paid:
 *                 type: boolean
 *               paidAt:
 *                 type: string
 *                 format: date-time
 *               createdAt:
 *                 type: string
 *                 format: date-time
 */

import { Router } from "express";
import { MarketerController } from "./marketer.controller";
import { MarketerService } from "./marketer.service";
import { MarketerRepository } from "../repositories/marketer.repository";
import { MarketerEarningsRepository } from "../repositories/marketer-earnings.repository";
import { AdRepository } from "../repositories/ad.repository";
import { WinstonLogger } from "../utils/logger/winston.logger";
import { Validator } from "../utils/middlewares/validator.middleware";
import { IdDto } from "../dtos/id.dto";
import { MarketerCreateDto } from "./dtos/marketer-create.dto";
import { MarketerUpdateDto } from "./dtos/marketer-update.dto";
import { MulterMiddleware } from "../utils/middlewares/file-parser.middleware";
import { CustomerAuthGaurd } from "../utils/middlewares/guards/customer.auth.guard";
import { Role } from "@prisma/client";
import { CustomerRepository } from "../repositories/customer.repository";
import { JWTService } from "../utils/jwt/jwt.service";

const router = Router();
export const marketerRepository = new MarketerRepository();
const customerRepository = new CustomerRepository();
export const marketerEarningsRepository = new MarketerEarningsRepository();
const adRepository = new AdRepository();
const logger = new WinstonLogger("MarketerService");
export const marketerService = new MarketerService(
  marketerRepository,
  customerRepository,
  marketerEarningsRepository,
  adRepository,
  logger
);
const marketerController = new MarketerController(marketerService);
const validator = new Validator();
const fileParser = new MulterMiddleware(logger);
const jwtService = new JWTService();
const customerAuthGuard = new CustomerAuthGaurd(
  customerRepository,
  logger,
  jwtService
);

/**
 * @swagger
 * /marketers/referrer/{referrerCode}:
 *   get:
 *     summary: Get marketer by referrer code
 *     tags: [Marketers]
 *     parameters:
 *       - in: path
 *         name: referrerCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marketer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marketer'
 *       404:
 *         description: Marketer not found
 */
router.get(
  "/referrer/:referrerCode",
  marketerController.getMarketerByReferrerCode
);

/**
 * @swagger
 * /marketers:
 *   get:
 *     summary: Get all marketers (Admin only)
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all marketers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Marketer'
 *       401:
 *         description: Unauthorized - only admins can access this endpoint
 */
router.get(
  "/",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  marketerController.getAllMarketers
);

/**
 * @swagger
 * /marketers/earnings:
 *   get:
 *     summary: Get all marketers with their earnings summary (Admin only)
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of marketers with their earnings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Marketer'
 *                   - $ref: '#/components/schemas/MarketerEarnings'
 *       401:
 *         description: Unauthorized - only admins can access this endpoint
 */
router.get(
  "/earnings",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  marketerController.getAllMarketersWithEarnings
);

/**
 * @swagger
 * /marketers/{marketerId}:
 *   get:
 *     summary: Get marketer by ID
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marketer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marketer'
 *       404:
 *         description: Marketer not found
 */
router.get(
  "/:marketerId",
  customerAuthGuard.authorise({ strict: true }),
  validator.single(IdDto, "params"),
  marketerController.getMarketerById
);

/**
 * @swagger
 * /marketers/{marketerId}/earnings:
 *   get:
 *     summary: Get marketer's earnings
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marketer's earnings details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketerEarnings'
 *       404:
 *         description: Marketer not found
 */
router.get(
  "/:marketerId/earnings",
  customerAuthGuard.authorise({ strict: true }),
  validator.single(IdDto, "params"),
  marketerController.getMarketerEarnings
);

/**
 * @swagger
 * /marketers/{marketerId}/earnings-paid:
 *   get:
 *     summary: Get marketer's paid earnings
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marketer's paid earnings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MarketerEarnings'
 *       404:
 *         description: Marketer not found
 */
router.get(
  "/:marketerId/earnings-paid",
  customerAuthGuard.authorise({ strict: true }),
  validator.single(IdDto, "params"),
  marketerController.getMarketerPaidEarnings
);

/**
 * @swagger
 * /marketers/{marketerId}/earnings-unpaid:
 *   get:
 *     summary: Get marketer's unpaid earnings
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marketer's unpaid earnings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MarketerEarnings'
 *       404:
 *         description: Marketer not found
 */
router.get(
  "/:marketerId/earnings-unpaid",
  customerAuthGuard.authorise({ strict: true }),
  validator.single(IdDto, "params"),
  marketerController.getMarketerUnpaidEarnings
);

/**
 * @swagger
 * /marketers/{marketerId}/payment-made:
 *   post:
 *     summary: Mark marketer's unpaid earnings as paid (Admin only)
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Earnings marked as paid successfully
 *       401:
 *         description: Unauthorized - only admins can access this endpoint
 *       404:
 *         description: Marketer not found
 */
router.post(
  "/:marketerId/payment-made",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  validator.single(IdDto, "params"),
  marketerController.markEarningsAsPaid
);

/**
 * @swagger
 * /marketers:
 *   post:
 *     summary: Create a new marketer
 *     tags: [Marketers]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MarketerCreate'
 *     responses:
 *       201:
 *         description: Marketer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marketer'
 *       400:
 *         description: Invalid input or email/username already exists
 */
router.post(
  "/",
  fileParser.single("IdentityCredentialImage"),
  validator.single(MarketerCreateDto, "body"),
  marketerController.createMarketer
);

/**
 * @swagger
 * /marketers/{marketerId}:
 *   put:
 *     summary: Update marketer details
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MarketerUpdate'
 *     responses:
 *       200:
 *         description: Marketer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marketer'
 *       400:
 *         description: Invalid input or email/username already exists
 *       404:
 *         description: Marketer not found
 */
router.put(
  "/:marketerId",
  customerAuthGuard.authorise({ strict: true }),
  fileParser.single("IdentityCredentialImage"),
  validator.multiple([
    { schema: IdDto, source: "params" },
    { schema: MarketerUpdateDto, source: "body" },
  ]),
  marketerController.updateMarketer
);

/**
 * @swagger
 * /marketers/{marketerId}/verify:
 *   put:
 *     summary: Verify a marketer (Admin only)
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marketer verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marketer'
 *       401:
 *         description: Unauthorized - only admins can verify marketers
 *       404:
 *         description: Marketer not found
 */
router.put(
  "/:marketerId/verify",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  validator.single(IdDto, "params"),
  marketerController.verifyMarketer
);

/**
 * @swagger
 * /marketers/{marketerId}:
 *   delete:
 *     summary: Delete a marketer (Admin only)
 *     tags: [Marketers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: marketerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Marketer deleted successfully
 *       401:
 *         description: Unauthorized - only admins can delete marketers
 *       404:
 *         description: Marketer not found
 */
router.delete(
  "/:marketerId",
  customerAuthGuard.authorise({ strict: true, role: Role.ADMIN }),
  validator.single(IdDto, "params"),
  marketerController.deleteMarketer
);

export default router;
