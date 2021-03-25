import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Platform, PlatformRelations} from '../models';

export class PlatformRepository extends DefaultCrudRepository<
  Platform,
  typeof Platform.prototype.id,
  PlatformRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(Platform, dataSource);
  }
}
