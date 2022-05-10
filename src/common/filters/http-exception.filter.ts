import { HttpException } from "@nestjs/common";
import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter<T extends HttpException>
  implements ExceptionFilter
{
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const execptionResponse = exception.getResponse();
    const error =
      typeof response === "string"
        ? { message: execptionResponse }
        : (execptionResponse as Object);
    response.status(status).json({
      error,
      timestamp: new Date().toISOString()
    })
  }
}
