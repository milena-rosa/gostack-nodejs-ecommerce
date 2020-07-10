import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found', 400);
    }

    const productsIds = products.map(product => ({ id: product.id }));
    const foundProducts = await this.productsRepository.findAllById(
      productsIds,
    );

    if (foundProducts.length !== products.length) {
      throw new AppError('One or more products were not found.', 400);
    }

    const updatedStock = foundProducts.map(foundProduct => {
      const { quantity } = products.find(
        product => product.id === foundProduct.id,
      ) as IProduct;

      return {
        id: foundProduct.id,
        quantity: foundProduct.quantity - quantity,
      };
    });

    if (updatedStock.some(product => product.quantity < 0)) {
      throw new AppError('Product out of stock');
    }

    const orderedProducts = foundProducts.map(foundProduct => {
      const orderedProduct = products.find(
        product => product.id === foundProduct.id,
      );

      return {
        product_id: foundProduct.id,
        price: foundProduct.price,
        quantity: orderedProduct?.quantity,
      };
    });

    const orders = await this.ordersRepository.create({
      customer,
      products: foundProducts.map(foundProduct => {
        const updatedProduct = products.find(
          product => product.id === foundProduct.id,
        ) as IProduct;

        return {
          product_id: foundProduct.id,
          price: foundProduct.price,
          quantity: updatedProduct?.quantity,
        };
      }),
    });

    await this.productsRepository.updateQuantity(updatedStock);

    return orders;
  }
}

export default CreateOrderService;
