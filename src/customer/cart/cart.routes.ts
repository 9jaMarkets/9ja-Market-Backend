/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         totalPrice:
 *           type: number
 *           format: float
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     AddToCartRequest:
 *       type: object
 *       required:
 *         - quantity
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 0
 *           description: Set to 0 to remove item from cart
 */

import { Router } from "express";
import { CartService } from "./cart.service";
import { ProductRepository } from "../../repositories/product.repository";
import { CartProductRepository } from "../../repositories/cart-product.repository";
import { WinstonLogger } from "../../utils/logger/winston.logger";
import { CartController } from "./cart.controller";
import { Validator } from "../../utils/middlewares/validator.middleware";
import { CustomerAuthGaurd } from "../../utils/middlewares/guards/customer.auth.guard";
import { JWTService } from "../../utils/jwt/jwt.service";
import { CustomerRepository } from "../../repositories/customer.repository";
import { IdDto } from "../../dtos/id.dto";
import { AddToCartDto } from "../dtos/add-to-cart.dto";

const router = Router();
const logger = new WinstonLogger("CartService");
const jwtService = new JWTService();
const cartProductRepository = new CartProductRepository();
const productRepository = new ProductRepository();
const customerRepository = new CustomerRepository();
const cartService = new CartService(cartProductRepository, productRepository, logger);
const cartController = new CartController(cartService)
const validator = new Validator();
const customerAuthGaurd = new CustomerAuthGaurd(customerRepository, logger, jwtService)

/**
 * @swagger
 * /cart/{customerId}:
 *   get:
 *     summary: Get customer's cart
 *     tags: [Cart]
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
 *         description: Customer's cart items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CartProduct'
 *       401:
 *         description: Unauthorized - only the cart owner can view their cart
 */
router.get("/:customerId", customerAuthGaurd.authorise({id: true}), validator.single(IdDto, "params"), cartController.getCart);

/**
 * @swagger
 * /cart/{productId}:
 *   put:
 *     summary: Add/Update product in cart
 *     description: Add product to cart or update its quantity. Set quantity to 0 to remove item.
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CartProduct'
 *       400:
 *         description: Invalid quantity or insufficient stock
 *       404:
 *         description: Product not found
 */
router.put("/:productId", validator.multiple([
    { schema: IdDto, source: "params" },
    { schema: AddToCartDto, source: "body" }
]), customerAuthGaurd.authorise(), cartController.updateCart);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       204:
 *         description: Cart cleared successfully
 */
router.delete("/clear", customerAuthGaurd.authorise(), cartController.removeAllFromCart);

/**
 * @swagger
 * /cart/{productId}:
 *   delete:
 *     summary: Remove product from cart
 *     tags: [Cart]
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
 *       204:
 *         description: Product removed from cart successfully
 *       404:
 *         description: Product not found in cart
 */
router.delete("/:productId",  validator.single(IdDto, "params"), customerAuthGaurd.authorise(), cartController.removeFromCart);

export default router;