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
  return `https://${requireEnv('SHOPIFY_STORE_DOMAIN')}/api/${storefrontApiVersion}/graphql.json`;
}

function adminUrl() {
  return `https://${requireEnv('SHOPIFY_STORE_DOMAIN')}/admin/api/${adminApiVersion}/graphql.json`;
}

async function shopifyStorefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(storefrontUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': requireEnv('SHOPIFY_STOREFRONT_ACCESS_TOKEN'),
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
      'X-Shopify-Access-Token': requireEnv('SHOPIFY_ADMIN_ACCESS_TOKEN'),
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
    `https://${requireEnv('SHOPIFY_STORE_DOMAIN')}/admin/api/${adminApiVersion}/customers/${numericId}.json`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': requireEnv('SHOPIFY_ADMIN_ACCESS_TOKEN'),
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
