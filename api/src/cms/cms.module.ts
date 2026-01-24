import { Module } from '@nestjs/common';
import { BlogModule } from './blog/blog.module';
import { PagesModule } from './pages/pages.module';
import { MediaModule } from './media/media.module';

/**
 * ======================================================================
 * CMS MODULE - Content Management System
 * ======================================================================
 *
 * ======================================================================
 */

@Module({
  imports: [BlogModule, PagesModule, MediaModule],
  exports: [BlogModule, PagesModule, MediaModule],
})
export class CmsModule {}
