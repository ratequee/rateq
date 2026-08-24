import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { FirebaseAdminModule } from '../auth/firebase-admin.module';
import { AdminCategoriesController } from './admin-categories.controller';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './repositories/categories.repository';
import { CategoryServicesRepository } from './repositories/category-services.repository';

@Module({
  imports: [DatabaseModule, FirebaseAdminModule],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService, CategoriesRepository, CategoryServicesRepository],
  exports: [CategoriesService, CategoriesRepository, CategoryServicesRepository],
})
export class CategoriesModule {}
