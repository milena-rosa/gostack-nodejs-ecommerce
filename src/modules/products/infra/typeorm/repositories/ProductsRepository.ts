import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';
import AppError from '@shared/errors/AppError';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const newProduct = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(newProduct);

    return newProduct;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const foundProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return foundProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const foundProducts = await this.ormRepository.findByIds(products);
    return foundProducts;
  }

  // export default interface IUpdateProductsQuantityDTO {
  //   id: string;
  //   quantity: number;
  // }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIds = products.map(product => product.id);
    const storedProducts = await this.ormRepository.findByIds(productsIds);

    const updatedProducts = storedProducts.map(storedProduct => {
      const productToBeUpdated = products.find(
        product => product.id === storedProduct.id,
      );

      return {
        ...productToBeUpdated,
        quantity: productToBeUpdated?.quantity,
      };
    });

    return this.ormRepository.save(updatedProducts);
  }
}

export default ProductsRepository;
