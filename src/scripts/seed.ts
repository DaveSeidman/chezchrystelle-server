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
    images: [],
    price: 6,
    sortOrder: 1
  },
  {
    name: 'Plain Salad Large',
    slug: 'plain-salad-large',
    baseName: 'Plain Salad',
    size: 'large',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'onions', 'vinaigrette'],
    images: [],
    price: 9,
    sortOrder: 2
  },
  {
    name: 'Vegan Salad Small',
    slug: 'vegan-salad-small',
    baseName: 'Vegan Salad',
    size: 'small',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'avocado', 'roasted vegetables'],
    images: [],
    price: 6,
    sortOrder: 3
  },
  {
    name: 'Vegan Salad Large',
    slug: 'vegan-salad-large',
    baseName: 'Vegan Salad',
    size: 'large',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'avocado', 'roasted vegetables'],
    images: [],
    price: 9,
    sortOrder: 4
  },
  {
    name: 'Salad with Grilled Chicken Small',
    slug: 'salad-with-grilled-chicken-small',
    baseName: 'Salad with Grilled Chicken',
    size: 'small',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'grilled chicken', 'vinaigrette'],
    images: [],
    price: 8,
    sortOrder: 5
  },
  {
    name: 'Salad with Grilled Chicken Large',
    slug: 'salad-with-grilled-chicken-large',
    baseName: 'Salad with Grilled Chicken',
    size: 'large',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'grilled chicken', 'vinaigrette'],
    images: [],
    price: 11,
    sortOrder: 6
  },
  {
    name: 'Salad with Grilled Salmon Small',
    slug: 'salad-with-grilled-salmon-small',
    baseName: 'Salad with Grilled Salmon',
    size: 'small',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'grilled salmon', 'vinaigrette'],
    images: [],
    price: 8,
    sortOrder: 7
  },
  {
    name: 'Salad with Grilled Salmon Large',
    slug: 'salad-with-grilled-salmon-large',
    baseName: 'Salad with Grilled Salmon',
    size: 'large',
    ingredients: ['greens', 'tomatoes', 'cucumbers', 'grilled salmon', 'vinaigrette'],
    images: [],
    price: 11,
    sortOrder: 8
  }
] as const;

const seededStores = [
  {
    name: 'Mr. Mango',
    slug: 'mr-mango',
    description: 'Wholesale partner in Fort Greene.',
    pickupAddress: '59 Lafayette Ave, Brooklyn, NY 11217',
    pickupNotes: '',
    mapLocation: { lat: 40.6869, lng: -73.9761 },
    markupAmount: 0
  },
  {
    name: 'Mr. Beet',
    slug: 'mr-beet',
    description: 'Wholesale partner on Smith Street.',
    pickupAddress: '193 Smith St, Brooklyn, NY 11201',
    pickupNotes: '',
    mapLocation: { lat: 40.6858, lng: -73.9911 },
    markupAmount: 0
  },
  {
    name: 'Mr. Kiwi',
    slug: 'mr-kiwi',
    description: 'Wholesale partner on Prospect Park West.',
    pickupAddress: '228 Prospect Park W, Brooklyn, NY 11215',
    pickupNotes: '',
    mapLocation: { lat: 40.6609, lng: -73.9798 },
    markupAmount: 0
  },
  {
    name: 'Key Food (5th Ave)',
    slug: 'key-food-5th-ave',
    description: 'Wholesale partner on 5th Avenue in Park Slope.',
    pickupAddress: '617 Fifth Ave, Brooklyn, NY 11215',
    pickupNotes: '',
    mapLocation: { lat: 40.6631, lng: -73.9877 },
    markupAmount: 0
  },
  {
    name: 'Windsor Terrace Food Coop',
    slug: 'windsor-terrace-food-coop',
    description: 'Wholesale partner in Windsor Terrace.',
    pickupAddress: '825 Caton Ave, Brooklyn, NY 11218',
    pickupNotes: '',
    mapLocation: { lat: 40.6499, lng: -73.9778 },
    markupAmount: 0
  },
  {
    name: 'Prospect Market',
    slug: 'prospect-market',
    description: 'Wholesale partner on Prospect Park West.',
    pickupAddress: '236-238 Prospect Park West, Brooklyn, NY 11215',
    pickupNotes: '',
    mapLocation: { lat: 40.6617, lng: -73.9803 },
    markupAmount: 0
  },
  {
    name: 'East Village Key Food',
    slug: 'east-village-key-food',
    description: 'Wholesale partner in the East Village.',
    pickupAddress: '52 Avenue A, New York, NY 10009',
    pickupNotes: '',
    mapLocation: { lat: 40.7239, lng: -73.9819 },
    markupAmount: 0
  },
  {
    name: 'K-Slope Food Coop',
    slug: 'k-slope-food-coop',
    description: 'Wholesale partner on 9th Street.',
    pickupAddress: '329 9th St, Brooklyn, NY 11215',
    pickupNotes: '',
    mapLocation: { lat: 40.6706, lng: -73.9842 },
    markupAmount: 0
  },
  {
    name: 'The Bad Wife',
    slug: 'the-bad-wife',
    description: 'Wholesale partner on 7th Avenue.',
    pickupAddress: '378 7th Ave #1, Brooklyn, NY 11215',
    pickupNotes: '',
    mapLocation: { lat: 40.6655, lng: -73.9833 },
    markupAmount: 0
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

  for (const store of seededStores) {
    await StoreModel.findOneAndUpdate(
      { slug: store.slug },
      {
        ...store,
        isActive: true,
        availableProductIds: products.map((product) => product._id),
        options: {
          allowPickup: false
        }
      },
      {
        upsert: true,
        new: true
      }
    );
  }

  await ConfigModel.findOneAndUpdate(
    { singletonKey: 'general' },
    {
      singletonKey: 'general',
      deliveryDays: [1, 2, 3, 4, 5, 6],
      lastOrderTime: '20:00',
      orderThanksMessage: 'Thank you for your order! We will follow up by email with any final pickup details.',
      contactEmail: 'hello@chezchrystelle.com',
      orderNotificationEmails: ['hello@chezchrystelle.com'],
      signupNotificationEmails: ['hello@chezchrystelle.com']
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
