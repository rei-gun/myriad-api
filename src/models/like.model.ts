import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Post} from './post.model';
import {User} from './user.model';

@model({
  settings: {
    strictObjectIDCoercion: true,
    mongodb: {
      collection: "likes"
    }
  }
})
export class Like extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {
      dataType: 'ObjectId'
    }
  })
  id?: string;

  @property({
    type: 'boolean',
    required: false,
    default: false
  })
  status: boolean;

  @belongsTo(() => Post)
  postId: string;

  @belongsTo(() => User)
  userId: string;

  constructor(data?: Partial<Like>) {
    super(data);
  }
}

export interface LikeRelations {
  // describe navigational properties here
}

export type LikeWithRelations = Like & LikeRelations;
