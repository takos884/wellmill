require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();

const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/products.json';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/customers.json';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/customers/207119551/orders.json';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/customers/7778170732836/orders.json?status=any';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/orders.json?ids=5558159016228';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/storefront_access_tokens.json';

const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const SHOPIFY_GRAPHQL_ENDPOINT = 'https://well-mill.myshopify.com/api/2023-01/graphql.json';
const PRODUCTS_FILE_PATH = path.join(__dirname, '../products.json');
const CARTS_FILE_PATH = path.resolve(__dirname, 'carts.json');

async function fetchShopifyData() {
  try {
    const response = await fetch(SHOPIFY_API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(data));
    console.log(`[${new Date().toISOString()}] Updated products.json`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error fetching Shopify data:`, err);
  }
}

// Call the function initially
fetchShopifyData();

// Then set it to be called every minute
const fetchInterval = setInterval(fetchShopifyData, 60 * 1000);

// Handle clean exit
function exitHandler() {
  clearInterval(fetchInterval);
  console.log('Clearing Shopify data fetch interval.');
  process.exit();
}

process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);




app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.json());

app.post('/sendEmail', async (req, res) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'cdehaan@gmail.com',
            pass: process.env.EMAIL_PASSWORD
        }
    });

    let mailOptions = {
        from: 'cdehaan@gmail.com', 
        to: 'cdehaan@gmail.com', 
        subject: 'New Contact Form Submission',
        text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nPhone: ${req.body.phone}\nInquiry: ${req.body.inquiry}\nMessage: ${req.body.message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Email sent successfully');
    } catch (error) {
        const errorMessage = `[${new Date().toISOString()}] Error in /sendEmail: ${error.message}`;
        console.error(errorMessage);
        res.status(500).send(errorMessage);
    }
});

app.post('/login', async (req, res) => {
  console.log(`Received ${req.method} request on ${req.url}`);
  //console.log('Body:', req.body);

  let customerAccessToken;

  if(req.body.email && req.body.password) {
    customerAccessToken = await GetCustomerTokenFromCredentials(req.body.email, req.body.password);
  } else if (req.body.customerAccessToken) {
    customerAccessToken = req.body.customerAccessToken;
  } else {
    res.status(401).send("No customerAccessToken given");
  }

  console.log("Customer token:")
  console.log(customerAccessToken)

  const customerData = await GetCustomerDataFromToken(customerAccessToken)
  console.log("Customer data:")
  console.log(customerData)

  const cartId = await getCartIdFromCustomerId(customerData.id, customerAccessToken)
  console.log("Cart ID:")
  console.log(cartId)

  const cartData = await GetCartDataFromCartId(cartId)
  console.log("Cart Data:")
  console.log(cartData)

  customerData.customerAccessToken = customerAccessToken;
  customerData.cart = cartData;
  res.send(customerData);
});

async function GetCustomerTokenFromCredentials(email, password) {
  const query = `
  mutation customerAccessTokenCreate {
    customerAccessTokenCreate(input: {email: "${email}", password: "${password}"}) {
      customerAccessToken {
        accessToken
      }
      customerUserErrors {
        message
      }
    }
  }
  `

  try {
    const requestBody = JSON.stringify({ query: query });
    //console.log("Endpoint: " + SHOPIFY_GRAPHQL_ENDPOINT)
    //console.log("Token: " + SHOPIFY_STOREFRONT_ACCESS_TOKEN)

    const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN
      },
      body: requestBody
    });

    //console.log(`response:`)
    //console.log(response)
    //console.log(`response.statusText: ${response.statusText}`); // 'ok'
    //console.log(`response.status: ${response.status}`);     // 200

    const responseData = await response.json();
    if(!responseData) {
      res.status(401).send("No response from server");
    }
    if (responseData.data.customerAccessTokenCreate.customerAccessToken.accessToken) {
      return responseData.data.customerAccessTokenCreate.customerAccessToken.accessToken;
    } else {
      res.status(401).send(responseData.data.customerAccessTokenCreate.userErrors);
    }
  } catch (error) {
    console.error(`Error during login: ${error.message}`, error);
    res.status(500).send(error);
  }
}

async function GetCustomerDataFromToken(token) {
  const query = `
  query {
    customer(customerAccessToken: "${token}") {
      id
      firstName
      lastName
      acceptsMarketing
      email
      phone
    }
  }
  `

  try {
    const requestBody = JSON.stringify({ query: query });

    const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN
      },
      body: requestBody
    });

    //console.log(`response:`)
    //console.log(response)

    const responseData = await response.json();
    //console.log(`responseData:`)
    //console.log(responseData)
    return responseData.data.customer;

    //if (responseData.data.customerAccessTokenCreate.customerAccessToken) {
    //  console.log("Hopefully the customer token:")
    //  console.log(responseData.data.customerAccessTokenCreate.customerAccessToken.accessToken)
    //  res.send(responseData.data.customerAccessTokenCreate.customerAccessToken);
    //} else {
    //  res.status(401).send(responseData.data.customerAccessTokenCreate.userErrors);
    //}
  } catch (error) {
    console.error(`Error during login: ${error.message}`, error);
    res.status(500).send(error);
  }
}

async function getCartIdFromCustomerId(customerId, customerAccessToken) {
  const cartsData = readCartsFile();
  const cartEntry = cartsData.find(entry => entry.customerId === customerId);

  if (cartEntry && cartEntry.cartId) {
    console.log('Cart ID for customer:', cartEntry.cartId);
    return cartEntry.cartId;
  } else {
    // Cart does not exist, create a new one and store it
    const newCartId = await createCart(customerAccessToken);
    cartsData.push({ customerId, cartId: newCartId });
    writeCartsFile(cartsData);
    return newCartId;
  }
}

function readCartsFile() {
  if (!fs.existsSync(CARTS_FILE_PATH)) {
    fs.writeFileSync(CARTS_FILE_PATH, JSON.stringify([]), 'utf8');
  }
  return JSON.parse(fs.readFileSync(CARTS_FILE_PATH, 'utf8'));
}

function writeCartsFile(cartsData) {
  fs.writeFileSync(CARTS_FILE_PATH, JSON.stringify(cartsData), 'utf8');
}

async function createCart(customerAccessToken) {
  const mutation = `mutation cartCreate($buyerIdentity: CartBuyerIdentityInput) {
    cartCreate(input: {buyerIdentity: $buyerIdentity}) {
      cart {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const variables = {
    buyerIdentity: {
      countryCode: 'JP',
      customerAccessToken: customerAccessToken
    }
  };

  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN
    },
    body: JSON.stringify({ query: mutation, variables: variables })
  });

  const responseData = await response.json();
  if (responseData.errors) {
    console.error('Error creating cart:', responseData.errors);
    return null;
    //throw new Error('Error creating cart');
  }

  const cartId = responseData.data.cartCreate.cart.id;
  console.log('Created new cart with ID:', cartId);
  return cartId;
}

async function GetCartDataFromCartId(cartId) {
  const query = `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      lines(first: 250) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                priceV2 {
                  amount
                  currencyCode
                }
              }
            }
            cost {
              subtotalAmount {
                amount
                currencyCode
              }
              totalAmount {
                amount
                currencyCode
              }
            }
          }
        }
      }
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalTaxAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
      }
    }
  }
  `;

  const variables = {
    cartId: cartId
  };

  try {
    const requestBody = JSON.stringify({
      query: query,
      variables: variables
    });

    console.log("requestBody:")
    console.log(requestBody)

    const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN
      },
      body: requestBody
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("responseData:");
    console.log(responseData);

    if (responseData.errors) {
      console.error('GraphQL errors:', responseData.errors);
      throw new Error('GraphQL errors occurred');
    }

    return responseData.data.cart;
  } catch (error) {
    console.error(`Error fetching cart data: ${error.message}`, error);
    throw error;
  }
}

app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    res.status(500).send('Something broke!');
});

app.listen(3001, () => {
  const current = new Date();
  const timestamp = `${current.getFullYear()}/${String(current.getMonth() + 1).padStart(2, '0')}/${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}:${String(current.getSeconds()).padStart(2, '0')}`;
  console.log(`Server started on port 3001 at ${timestamp}`);
});
