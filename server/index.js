require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const mysql = require('mysql');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();

/*
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/products.json';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/customers.json';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/customers/207119551/orders.json';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/customers/7778170732836/orders.json?status=any';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/orders.json?ids=5558159016228';
//const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/storefront_access_tokens.json';

const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const SHOPIFY_GRAPHQL_ENDPOINT = 'https://well-mill.myshopify.com/api/2023-01/graphql.json';
*/

const PRODUCTS_FILE_PATH = path.join(__dirname, '../products.json');
const CARTS_FILE_PATH = path.resolve(__dirname, 'carts.json');

/*
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
*/

// Call the function initially
//fetchShopifyData();

// Then set it to be called every minute
//const fetchInterval = setInterval(fetchShopifyData, 60 * 1000);
/*
// Handle clean exit
function exitHandler() {
//  clearInterval(fetchInterval);
//  console.log('Clearing Shopify data fetch interval.');
  process.exit();
}

process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
*/

app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

connection.connect(error => {
  if (error) {
    console.log(error);
    throw error;
  }
  console.log("Successfully connected to the database.");
});


async function fetchProducts() {
  return new Promise((resolve, reject) => {
    console.log("Hit fetchProducts");
    const query = `
      SELECT p.*, i.imageKey, i.url, i.displayOrder, i.altText 
      FROM product p
      LEFT JOIN image i ON p.productKey = i.productKey
    `;
    console.log("Query: " + query);

    connection.query(query, async (error, results) => {
      if (error) {
        console.log("Query Error: " + error);
        return reject(error);
      }

      if (!results) {
        console.log("Products not found");
        return reject("Products not found");
      }

      // Create an object to hold products and their images
      const products = {};

      results.forEach(row => {
        // If the product is not already in the products object, add it
        if (!products[row.productKey]) {
          products[row.productKey] = {
            productKey: row.productKey,
            title: row.title,
            description: row.description,
            available: row.available,
            stock: row.stock,
            price: row.price,
            taxRate: row.taxRate,
            type: row.type,
            images: []
          };
        }

        // Add the image to the product's images array, if image data exists
        if (row.imageKey) {
          products[row.productKey].images.push({
            imageKey: row.imageKey,
            url: row.url,
            displayOrder: row.displayOrder,
            altText: row.altText
          });
        }
      });

      // Write the products to a file
      fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(Object.values(products), null, 2));
      console.log(`[${new Date().toISOString()}] Updated modern products.json`);

      resolve(true);
    });
  });
}

fetchProducts();


const hashPassword = async (password) => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
};

