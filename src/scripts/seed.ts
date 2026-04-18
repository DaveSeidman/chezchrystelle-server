import { connectToDatabase } from '../config/database';
import { ConfigModel } from '../models/Config';
import { ProductModel } from '../models/Product';
import { StoreModel } from '../models/Store';

const seededProducts = [
  {
    name: 'Plain Salad Small',
    slug: 'plain-salad-small',
    baseName: 'Plain Salad',
    size: 'small',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'onions', 'vinaigrette'],
    price: 12,
    sortOrder: 1
  },
  {
    name: 'Plain Salad Large',
    slug: 'plain-salad-large',
    baseName: 'Plain Salad',
    size: 'large',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'onions', 'vinaigrette'],
    price: 18,
    sortOrder: 2
  },
  {
    name: 'Vegan Salad Small',
    slug: 'vegan-salad-small',
    baseName: 'Vegan Salad',
    size: 'small',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'avocado', 'roasted vegetables'],
    price: 14,
    sortOrder: 3
  },
  {
    name: 'Vegan Salad Large',
    slug: 'vegan-salad-large',
    baseName: 'Vegan Salad',
    size: 'large',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'avocado', 'roasted vegetables'],
    price: 20,
    sortOrder: 4
  },
  {
    name: 'Salad with Grilled Chicken Small',
    slug: 'salad-with-grilled-chicken-small',
    baseName: 'Salad with Grilled Chicken',
    size: 'small',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'grilled chicken', 'vinaigrette'],
    price: 16,
    sortOrder: 5
  },
  {
    name: 'Salad with Grilled Chicken Large',
    slug: 'salad-with-grilled-chicken-large',
    baseName: 'Salad with Grilled Chicken',
    size: 'large',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'grilled chicken', 'vinaigrette'],
    price: 22,
    sortOrder: 6
  },
  {
    name: 'Salad with Grilled Salmon Small',
    slug: 'salad-with-grilled-salmon-small',
    baseName: 'Salad with Grilled Salmon',
    size: 'small',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'grilled salmon', 'vinaigrette'],
    price: 18,
    sortOrder: 7
  },
  {
    name: 'Salad with Grilled Salmon Large',
    slug: 'salad-with-grilled-salmon-large',
    baseName: 'Salad with Grilled Salmon',
    size: 'large',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'grilled salmon', 'vinaigrette'],
    price: 24,
    sortOrder: 8
  }
] as const;

async function seed() {
  await connectToDatabase();

  for (const product of seededProducts) {
    await ProductModel.findOneAndUpdate({ slug: product.slug }, product, {
      upsert: true,
      new: true
    });
  }

  const products = await ProductModel.find({}).sort({ sortOrder: 1 });

  await StoreModel.findOneAndUpdate(
    { slug: 'brooklyn' },
    {
      name: 'Brooklyn Pickup',
      slug: 'brooklyn',
      description: 'Primary pickup location for Chez Chrystelle orders.',
      isActive: true,
      pickupAddress: 'Brooklyn, NY',
      pickupNotes: 'Exact pickup details are shared after confirmation.',
      availableProductIds: products.map((product) => product._id),
      options: {
        allowPickup: true
      }
    },
    {
      upsert: true,
      new: true
    }
  );

  await ConfigModel.findOneAndUpdate(
    { singletonKey: 'general' },
    {
      singletonKey: 'general',
      deliveryDays: [1, 2, 3, 4, 5, 6],
      lastOrderTime: '20:00',
      orderThanksMessage: 'Thank you for your order! We will follow up by email with any final pickup details.',
      contactEmail: 'chrystelleseidman@gmail.com',
      orderNotificationEmails: []
    },
    {
      upsert: true,
      new: true
    }
  );

  console.log('Seed completed');
  process.exit(0);
}

void seed();
