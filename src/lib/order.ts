import { ConfigModel } from '../models/Config';
import { HttpError } from './httpError';

type OrderInputItem = {
  productId: string;
  quantity: number;
};

type OrderStore = {
  markupAmount?: number;
};

type OrderProduct = {
  _id: unknown;
  id?: string;
  price: number;
};

function getBusinessNow(timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(new Date());
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${partMap.year}-${partMap.month}-${partMap.day}`,
    hour: Number(partMap.hour),
    minute: Number(partMap.minute)
  };
}

function getWeekdayFromDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

function parseClock(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes };
}

export async function getGeneralConfig() {
  const config = await ConfigModel.findOne({ singletonKey: 'general' }).lean();

  if (!config) {
    throw new HttpError(500, 'General config not found');
  }

  return config;
}

export function assertFulfillmentDateAllowed(fulfillmentDate: string, deliveryDays: number[], lastOrderTime: string, timeZone: string) {
  const weekday = getWeekdayFromDateString(fulfillmentDate);

  if (!deliveryDays.includes(weekday)) {
    throw new HttpError(400, 'Selected fulfillment day is not available');
  }

  const now = getBusinessNow(timeZone);

  if (fulfillmentDate < now.date) {
    throw new HttpError(400, 'Fulfillment date cannot be in the past');
  }

  if (fulfillmentDate === now.date) {
    const cutoff = parseClock(lastOrderTime);
    const minutesNow = now.hour * 60 + now.minute;
    const minutesCutoff = cutoff.hours * 60 + cutoff.minutes;

    if (minutesNow > minutesCutoff) {
      throw new HttpError(400, 'Ordering for today has closed');
    }
  }
}

export function buildOrderTotals(store: OrderStore, products: OrderProduct[], items: OrderInputItem[]) {
  let subtotal = 0;
  let markupTotal = 0;

  const lineItems = items.map((item) => {
    const product = products.find((candidate) => (candidate.id ? candidate.id : String(candidate._id)) === item.productId);

    if (!product) {
      throw new HttpError(400, 'Invalid product selected');
    }

    const basePrice = product.price;
    const markupAmount = store.markupAmount ?? 0;
    const finalUnitPrice = basePrice + markupAmount;
    const lineTotal = finalUnitPrice * item.quantity;

    subtotal += basePrice * item.quantity;
    markupTotal += markupAmount * item.quantity;

    return {
      productId: product._id,
      quantity: item.quantity,
      basePrice,
      markupAmount,
      finalUnitPrice,
      lineTotal
    };
  });

  return {
    lineItems,
    totals: {
      subtotal,
      markupTotal,
      total: subtotal + markupTotal
    }
  };
}
