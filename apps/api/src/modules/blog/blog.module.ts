import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { FirebaseAdminModule } from '../auth/firebase-admin.module';
import { AdminBlogController } from './admin-blog.controller';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogRepository } from './repositories/blog.repository';

@Module({
  imports: [DatabaseModule, FirebaseAdminModule],
  controllers: [BlogController, AdminBlogController],
  providers: [BlogService, BlogRepository],
  exports: [BlogService],
})
export class BlogModule {}
