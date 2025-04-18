/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         details:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *         prevPrice:
 *           type: number
 *           format: float
 *         stock:
 *           type: integer
 *         category:
 *           type: string
 *           enum: [ELECTRONICS, FASHION, FOOD, HEALTH_BEAUTY, HOME_OFFICE, PHONES_TABLETS, OTHER]
 *         displayImage:
 *           $ref: '#/components/schemas/ProductImage'
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         merchant:
 *           $ref: '#/components/schemas/Merchant'
 *         ratings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Rating'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ProductImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         url:
 *           type: string
 *           format: uri
 *     
 *     ProductCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - details
 *         - description
 *         - price
 *         - stock
 *         - category
 *       properties:
 *         name:
 *           type: string
 *         details:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *         stock:
 *           type: integer
 *         category:
 *           type: string
 *           enum: [ELECTRONICS, FASHION, FOOD, HEALTH_BEAUTY, HOME_OFFICE, PHONES_TABLETS, OTHER]
 *     
 *     ProductUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         details:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *         prevPrice:
 *           type: number
 *           format: float
 *         stock:
 *           type: integer
 *         category:
 *           type: string
 *           enum: [ELECTRONICS, FASHION, FOOD, HEALTH_BEAUTY, HOME_OFFICE, PHONES_TABLETS, OTHER]
 */

import { Router } from "express";
import { WinstonLogger } from "../utils/logger/winston.logger";
import { ProductRepository } from "../repositories/product.repository";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";
import { Validator } from "../utils/middlewares/validator.middleware";
import { IdDto } from "../dtos/id.dto";
import { ProductUpdateDto } from "./dtos/product-update.dto";
import { MerchantAuthGaurd } from "../utils/middlewares/guards/merchant.auth.guard";
import { JWTService } from "../utils/jwt/jwt.service";
import { MerchantRepository } from "../repositories/merchant.repository";
import { ProductCreateDto } from "./dtos/product-create.dto";
import { MulterMiddleware } from "../utils/middlewares/file-parser.middleware";
import { ProductPaginationDto } from "./dtos/product-pagination.dto";

const logger = new WinstonLogger("ProductService");
const productRepository = new ProductRepository();
const productService = new ProductService(productRepository, logger);
const productController = new ProductController(productService);
const jwtService = new JWTService();
const merchantRepository = new MerchantRepository();
const merchantAuthGaurd = new MerchantAuthGaurd(
  merchantRepository,
  logger,
  jwtService
);

const validator = new Validator();
const fileParser = new MulterMiddleware(logger);

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with pagination and optional filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 40
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [ELECTRONICS, FASHION, FOOD, HEALTH_BEAUTY, HOME_OFFICE, PHONES_TABLETS, OTHER]
 *         description: Filter by product category
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by merchant's state location
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 hasNextPage:
 *                   type: boolean
 *                 hasPreviousPage:
 *                   type: boolean
 */
router.get(
  "/",
  validator.single(ProductPaginationDto, "query"),
  productController.getAllProducts
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get(
  "/:id",
  validator.single(IdDto, "params"),
  productController.getProductById
);

/**
 * @swagger
 * /products/merchant/{merchantId}:
 *   get:
 *     summary: Get products by merchant ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of merchant's products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get(
  "/merchant/:merchantId",
  validator.single(IdDto, "params"),
  productController.getProductByMerchantId
);

/**
 * @swagger
 * /products/market/{marketId}:
 *   get:
 *     summary: Get products by market ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: marketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of products in the market
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get(
  "/market/:marketId",
  validator.single(IdDto, "params"),
  productController.getMarketProducts
);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - details
 *               - description
 *               - price
 *               - stock
 *               - category
 *               - productImages
 *             properties:
 *               name:
 *                 type: string
 *               details:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *                 enum: [ELECTRONICS, FASHION, FOOD, HEALTH_BEAUTY, HOME_OFFICE, PHONES_TABLETS, OTHER]
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.post(
  "/",
  fileParser.multiple("productImages", 10),
  validator.single(ProductCreateDto, "body"),
  merchantAuthGaurd.authorise(),
  productController.createProduct
);

/**
 * @swagger
 * /products/{productId}/images:
 *   post:
 *     summary: Add images to a product
 *     tags: [Products]
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
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productImages
 *             properties:
 *               productImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.post(
  "/:productId/images",
  fileParser.multiple("productImages", 10),
  validator.single(IdDto, "params"),
  merchantAuthGaurd.authorise(),
  productController.addProductImages
);

/**
 * @swagger
 * /products/{productId}/images/{imageId}:
 *   delete:
 *     summary: Remove an image from a product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Image removed successfully
 */
router.delete(
  "/:productId/images/:imageId",
  validator.single(IdDto, "params"),
  merchantAuthGaurd.authorise(),
  productController.removeProductImage
);

/**
 * @swagger
 * /products/{productId}/images/{imageId}/display:
 *   put:
 *     summary: Set an image as the product's display image
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Display image set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.put(
  "/:productId/images/:imageId/display",
  validator.single(IdDto, "params"),
  merchantAuthGaurd.authorise(),
  productController.makeDisplayImage
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdateRequest'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.put(
  "/:id",
  validator.multiple([
    { schema: IdDto, source: "params" },
    { schema: ProductUpdateDto, source: "body" },
  ]),
  merchantAuthGaurd.authorise(),
  productController.updateProduct
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Product deleted successfully
 */
router.delete(
  "/:id",
  validator.single(IdDto, "params"),
  merchantAuthGaurd.authorise(),
  productController.deleteProduct
);

export default router;
