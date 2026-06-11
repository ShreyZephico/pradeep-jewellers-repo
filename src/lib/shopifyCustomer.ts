import {
  getShopifyStoreDomain,
  getShopifyStorefrontToken,
} from "@/lib/checkoutAuth";
import { getShopifyAdminToken } from "@/lib/shopifyEnv";

const storefrontApiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04';
const adminApiVersion = process.env.SHOPIFY_ADMIN_API_VERSION ?? '2024-01';

type ShopifyUserError = {
  code?: string;
  field?: string[] | null;
  message: string;
};

type CustomerInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
};

type Customer = {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
};

export type CustomerAddress = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  province?: string | null;
  country: string;
  zip: string;
  phone?: string | null;
};

export type CustomerProfile = {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  acceptsMarketing: boolean;
  defaultAddress: CustomerAddress | null;
  addresses: CustomerAddress[];
};

export type MailingAddressInput = {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
};

export type CustomerUpdateInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  acceptsMarketing?: boolean;
  password?: string;
};

type CustomerToken = {
  accessToken: string;
  expiresAt: string;
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function storefrontUrl() {
  const domain = getShopifyStoreDomain();
  const token = getShopifyStorefrontToken();
  if (!domain || !token) {
    throw new Error(
      "Missing Shopify Storefront credentials. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN."
    );
  }
  return `https://${domain}/api/${storefrontApiVersion}/graphql.json`;
}

function adminUrl() {
  const domain = getShopifyStoreDomain();
  if (!domain) {
    throw new Error("Missing SHOPIFY_STORE_DOMAIN (or NEXT_PUBLIC_SHOPIFY_STORE).");
  }
  return `https://${domain}/admin/api/${adminApiVersion}/graphql.json`;
}

function requireAdminToken(): string {
  const token = getShopifyAdminToken();
  if (!token) {
    throw new Error("Missing SHOPIFY_ADMIN_ACCESS_TOKEN.");
  }
  return token;
}

async function shopifyStorefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(storefrontUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': getShopifyStorefrontToken()!,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message ?? `Shopify Storefront API returned ${response.status}`);
  }

  return json.data as T;
}

async function shopifyAdminFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(adminUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': requireAdminToken(),
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message ?? `Shopify Admin API returned ${response.status}`);
  }

  return json.data as T;
}

function escapeSearchValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function splitCustomerName(name: string) {
  const [firstName, ...rest] = name.trim().split(/\s+/);

  return {
    firstName: firstName || '',
    lastName: rest.join(' '),
  };
}

export function googleCustomerPassword(email: string) {
  let hash = 0;

  for (let index = 0; index < email.length; index += 1) {
    hash = (hash * 31 + email.charCodeAt(index)) >>> 0;
  }

  const safeEmailPart = email
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 18) || 'customer';
  const safeHash = hash.toString(36).padStart(7, '0').slice(0, 7);

  return `Gg_${safeEmailPart}_${safeHash}_Aa1`;
}

export function legacyGoogleCustomerPasswords(email: string) {
  return [`Google_${email}_123!`];
}

function getCustomerNumericId(customerId: string) {
  return customerId.includes('/')
    ? customerId.split('/').pop()
    : customerId;
}

export async function findCustomerByEmailOrPhone(email?: string, phone?: string) {
  const parts = [
    email ? `email:'${escapeSearchValue(email)}'` : '',
    phone ? `phone:'${escapeSearchValue(phone)}'` : '',
  ].filter(Boolean);

  if (!parts.length) {
    return null;
  }

  const query = `
    query FindCustomer($query: String!) {
      customers(first: 1, query: $query) {
        edges {
          node {
            id
            email
            phone
            displayName
          }
        }
      }
    }
  `;

  const data = await shopifyAdminFetch<{
    customers: {
      edges: {
        node: Customer;
      }[];
    };
  }>(query, { query: parts.join(' OR ') });

  return data.customers.edges[0]?.node ?? null;
}

export async function createCustomer(input: CustomerInput) {
  const mutation = `
    mutation CreateCustomer($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          phone
          displayName
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customerCreate: {
      customer: Customer | null;
      customerUserErrors: ShopifyUserError[];
    };
  }>(mutation, { input });

  return data.customerCreate;
}

export async function verifyCustomerPassword(
  email: string,
  password: string
): Promise<boolean> {
  const result = await createCustomerAccessToken(email, password);
  return Boolean(result.customerAccessToken);
}

export async function createCustomerAccessToken(email: string, password: string) {
  const mutation = `
    mutation CreateCustomerAccessToken($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: CustomerToken | null;
      customerUserErrors: ShopifyUserError[];
    };
  }>(mutation, { input: { email, password } });

  return data.customerAccessTokenCreate;
}

