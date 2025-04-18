/**
 * @swagger
 * tags:
 *   name: Ratings
 *   description: Product rating and review management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Rating:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating value between 1 and 5
 *         review:
 *           type: string
 *           description: Optional review text
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateRatingRequest:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating value between 1 and 5
 *         review:
 *           type: string
 *           description: Optional review text
 *     
 *     UpdateRatingRequest:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating value between 1 and 5
 *         review:
 *           type: string
 *           description: Optional review text
 */

import { Router } from "express";
import { WinstonLogger } from "../../utils/logger/winston.logger";
import { JWTService } from "../../utils/jwt/jwt.service";
import { CustomerRepository } from "../../repositories/customer.repository";
import { CustomerAuthGaurd } from "../../utils/middlewares/guards/customer.auth.guard";
import { Validator } from "../../utils/middlewares/validator.middleware";
import { RatingController } from "./rating.controller";
import { RatingService } from "./rating.service";
import { RatingRepository } from "../../repositories/rating.repository";
import { IdDto } from "../../dtos/id.dto";
import { RatingUpdateDto } from "../dtos/rating-update.dto";
import { RatingCreateDto } from "../dtos/rating-create.dto";

const router = Router();

const logger = new WinstonLogger("RatingService");
const jwtService = new JWTService();
const ratingRepository = new RatingRepository();
const customerRepository = new CustomerRepository();
const ratingService = new RatingService(ratingRepository, logger);
const ratingController = new RatingController(ratingService)
const validator = new Validator();
const customerAuthGaurd = new CustomerAuthGaurd(customerRepository, logger, jwtService)

/**
 * @swagger
 * /rating/{productId}:
 *   get:
 *     summary: Get all ratings for a product
 *     tags: [Ratings]
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
 *       200:
 *         description: List of product ratings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rating'
 *       404:
 *         description: Product not found
 */
router.get("/:productId", customerAuthGaurd.authorise(), validator.single(IdDto, "params"), ratingController.getRatings);

/**
 * @swagger
 * /rating/{productId}:
 *   post:
 *     summary: Create a rating for a product
 *     tags: [Ratings]
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
 *             $ref: '#/components/schemas/CreateRatingRequest'
 *     responses:
 *       201:
 *         description: Rating created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rating'
 *       400:
 *         description: Invalid rating value
 *       404:
 *         description: Product not found
 */
router.post("/:productId", validator.multiple([
    { schema: IdDto, source: "params" },
    { schema: RatingCreateDto, source: "body" }
]), customerAuthGaurd.authorise(), ratingController.createRating);

/**
 * @swagger
 * /rating/{ratingId}:
 *   put:
 *     summary: Update a rating
 *     tags: [Ratings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRatingRequest'
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *       400:
 *         description: Invalid rating value
 *       401:
 *         description: Unauthorized - only the rating author can update it
 *       404:
 *         description: Rating not found
 */
router.put("/:ratingId", validator.multiple([
    { schema: IdDto, source: "params" },
    { schema: RatingUpdateDto, source: "body" }
]), customerAuthGaurd.authorise(), ratingController.updateRating);

/**
 * @swagger
 * /rating/{ratingId}:
 *   delete:
 *     summary: Delete a rating
 *     tags: [Ratings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Rating deleted successfully
 *       401:
 *         description: Unauthorized - only the rating author can delete it
 *       404:
 *         description: Rating not found
 */
router.delete("/:ratingId", customerAuthGaurd.authorise(), validator.single(IdDto, "params"), ratingController.deleteRating);

export default router;