"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/http/all-exceptions.filter");
const request_id_middleware_1 = require("./common/http/request-id.middleware");
function resolveCors() {
    const rawOrigins = process.env.CORS_ORIGIN?.trim();
    if (!rawOrigins || rawOrigins === '*') {
        return true;
    }
    return {
        origin: rawOrigins
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        credentials: true,
    };
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: resolveCors(),
    });
    app.use(new request_id_middleware_1.RequestIdMiddleware().use);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.setGlobalPrefix('v1');
    const port = Number(process.env.PORT ?? 4000);
    const host = process.env.HOST ?? '0.0.0.0';
    await app.listen(port, host);
}
void bootstrap();
//# sourceMappingURL=main.js.map