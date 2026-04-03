import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): import("../common/http/api-response").ApiResponse<{
        name: string;
        status: string;
        runtimeMode: string;
        processRole: string;
        dbDriver: string;
        serverTime: string;
    }>;
}
