"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
let EmailProcessor = class EmailProcessor extends bullmq_1.WorkerHost {
    async process(job) {
        console.log(`[EmailProcessor] Đang gửi email xác nhận cho Đơn hàng #${job.data.orderId} đến ${job.data.email}...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`[EmailProcessor] Email đã được gửi thành công đến ${job.data.email}!`);
    }
};
exports.EmailProcessor = EmailProcessor;
exports.EmailProcessor = EmailProcessor = __decorate([
    (0, bullmq_1.Processor)('email-queue')
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map