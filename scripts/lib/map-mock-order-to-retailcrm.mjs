/**
 * Maps one entry from mock_orders.json to RetailCRM SerializedOrder (API v5).
 * @see https://help.retailcrm.pro/api_v5_en.html — POST /api/v5/orders/create
 *
 * If SKU is not found in catalog, RetailCRM creates a line from
 * productName, quantity, initialPrice (per API docs).
 */

/**
 * @param {object} mock - single object from mock_orders.json
 * @param {{ index: number }} ctx
 * @param {{ site?: string; countryIso?: string; includeCustomFields?: boolean; orderType?: string; orderMethod?: string; status?: string }} [opts]
 * @returns {object}
 */
export function mapMockOrderToRetailOrder(mock, ctx, opts = {}) {
  const index = ctx.index ?? 0;
  const externalId = `gbc-mock-${String(index + 1).padStart(3, "0")}`;

  const orderType = opts.orderType ?? mock.orderType;
  const orderMethod = opts.orderMethod ?? mock.orderMethod;
  const status = opts.orderStatus ?? mock.status;

  /** @type {object} */
  const order = {
    externalId,
    firstName: mock.firstName,
    lastName: mock.lastName,
    phone: mock.phone,
    email: mock.email,
    orderType,
    orderMethod,
    status,
    countryIso: opts.countryIso ?? "KZ",
    items: mapItems(mock.items),
  };

  const delivery = mapDelivery(mock.delivery);
  if (delivery) {
    order.delivery = delivery;
  }

  if (opts.includeCustomFields && mock.customFields && typeof mock.customFields === "object") {
    order.customFields = mock.customFields;
  }

  return order;
}

function mapItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((it) => ({
    productName: it.productName,
    quantity: it.quantity ?? 1,
    initialPrice: it.initialPrice,
  }));
}

function mapDelivery(delivery) {
  if (!delivery?.address) {
    return undefined;
  }
  const { city, text } = delivery.address;
  const address = {};
  if (city) {
    address.city = city;
  }
  if (text) {
    address.text = text;
  }
  if (Object.keys(address).length === 0) {
    return undefined;
  }
  return { address };
}
