import {Context, inject} from '@loopback/context';
import {Server} from '@loopback/core';
import {repository} from '@loopback/repository';
import {AmqpConnectionManager, AmqpConnectionManagerOptions, ChannelWrapper, connect} from 'amqp-connection-manager';
import {Channel, Replies} from 'amqplib';
import {RabbitmqBindings} from '../keys';
import {Category} from '../models';
import {CategoryRepository} from '../repositories';


export interface RabbitmqConfig {
  uri: string
  connOptions?: AmqpConnectionManagerOptions
}

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper

  channel: Channel;

  constructor(
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
    @inject(RabbitmqBindings.CONFIG) private config: RabbitmqConfig
  ) {
    super();
    console.log(config)
  }


  async start(): Promise<void> {
    this._conn = connect([this.config.uri], this.config.connOptions);
    this._channelManager =  this.conn.createChannel();
    this._channelManager.on('connect', () =>  {
      this._listening = true
      console.log('Successfully connected a RabbitMQ channel')
    })

    this._channelManager.on('error', (err, {name}) =>  {
      this._listening = false
      console.log(`Failed to setup a RabbitMQ channel - name: ${name} | error: ${err.message}`)
    })

    // this.boot();
  }

  async boot() {
    // @ts-ignore
    this.channel = await this.conn.createChannel();

    const queue: Replies.AssertQueue =
      await this.channel.assertQueue('micro-catalog/sync-videos');

    const exchange: Replies.AssertExchange =
      await this.channel.assertExchange('amq.topic', 'topic');

    await this.channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

    await this.channel.consume(queue.queue, (message) => {
      if (!message) {
        return;
      }

      const data = JSON.parse(message.content.toString());
      const [model, event] = message.fields.routingKey.split('.').slice(1);
      this
        .sync({model, event, data})
        .then(() => this.channel.ack(message))
        .catch((err) => {
          console.log(err)
          this.channel.reject(message,false)
        })
      console.log(model, event);
    });
  }

  async sync({model, event, data}: {model: string, event: string, data: Category}) {
    if (model === 'category') {
      switch (event) {
        case 'created':
          await this.categoryRepo.create({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          break;
        case 'updated':
          await this.categoryRepo.updateById(data.id, data)
          break;
        case 'deleted':
          await this.categoryRepo.deleteById(data.id);
          break;
        default:
          break;
      }
    }
  }

  async stop(): Promise<void> {
    await this.conn.close();
    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }

  get conn(): AmqpConnectionManager {
    return this._conn;
  }
}
