import { Injectable, HttpStatus, HttpException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository } from "typeorm";
import { CreateCoffeeDto } from "./dto/create-coffee.dto";
import { UpateCoffeeDto } from "./dto/upate-coffee.dto";
import { Coffee } from "./entities/coffee.entity";
import { Flavor } from "./entities/flavor.entity";
import { PaginationQueryDto } from "./../common/dto/pagination-query.dto";
import { Event } from '../events/entities/event.entity'

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(Flavor)
    private readonly flavorRepository: Repository<Flavor>,
    private readonly connection: Connection
  ) {}

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
