/**
 * =====================================================================
 * CMS TYPE DEFINITIONS - Types for Page Builder and Content Management
 * =====================================================================
 */

export interface Block {
  id: string;
  type: string;
  props: Record<string, any>; // Props can vary significantly by block type
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  blocks: Block[];
  isPublished: boolean;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePageDto {
  title: string;
  slug: string;
  blocks?: Block[];
  isPublished?: boolean;
  metaDescription?: string;
}

export interface UpdatePageDto extends Partial<CreatePageDto> {}
