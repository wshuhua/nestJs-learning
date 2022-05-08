import { PartialType } from "@nestjs/mapped-types";
import { CreateCoffeeDto } from "./create-coffee.dto";

// 1. PartialType 期望在里面传入一个type
// 2. PartialType不仅标记，所有字段都是可选的，而且它还继承了通过装饰器应用的所有验证规则。
// 以及动态添加单个附加验证规则到每个字段的@ isOptional()规则

export class UpateCoffeeDto extends PartialType(CreateCoffeeDto) {}