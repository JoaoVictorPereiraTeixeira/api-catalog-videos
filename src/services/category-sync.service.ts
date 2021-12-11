import { /* inject, */ BindingScope, injectable, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Message} from 'amqplib';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository} from '../repositories';
import {BaseModelSyncService} from './base-model-sync-service';
import {ValidatorService} from './validator.service';

@injectable({scope: BindingScope.SINGLETON})
export class CategorySyncService extends BaseModelSyncService {
  constructor(
    @repository(CategoryRepository) private repo: CategoryRepository,
    @service(ValidatorService) private validator: ValidatorService,
    ) {
      super(validator)
    }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'micro-catalog/sync-videos/category',
    routingKey: 'model.category.*'
  })
  async handler({data,message}:{data: any, message: Message}){
    console.log("DATA:   ===============")
    console.log(data);

    console.log("message: ==============")
    console.log(message);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'micro-catalog/sync-videos/testandoautomatico',
    routingKey: 'model.category.banana.*'
  })
  async handler2({data,message}:{data: any, message: Message}){
    console.log("DATA: ==============")
    console.log(data)


    console.log("message: ==============")
    console.log(message)
  }
}
