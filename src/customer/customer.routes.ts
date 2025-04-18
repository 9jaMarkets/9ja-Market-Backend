/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer profile and account management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
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
 *         phoneNumbers:
 *           type: array
 *           items:
 *             type: string
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Address'
 *         role:
 *           type: string
 *           enum: [CUSTOMER, MARKETER, ADMIN]
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
 *     CustomerUpdate:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
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
 *     
 *     MarketerProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         username:
 *           type: string
 *         referrerCode:
 *           type: string
 *         verified:
 *           type: boolean
 *         totalEarnings:
 *           type: number
 *           format: float
 *     
 *     MarketerReferral:
 *       type: object
 *       properties:
 *         merchant:
 *           $ref: '#/components/schemas/Merchant'
 *         earnings:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *               paid:
 *                 type: boolean
 *               createdAt:
 *                 type: string
 *                 format: date-time
 */

import { Router } from "express";
import { CustomerController } from "./customer.controller";
import { CustomerService } from "./customer.service";
import { CustomerRepository } from "../repositories/customer.repository";
import { AddressRepository } from "../repositories/address.repository";
import { PhoneNumberRepository } from "../repositories/phone-number.repository";
import { WinstonLogger } from "../utils/logger/winston.logger";
import { Validator } from "../utils/middlewares/validator.middleware";
import { IdDto } from "../dtos/id.dto";
import { CustomerAuthGaurd } from "../utils/middlewares/guards/customer.auth.guard";
import { JWTService } from "../utils/jwt/jwt.service";
import { CustomerUpdateDto } from "./dtos/customer-update.dto";
import CartRouter from "./cart/cart.routes";
import { merchantRepository } from "../merchant/merchant.routes";
import {
  marketerRepository,
  marketerEarningsRepository,
} from "../marketer/marketer.routes";
import RatingRouter from "./rating/rating.routes";

// Customer Service Dependents
const customerRepository = new CustomerRepository();
const addressRepository = new AddressRepository();
const phoneNumberRepository = new PhoneNumberRepository();
const logger = new WinstonLogger("CustomerService");
const jwtService = new JWTService();

const customerService = new CustomerService(
  customerRepository,
  marketerRepository,
  merchantRepository,
  marketerEarningsRepository,
  addressRepository,
  phoneNumberRepository,
  logger
);
const customerController = new CustomerController(customerService);

const customerAuthGaurd = new CustomerAuthGaurd(
  customerRepository,
  logger,
  jwtService
);
const validator = new Validator();

const router = Router();

// Add the CartRouter to the customer router
router.use("/cart", CartRouter);

// Add the RatingRouter to the customer router
router.use("/rating", RatingRouter);

/**
 * @swagger
 * /customers/profile/{customerId}:
 *   get:
 *     summary: Get customer profile
 *     description: Retrieve customer profile information including addresses and phone numbers
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Unauthorized - only the customer can view their own profile
 *       404:
 *         description: Customer not found
 */
router.get(
  "/profile/:customerId",
  customerAuthGaurd.authorise({ id: true }),
  customerController.getCustomerById
);

/**
 * @swagger
 * /customers/profile/{customerId}:
 *   put:
 *     summary: Update customer profile
 *     description: Update customer profile information including addresses and phone numbers
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerUpdate'
 *     responses:
 *       200:
 *         description: Customer profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid input or email already exists
 *       401:
 *         description: Unauthorized - only the customer can update their own profile
 *       404:
 *         description: Customer not found
 */
router.put(
  "/profile/:customerId",
  validator.multiple([
    { schema: IdDto, source: "params" },
    { schema: CustomerUpdateDto, source: "body" },
  ]),
  customerAuthGaurd.authorise({ id: true }),
  customerController.updateCustomer
);

/**
 * @swagger
 * /customers/profile/{customerId}:
 *   delete:
 *     summary: Delete customer account
 *     description: Permanently delete customer account and all associated data
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Customer account deleted successfully
 *       401:
 *         description: Unauthorized - only the customer can delete their own account
 *       404:
 *         description: Customer not found
 */
router.delete(
  "/profile/:customerId",
  validator.single(IdDto, "params"),
  customerAuthGaurd.authorise({ id: true }),
  customerController.deleteCustomer
);

/**
 * @swagger
 * /customers/get-marketer:
 *   get:
 *     summary: Get customer's marketer profile
 *     description: Retrieve marketer profile if the customer is also a marketer
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Marketer profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketerProfile'
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Customer is not a marketer
 */
router.get(
  "/get-marketer",
  customerAuthGaurd.authorise({}),
  customerController.getCustomerMarketerProfile
);

/**
 * @swagger
 * /customers/get-referrals:
 *   get:
 *     summary: Get customer's marketer referrals
 *     description: Retrieve list of merchants referred by the customer as a marketer
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Marketer referrals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MarketerReferral'
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Customer is not a marketer
 */
router.get(
  "/get-referrals",
  customerAuthGaurd.authorise({}),
  customerController.getCustomerMarketerReferrals
);

export default router;
