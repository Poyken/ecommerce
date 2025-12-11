export declare class CreateOptionDto {
    name: string;
    values: string[];
}
export declare class CreateProductDto {
    name: string;
    slug?: string;
    description?: string;
    categoryId: string;
    brandId: string;
    options?: CreateOptionDto[];
}