export async function getCustomerByAccessToken(customerAccessToken: string) {
  const query = `
    query CustomerByAccessToken($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        email
        phone
        firstName
        lastName
        displayName
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customer: Customer | null;
  }>(query, { customerAccessToken });

  return data.customer;
}

export async function createCustomerTokenWithPasswords(
  email: string,
  passwords: string[]
) {
  const errors: ShopifyUserError[] = [];

  for (const password of passwords) {
    const result = await createCustomerAccessToken(email, password);

    if (result.customerAccessToken) {
      return result.customerAccessToken;
    }

    errors.push(...result.customerUserErrors);
  }

  return { errors };
}

export async function updateCustomerPassword(customerId: string, password: string) {
  const numericId = getCustomerNumericId(customerId);

  if (!numericId) {
    throw new Error('Missing Shopify customer id');
  }

  const response = await fetch(
    `https://${getShopifyStoreDomain()}/admin/api/${adminApiVersion}/customers/${numericId}.json`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': requireAdminToken(),
      },
      body: JSON.stringify({
        customer: {
          id: Number(numericId),
          password,
          password_confirmation: password,
        },
      }),
      cache: 'no-store',
    }
  );

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(
      typeof json.errors === 'string'
        ? json.errors
        : 'Unable to link this Shopify customer to Google login.'
    );
  }

  return json.customer as Customer;
}

const ADDRESS_FIELDS = `
  id
  firstName
  lastName
  company
  address1
  address2
  city
  province
  country
  zip
  phone
`;

function mapAddressNode(
  node: CustomerAddress | null | undefined
): CustomerAddress | null {
  if (!node?.id || !node.address1 || !node.city || !node.country || !node.zip) {
    return null;
  }
  return node;
}

function mapCustomerProfile(customer: {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  acceptsMarketing?: boolean;
  defaultAddress?: CustomerAddress | null;
  addresses?: { edges: { node: CustomerAddress }[] };
} | null): CustomerProfile | null {
  if (!customer?.id || !customer.email) return null;

  const addresses =
    customer.addresses?.edges
      ?.map((edge) => mapAddressNode(edge.node))
      .filter((row): row is CustomerAddress => Boolean(row)) ?? [];

  return {
    id: customer.id,
    email: customer.email,
    phone: customer.phone ?? null,
    firstName: customer.firstName ?? null,
    lastName: customer.lastName ?? null,
    displayName: customer.displayName ?? null,
    acceptsMarketing: Boolean(customer.acceptsMarketing),
    defaultAddress: mapAddressNode(customer.defaultAddress),
    addresses,
  };
}

function formatUserErrors(errors: ShopifyUserError[]): string {
  return (
    errors.map((error) => error.message).filter(Boolean).join(" ") ||
    "Unable to update your profile."
  );
}

