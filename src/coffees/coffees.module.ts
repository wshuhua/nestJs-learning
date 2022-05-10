import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { CoffeesService } from './coffees.service';
import { CoffeesController } from './coffees.controller';
import { Coffee } from './entities/coffee.entity';
import { Flavor } from './entities/flavor.entity';
import { Event } from 'src/events/entities/event.entity';
import coffeesConfig from './config/coffees.config';

@Module({
    imports: [TypeOrmModule.forFeature([Coffee, Flavor, Event ]), ConfigModule.forFeature(coffeesConfig)],
    controllers: [CoffeesController],
    providers: [CoffeesService],
})
export class CoffeesModule {}
