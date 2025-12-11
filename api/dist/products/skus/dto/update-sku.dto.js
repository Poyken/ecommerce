"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSkuDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_sku_dto_1 = require("./create-sku.dto");
class UpdateSkuDto extends (0, swagger_1.PartialType)(create_sku_dto_1.CreateSkuDto) {
}
exports.UpdateSkuDto = UpdateSkuDto;
//# sourceMappingURL=update-sku.dto.js.map