import { Injectable, HttpStatus, HttpException } from '@nestjs/common'; 
import { Coffee } from './entities/coffee.entity';

@Injectable()
export class CoffeesService {
    private coffees: Coffee[] = [{
        id: 1,
        name: '樱花拿铁',
        brand: '星巴克',
        flavors: ['chocolate', 'vanilla']
    }]

    findAll() {
        return this.coffees
    }

    findOne(id: string) {
        const coffee = this.coffees.find(item => item.id === +id)
        if (!coffee) {
            throw new HttpException(`Coffee #${id} not found `,HttpStatus.NOT_FOUND)
        } 
        return coffee; 
    }

    create(createCoffeeOto: any) {
        this.coffees.push(createCoffeeOto);
        return createCoffeeOto;
    }

    update(id: string, updaetCoffeeOto: any) {
        const existingCoffee = this.findOne(id);
        if (existingCoffee) {
            // update the existing entity
        }
    }
    remove(id: string) {
        const coffeeIndex = this.coffees.findIndex(item => item.id === +id);
        if (coffeeIndex > -1) {
            this.coffees.splice(coffeeIndex, 1)
            return {
                status: 'success',
                id
            }
        }
        return {
            status: 'error',
            id
        }
    }
}
