// 特定于功能的配置的文件
import { registerAs } from '@nestjs/config';

export default registerAs('coffees', () => ({
    foo: 'bar'
}))