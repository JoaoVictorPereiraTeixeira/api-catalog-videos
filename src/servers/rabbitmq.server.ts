import {Binding, Context, inject} from '@loopback/context';
import {Application, CoreBindings, Server} from '@loopback/core';
import {MetadataInspector} from '@loopback/metadata';
import {repository} from '@loopback/repository';
import {AmqpConnectionManager, AmqpConnectionManagerOptions, ChannelWrapper, connect} from 'amqp-connection-manager';
import {Channel, ConfirmChannel, Options, Replies} from 'amqplib';
import {RabbitmqSubscribeMetadata, RABBITMQ_SUBSCRIBE_DECORATOR} from '../decorators/rabbitmq-subscribe.decorator';
import {RabbitmqBindings} from '../keys';
import {Category} from '../models';
import {CategoryRepository} from '../repositories';



export interface RabbitmqConfig {
  uri: string
  connOptions?: AmqpConnectionManagerOptions
  exchanges?:{name: string, type: string, options?: Options.AssertExchange}[]
}

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper

  channel: Channel;

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE) public app: Application,
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
    @inject(RabbitmqBindings.CONFIG) private config: RabbitmqConfig
  ) {
    super(app);
    console.log(config)
  }

  async start(): Promise<void> {
    this._conn = connect([this.config.uri], this.config.connOptions);
    this._channelManager =  this.conn.createChannel();
    this.channelManager.on('connect', () =>  {
      this._listening = true
      console.log('Successfully connected a RabbitMQ channel')
    })

    this.channelManager.on('error', (err, {name}) =>  {
      this._listening = false
      console.log(`Failed to setup a RabbitMQ channel - name: ${name} | error: ${err.message}`)
    })

    await this.setupExchanges()

    // @ts-ignore
    console.log(this.getSubscribers()[0][0]['method']())
    // this.boot();
  }

  private async setupExchanges(){
    return this.channelManager.addSetup(async (channel: ConfirmChannel) => {
      if(!this.config.exchanges){
        return
      }

      await Promise.all(this.config.exchanges.map((exchange) => {
        channel.assertExchange(exchange.name, exchange.type, exchange.options)
      }))
    })
  }

  private getSubscribers(){
    const bindings: Array<Readonly<Binding>> = this.find('services.*')

    return bindings.map(
      binding => {
        const metadata = MetadataInspector.getAllMethodMetadata<RabbitmqSubscribeMetadata>(
          RABBITMQ_SUBSCRIBE_DECORATOR, binding.valueConstructor?.prototype
        )

        if(!metadata){
          return []
        }

        const methods = [];

        for(const methodName in metadata){

          if(!Object.prototype.hasOwnProperty.call(metadata, methodName)){
            return;
          }

          const service = this.getSync(binding.key) as any;

          methods.push({
            method: service[methodName].bind(service),
            metadata: metadata[methodName]
          })
        }

        console.log(".............. binding")
        console.log(binding)

        console.log(".............. metadata")
        console.log(metadata)

        console.log(".............. methods")
        console.log(methods)

        return methods
      }
    )


    // const service = this.getSync<CategorySyncService>('services.CategorySyncService')
    // const metadata = MetadataInspector.getAllMethodMetadata<RabbitmqSubscribeMetadata>(
    //   RABBITMQ_SUBSCRIBE_DECORATOR, service
    // )
    // console.log(metadata)
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

  get channelManager(): ChannelWrapper {
    return this._channelManager;
  }
}
