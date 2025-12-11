"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const logger_service_1 = require("./common/logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const logger = app.get(logger_service_1.LoggerService);
    app.useLogger(logger);
    app.enableShutdownHooks();
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                process.env.FRONTEND_URL || 'http://localhost:3000',
                'http://localhost:8080',
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                logger.warn(`Đã chặn request CORS từ origin: ${origin}`);
                callback(new Error('Không được phép bởi CORS'));
            }
        },
        credentials: true,
    });
    const httpAdapter = app.get(core_1.HttpAdapterHost);
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter(httpAdapter));
    app.useGlobalInterceptors(new common_1.ClassSerializerInterceptor(app.get(core_1.Reflector)));
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        disableErrorMessages: false,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('E-commerce API')
        .setDescription('Tài liệu API cho hệ thống thương mại điện tử - Full Features')
        .setVersion('1.0')
        .addTag('Auth', 'Xác thực và phân quyền')
        .addTag('Products', 'Quản lý sản phẩm')
        .addTag('Orders', 'Quản lý đơn hàng')
        .addTag('Reviews', 'Quản lý đánh giá')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT ?? 8080;
    await app.listen(port);
    logger.log(`🚀 Server is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map