export async function getCustomerProfile(
  customerAccessToken: string
): Promise<CustomerProfile | null> {
  const query = `
    query CustomerProfile($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        email
        phone
        firstName
        lastName
        displayName
        acceptsMarketing
        defaultAddress {
          ${ADDRESS_FIELDS}
        }
        addresses(first: 20) {
          edges {
            node {
              ${ADDRESS_FIELDS}
            }
          }
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customer: Parameters<typeof mapCustomerProfile>[0];
  }>(query, { customerAccessToken });

  return mapCustomerProfile(data.customer);
}

export async function updateCustomerProfile(
  customerAccessToken: string,
  customer: CustomerUpdateInput
) {
  const mutation = `
    mutation UpdateCustomer($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer {
          id
          email
          phone
          firstName
          lastName
          displayName
          acceptsMarketing
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customerUpdate: {
      customer: Customer | null;
      customerUserErrors: ShopifyUserError[];
    };
  }>(mutation, { customerAccessToken, customer });

  if (data.customerUpdate.customerUserErrors.length > 0) {
    throw new Error(formatUserErrors(data.customerUpdate.customerUserErrors));
  }

  return data.customerUpdate.customer;
}

export async function createCustomerAddress(
  customerAccessToken: string,
  address: MailingAddressInput
) {
  const mutation = `
    mutation CreateAddress($customerAccessToken: String!, $address: MailingAddressInput!) {
      customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
        customerAddress {
          ${ADDRESS_FIELDS}
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customerAddressCreate: {
      customerAddress: CustomerAddress | null;
      customerUserErrors: ShopifyUserError[];
    };
  }>(mutation, { customerAccessToken, address });

  if (data.customerAddressCreate.customerUserErrors.length > 0) {
    throw new Error(formatUserErrors(data.customerAddressCreate.customerUserErrors));
  }

  return mapAddressNode(data.customerAddressCreate.customerAddress);
}

export async function updateCustomerAddress(
  customerAccessToken: string,
  id: string,
  address: MailingAddressInput
) {
  const mutation = `
    mutation UpdateAddress($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
      customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
        customerAddress {
          ${ADDRESS_FIELDS}
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customerAddressUpdate: {
      customerAddress: CustomerAddress | null;
      customerUserErrors: ShopifyUserError[];
    };
  }>(mutation, { customerAccessToken, id, address });

  if (data.customerAddressUpdate.customerUserErrors.length > 0) {
    throw new Error(formatUserErrors(data.customerAddressUpdate.customerUserErrors));
  }

  return mapAddressNode(data.customerAddressUpdate.customerAddress);
}

export async function deleteCustomerAddress(
  customerAccessToken: string,
  id: string
) {
  const mutation = `
    mutation DeleteAddress($customerAccessToken: String!, $id: ID!) {
      customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
        deletedCustomerAddressId
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customerAddressDelete: {
      deletedCustomerAddressId: string | null;
      customerUserErrors: ShopifyUserError[];
    };
  }>(mutation, { customerAccessToken, id });

  if (data.customerAddressDelete.customerUserErrors.length > 0) {
    throw new Error(formatUserErrors(data.customerAddressDelete.customerUserErrors));
  }

  return data.customerAddressDelete.deletedCustomerAddressId;
}

export async function setDefaultCustomerAddress(
  customerAccessToken: string,
  addressId: string
) {
  const mutation = `
    mutation DefaultAddress($customerAccessToken: String!, $addressId: ID!) {
      customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
        customer {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customerDefaultAddressUpdate: {
      customer: { id: string } | null;
      customerUserErrors: ShopifyUserError[];
    };
  }>(mutation, { customerAccessToken, addressId });

  if (data.customerDefaultAddressUpdate.customerUserErrors.length > 0) {
    throw new Error(
      formatUserErrors(data.customerDefaultAddressUpdate.customerUserErrors)
    );
  }

  return true;
}

export type MoneyAmount = {
  amount: string;
  currencyCode: string;
};

export type CustomerOrderLineItem = {
  title: string;
  quantity: number;
  imageUrl: string | null;
  imageAlt: string | null;
  productHandle: string | null;
  totalPrice: MoneyAmount | null;
};

export type CustomerOrder = {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: MoneyAmount;
  statusUrl: string | null;
  lineItems: CustomerOrderLineItem[];
};

export type CustomerOrdersResult = {
  orders: CustomerOrder[];
  hasNextPage: boolean;
  endCursor: string | null;
};

function mapMoney(
  value: { amount?: string; currencyCode?: string } | null | undefined
): MoneyAmount | null {
  if (!value?.amount || !value.currencyCode) return null;
  return { amount: value.amount, currencyCode: value.currencyCode };
}

function mapOrderNode(node: {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  currentTotalPrice?: { amount?: string; currencyCode?: string };
  statusUrl?: string | null;
  lineItems?: {
    edges: {
      node: {
        title: string;
        quantity: number;
        discountedTotalPrice?: { amount?: string; currencyCode?: string };
        variant?: {
          image?: { url?: string; altText?: string | null } | null;
          product?: { handle?: string | null } | null;
        } | null;
      };
    }[];
  };
}): CustomerOrder | null {
  const totalPrice = mapMoney(node.currentTotalPrice);
  if (!node.id || !totalPrice) return null;

  const lineItems =
    node.lineItems?.edges
      ?.map((edge) => {
        const item = edge.node;
        return {
          title: item.title,
          quantity: item.quantity,
          imageUrl: item.variant?.image?.url ?? null,
          imageAlt: item.variant?.image?.altText ?? null,
          productHandle: item.variant?.product?.handle ?? null,
          totalPrice: mapMoney(item.discountedTotalPrice),
        };
      })
      .filter((item) => Boolean(item.title)) ?? [];

  return {
    id: node.id,
    name: node.name,
    orderNumber: node.orderNumber,
    processedAt: node.processedAt,
    financialStatus: node.financialStatus,
    fulfillmentStatus: node.fulfillmentStatus,
    totalPrice,
    statusUrl: node.statusUrl ?? null,
    lineItems,
  };
}

export async function getCustomerOrders(
  customerAccessToken: string,
  options?: { first?: number; after?: string | null }
): Promise<CustomerOrdersResult | null> {
  const first = Math.min(Math.max(options?.first ?? 10, 1), 25);

  const query = `
    query CustomerOrders($customerAccessToken: String!, $first: Int!, $after: String) {
      customer(customerAccessToken: $customerAccessToken) {
        orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            cursor
            node {
              id
              name
              orderNumber
              processedAt
              financialStatus
              fulfillmentStatus
              currentTotalPrice {
                amount
                currencyCode
              }
              statusUrl
              lineItems(first: 20) {
                edges {
                  node {
                    title
                    quantity
                    discountedTotalPrice {
                      amount
                      currencyCode
                    }
                    variant {
                      image {
                        url
                        altText
                      }
                      product {
                        handle
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const data = await shopifyStorefrontFetch<{
    customer: {
      orders: {
        edges: { node: Parameters<typeof mapOrderNode>[0] }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } | null;
  }>(query, {
    customerAccessToken,
    first,
    after: options?.after ?? null,
  });

  if (!data.customer) return null;

  const orders =
    data.customer.orders.edges
      ?.map((edge) => mapOrderNode(edge.node))
      .filter((order): order is CustomerOrder => Boolean(order)) ?? [];

  return {
    orders,
    hasNextPage: Boolean(data.customer.orders.pageInfo.hasNextPage),
    endCursor: data.customer.orders.pageInfo.endCursor,
  };
}
