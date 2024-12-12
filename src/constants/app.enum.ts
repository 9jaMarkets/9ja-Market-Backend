import { configService } from "../utils/config/config.service";

export enum AppEnum {
    PORT = 3000,
    PREFIX = '/api/v1',
    BASE_URL = configService.get("BASE_URL") || "http://localhost:3000/api/v1" as unknown as number,
    CLIENT_URL = configService.get("CLIENT_URL") || "http://localhost:5173" as unknown as number,
}