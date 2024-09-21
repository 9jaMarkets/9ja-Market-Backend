import { NextFunction, Request, RequestHandler, Response } from "express";
import { MarketAuthService } from "./market.auth.service";
import { ResponseDto } from "../../dtos/response.dto";
import { ResponseStatus } from "../../dtos/interfaces/response.interface";
import { SuccessMessages } from "../../constants/success-messages.enum";
import { HttpStatus } from "../../constants/http-status.enum";
import { RequestParserHelper } from "../../helpers/request-parser.helper";
import { AppEnum } from "../../constants/app.enum";

export class MarketAuthController {
    constructor(private readonly marketAuthService: MarketAuthService) { }

    /**
   * Authenticates Market
   * @param request {Request}
   * @param response (Response}
   * @param next {NextFunction}
   */

    login: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const result = await this.marketAuthService.login(request.body);
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.LOGIN_SUCCESSFUL, result);
            return response.status(HttpStatus.OK).send(resObj);
        } catch (e) {
            next(e);
        }
    }

    /**
     * Registers Market
     * @param request {Request}
     * @param response {Response}
     * @param next {NextFunction}
     */
    register: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const url = new RequestParserHelper(request).getUrl('/auth/market/verify-email-token');
            await this.marketAuthService.register(request.body, url);
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.REGISTRATION_SUCCESSFUL);
            return response.status(HttpStatus.CREATED).send(resObj);
        } catch (e) {
            next(e);
        }
    }


    /**
     * Email Verification Email
     * @param request {Request}
     * @param response {Response}
     * @param next {NextFunction}
     */
    emailVerification: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const url = new RequestParserHelper(request).getUrl('/auth/market/verify-email-token');
            await this.marketAuthService.emailVerification(request.body, url);
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.VERIFICATION_EMAIL_SENT);
            return response.status(HttpStatus.OK).send(resObj);
        } catch (e) {
            next(e);
        }
    }

    /**
     * Verify Email By Token Query
     * @param request {Request}
     * @param response {Response}
     * @param next {NextFunction}
     */
    verifyEmailByQuery: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            await this.marketAuthService.verifyEmail(request.query as { token: string });
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.EMAIL_VERIFICATION_SUCCESS);
            return response.status(HttpStatus.OK).send(resObj);
        } catch (e) {
            next(e);
        }
    }

    /**
     * Verify Email
     * @param request {Request}
     * @param response {Response}
     * @param next {NextFunction}
     */
    verifyEmail: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            await this.marketAuthService.verifyEmail(request.body);
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.EMAIL_VERIFICATION_SUCCESS);
            return response.status(HttpStatus.OK).send(resObj);
        } catch (e) {
            next(e);
        }
    }

    /**
     * Forgot Password
     * @param request {Request}
     * @param response {Response}
     * @param next {NextFunction}
     */
    forgotPassword: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            // const url = new RequestParserHelper(request).getUrl('/auth/market/reset-password');
            await this.marketAuthService.forgotPassword(request.body);
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.FORGOT_PASSWORD_SUCCESS);
            return response.status(HttpStatus.OK).send(resObj);
        } catch (e) {
            next(e);
        }
    }

    /**
     * Reset Password
     * @param request {Request}
     * @param response {Response}
     * @param next {NextFunction}
     */
    resetPassword: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            await this.marketAuthService.resetPassword(request.body);
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.RESET_PASSWORD_SUCCESS);
            return response.status(HttpStatus.OK).send(resObj);
        } catch (e) {
            next(e);
        }
    }

      /**
   * Refresh Token
   * @param request {Request}
   * @param response {Response}
   * @param next {NextFunction}
   */
      refreshToken: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const result = await this.marketAuthService.refreshToken(request.body.refreshToken);
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.REFRESH_TOKEN_SUCCESS, result);
            return response.status(HttpStatus.OK).send(resObj);
        } catch (e) {
            next(e);
        }
    }

    /**
    * Google Auth
    * @param request {Request}
    * @param response {Response}
    * @param next {NextFunction}
    */
    googleAuth: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const profile = JSON.parse(request.query.profile as string);
            const result = await this.marketAuthService.googleCreateOrLogin(profile);
            return response.redirect(`${AppEnum.CLIENT_URL}/auth?token=${result}`);
        } catch (e) {
            next(e);
        }
    }

    /**
    * Exchange Token
    * @param request {Request}
    * @param response {Response}
    * @param next {NextFunction}
    */
    exchangeToken: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            const result = await this.marketAuthService.exchangeToken(request.body);
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.LOGIN_SUCCESSFUL, result);
            return response.status(HttpStatus.OK).send(resObj);
        } catch (e) {
            next(e);
        }
    }

      /**
    * Logout
    * @param request {Request}
    * @param response {Response}
    * @param next {NextFunction}
    */

      logout: RequestHandler = async (request: Request, response: Response, next: NextFunction) => {
        try {
            await this.marketAuthService.logout(request.body.refreshToken);
            const resObj = new ResponseDto(ResponseStatus.SUCCESS, SuccessMessages.LOGOUT_SUCCESS);
            return response.status(HttpStatus.OK).send(resObj);
        } catch (e) {
            next(e);
        }
    }
}