app.post('/createUser', async (req, res) => {
  try {
    const userData = req.body.data;
    let firstName = userData.firstName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let lastName = userData.lastName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let firstNameKana = userData.firstNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let lastNameKana = userData.lastNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let email = userData.email?.replace(/[^\w.@-]/g, '');
    let password = userData.password?.replace(/[^\x20-\x7E]/g, '');

    const hashedPassword = await hashPassword(password);
    const token = crypto.randomBytes(48).toString('hex');

    const query = `INSERT INTO customer (firstName, lastName, firstNameKana, lastNameKana, email, passwordHash, token) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [firstName, lastName, firstNameKana, lastNameKana, email, hashedPassword, token];

    connection.query(query, values, (error, results, fields) => {
      if (error) throw error;
      console.log(`Created user with token: ${token}`);
      res.json({ token: token });
    });
  } catch (error) {
    res.status(500).send('Error creating user: ' + error);
  }
});

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

app.post('/loginShopify', async (req, res) => {
  console.log(`Received ${req.method} request on ${req.url}`);
  //console.log('Body:', req.body);

  let customerAccessToken;

  if(req.body.email && req.body.password) {
    customerAccessToken = await GetCustomerDataFromCredentials(req.body.email, req.body.password);
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

app.post('/login', async (req, res) => {
  console.log("Hit login");
  console.log("req.body");
  console.log(req.body);
  const userCredentials = req.body.data;
  const email = userCredentials.email;
  const password = userCredentials.password;
  const token = userCredentials.token;

  let customerData;

  if(email && password) {
    console.log("Email/password login");
    customerData = await GetCustomerDataFromCredentials(email, password);
  } else if(token) {
    console.log("token login");
    customerData = await GetCustomerDataFromToken(token);
  } else {
    res.status(401).send("No customer credentials given");
  }

  console.log("Customer data:")
  console.log(customerData)

  //const cartId = await getCartIdFromCustomerId(customerData.id, customerData)
  //console.log("Cart ID:")
  //console.log(cartId)

  //const cartData = await GetCartDataFromCartId(cartId)
  //console.log("Cart Data:")
  //console.log(cartData)

  //customerData.customerAccessToken = customerData;
  //customerData.cart = cartData;
  res.json({customerData: customerData});
});

app.post('/addToCart', async (req, res) => {
  console.log("Hit addToCart");
  //console.log("req.body");
  //console.log(req.body);
  const cartData = req.body.data;
  //console.log("cartData");
  //console.log(cartData);
  const { productKey, customerKey, quantity } = cartData;

  // Sanitize input
  if (!Number.isInteger(productKey) || productKey.toString().length > 10 ||
      !Number.isInteger(customerKey) || customerKey.toString().length > 10 ||
      !Number.isInteger(quantity) || quantity.toString().length > 10) {
      return res.status(400).send('Invalid input');
  }

  try {
    // Insert data into the database
    const insertQuery = `INSERT INTO lineItem (productKey, customerKey, quantity) VALUES (?, ?, ?)`;
    await new Promise((resolve, reject) => {
        connection.query(insertQuery, [productKey, customerKey, quantity], (error, results) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    // Fetch the updated cart
    const selectQuery = `
        SELECT * FROM lineItem
        WHERE customerKey = ? AND purchaseKey IS NULL`;
    const updatedCart = await new Promise((resolve, reject) => {
        connection.query(selectQuery, [customerKey], (error, results) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    // Return the updated cart
    res.json(updatedCart);
  } catch (error) {
      console.error('Error in addToCart:', error);
      res.status(500).send('An error occurred');
  }
});

async function GetCustomerTokenFromCredentialsShopify(email, password) {
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

async function GetCustomerDataFromCredentials(email, password) {
  return new Promise((resolve, reject) => {
    // Prepare the SQL query to find the user by email
    const query = `SELECT * FROM customer WHERE email = ?`;

    // Execute the query
    connection.query(query, [email], async (error, results) => {
    
      // MySQL query error
      if (error) { return reject(error); }

      // If no results, the email is not registered
      if (results.length === 0) { return resolve(null); }

      const customer = results[0];
      console.log("In GetCustomerDataFromCredentials with following customer:");
      console.log(customer);

      // Compare the provided password with the stored hash
      const match = await bcrypt.compare(password, customer.passwordHash);

      // Passwords do not match
      if (!match) { return resolve(null); }

      // Passwords match, now fetch the customer's cart
      console.log("Found user, correct password");
      console.log(customer);

      // Pull customer's cart
      const cartData = GetCartDataFromCustomerKey(customer.customerKey);
      customer.cart = cartData;

      // Remove sensitive data before sending the customer object
      delete customer.passwordHash;
      resolve(customer);
    });
  });
}

async function GetCustomerDataFromToken(token) {
  return new Promise((resolve, reject) => {
    // Prepare the SQL query to find the user by email
    const query = `SELECT * FROM customer WHERE token = ?`;

    // Execute the query
    connection.query(query, [token], async (error, results) => {

      // Database error
      if (error) { return reject(error); }

      // If no results, the token does not exist
      if (results.length === 0) { return resolve(null); }

      // If a token exists, user is authenticated
      const customer = results[0];

      // Pull customer's cart
      const cartData = GetCartDataFromCustomerKey(customer.customerKey);
      if(cartData.error) { return reject("Cart query error: " + cartData.error); }
      customer.cart = cartData;

      delete customer.password_hash;
      resolve(customer);
    });
  });
}

async function GetCartDataFromCustomerKey(customerKey) {
  const cartQuery = `
    SELECT li.lineItemKey, li.productKey, li.quantity, li.addedAt
    FROM lineItem li
    WHERE li.customerKey = ? AND li.purchaseKey IS NULL
  `;

  connection.query(cartQuery, [customerKey], (cartError, cartResults) => {
    if (cartError) { return {error: cartError}; }
    if (cartResults.length === 0) { return([]); }

    // Create cart data full of line items
    const cartData = cartResults.map(item => ({
      lineItemKey: item.lineItemKey,
      productKey: item.productKey,
      quantity: item.quantity,
      addedAt: item.addedAt,
    }));
    return cartData;
  });
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const current = new Date();
  const timestamp = `${current.getFullYear()}/${String(current.getMonth() + 1).padStart(2, '0')}/${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}:${String(current.getSeconds()).padStart(2, '0')}`;
  console.log(`Server started on ${PORT} 3001 at ${timestamp}`);
});
