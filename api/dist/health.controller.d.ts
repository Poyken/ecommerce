import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
export declare class HealthController {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    check(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
    ready(): Promise<{
        status: string;
        timestamp: string;
        checks: {
            database: boolean;
            redis: boolean;
        };
    }>;
    info(): {
        status: string;
        timestamp: string;
        version: string;
        node: string;
        memory: {
            heapUsed: string;
            heapTotal: string;
        };
        uptime: string;
    };
}
