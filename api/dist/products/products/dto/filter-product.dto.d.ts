export declare enum SortOption {
    PRICE_ASC = "price_asc",
    PRICE_DESC = "price_desc",
    NEWEST = "newest",
    OLDEST = "oldest"
}
export declare class FilterProductDto {
    search?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: SortOption;
    page?: number;
    limit?: number;
}
