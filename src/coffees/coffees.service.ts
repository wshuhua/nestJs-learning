import { Injectable, HttpStatus, HttpException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository } from "typeorm";
import { CreateCoffeeDto } from "./dto/create-coffee.dto";
import { UpateCoffeeDto } from "./dto/upate-coffee.dto";
import { Coffee } from "./entities/coffee.entity";
import { Flavor } from "./entities/flavor.entity";
import { PaginationQueryDto } from "./../common/dto/pagination-query.dto";
import { Event } from '../events/entities/event.entity'
import { ConfigService } from "@nestjs/config";
import coffeesConfig from "./config/coffees.config";


@Injectable()
export class CoffeesService {
  // constructor(
  //   @InjectRepository(Coffee)
  //   private readonly coffeeRepository: Repository<Coffee>,
  //   @InjectRepository(Flavor)
  //   private readonly flavorRepository: Repository<Flavor>,
  //   private readonly connection: Connection,
  //   private readonly configService: ConfigService
  // ) {
  //   // configService.get方法是应用程序注册的各种配置属性的通用方法
  //   // 在获取.env或者在单个服务中一次与许多不同的配置对象交互时，它会派上用场。
  //   // 缺点： 检索嵌套属性时，没有完全的类型安全性。对于测试也更加困难

  //   // 1. 方式1
  //   // const databasePort = this.configService.get<string>('DATABASE_PORT');
  //   // console.log(databasePort, 'databasePost ')
     
  //   // 2. 方式2
  //   const databaseHost = this.configService.get('database.host');
  //   console.log(databaseHost, 'databaseHost ')

  //   // 3. 方式3
  //   const coffees = this.configService.get('coffees')
  //   console.log(coffees)
  // }

  constructor(
    @InjectRepository(Coffee)
    private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(Flavor)
    private readonly flavorRepository: Repository<Flavor>,
    private readonly connection: Connection,
    // 直接注入整个命名空间配置对象，每个命名空间配置都暴露了一个“key”属性，我们可以使用该属性将整个对象注入到在Nest容器中注册的任何类。
    @Inject(coffeesConfig.KEY)
    private readonly coffeesconfiguration: ConfigService<typeof coffeesConfig>
  ) {
    console.log(coffeesconfiguration)
  }

  findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery;
    return this.coffeeRepository.find({
      relations: ["flavors"],
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: string) {
    const coffee = await this.coffeeRepository.findOne({
      where: { id: +id },
      relations: ["flavors"],
    });
    if (!coffee) {
      throw new HttpException(`Coffee #${id} not found `, HttpStatus.NOT_FOUND);
    }
    return coffee;
  }

  async create(createCoffeeOto: CreateCoffeeDto) {
    const flavors = await Promise.all(
      createCoffeeOto.flavors.map((name) => this.preloadFlavorByName(name))
    );
    const coffee = this.coffeeRepository.create({
      ...createCoffeeOto,
      flavors,
    });
    return this, this.coffeeRepository.save(coffee);
  }

  async update(id: string, updaetCoffeeOto: UpateCoffeeDto) {
    const flavors =
      updaetCoffeeOto.flavors &&
      (await Promise.all(
        updaetCoffeeOto.flavors.map((name) => this.preloadFlavorByName(name))
      ));
    const coffee = await this.coffeeRepository.preload({
      id: +id,
      ...updaetCoffeeOto,
      flavors,
    });
    if (!coffee) {
      throw new HttpException(`coffee #${id} not found`, HttpStatus.NOT_FOUND);
    }
    return this.coffeeRepository.save(coffee);
  }
  async remove(id: string) {
    const coffee = await this.coffeeRepository.findOneBy({ id: +id });
    this.coffeeRepository.remove(coffee);
  }

  // 为了保持事务的一致性
  async recommendCoffee(coffee: Coffee) {
      console.log(coffee, 'coffeecoffee')
      const queryRunner = this.connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
          coffee.recommendations++;
          const recommendEvent = new Event();
          recommendEvent.name = 'recommend_coffee';
          recommendEvent.type = 'coffee';
          recommendEvent.payload = { coffedId: coffee.id}
          await queryRunner.commitTransaction();
      } catch (error) {
          await queryRunner.rollbackTransaction();
      } finally {
          await queryRunner.release()
      }
  }

  private async preloadFlavorByName(name: string): Promise<Flavor> {
    const existingFlavor = await this.flavorRepository.findOne({
      where: { name },
    });

    if (existingFlavor) {
      return existingFlavor;
    }
    return this.flavorRepository.create({ name });
  }
}
