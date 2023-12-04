require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_TEST_SECRET_API_KEY);


const app = express();
app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});



const PRODUCTS_FILE_PATH = path.join(__dirname, '../products.json');
const CARTS_FILE_PATH = path.resolve(__dirname, 'carts.json');

// used for both creating a file, and calculating cart totals
let products = {};

// used as a pair to run MySQL queries
let query, values;



async function fetchProducts() {
  console.log("░▒▓█ Hit fetchProducts. Time: " + CurrentTime());

  query = `
    SELECT p.*, i.imageKey, i.url, i.displayOrder, i.altText 
    FROM product p
    LEFT JOIN image i ON p.productKey = i.productKey
  `;
  //console.log("Query: " + query);

  try{
    const [results] = (await pool.query(query));

    if (!results) {
      console.log("Products not found");
      return Promise.reject("Products not found");
    }

    // holds products and their images
    products = {};


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
    console.log(`[${CurrentTime()}] Updated modern products.json`);

    return Promise.resolve(true);
  } catch(error) {
    console.error(`[${CurrentTime()}] Error fetching products:`, error);
    return Promise.reject(error);
  }
}

fetchProducts();


app.post('/createUser', async (req, res) => {
    console.log("░▒▓█ Hit createUser. Time: " + CurrentTime());
    console.log(req.body);

    const userData = req.body.data;
    let firstName = userData.firstName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let lastName = userData.lastName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let firstNameKana = userData.firstNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let lastNameKana = userData.lastNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let email = userData.email?.replace(/[^\w.@-]/g, '');
    let password = userData.password?.replace(/[^\x20-\x7E]/g, '');

    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds
  
    const token = crypto.randomBytes(48).toString('hex');

    query = `
      INSERT INTO customer (firstName, lastName, firstNameKana, lastNameKana, email, passwordHash, token)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    values = [firstName, lastName, firstNameKana, lastNameKana, email, hashedPassword, token];

  try {
    const [results] = await pool.query(query, values);
    console.log("Results after adding new customer:");
    console.log(results);

    const code = "NV" + results.insertId;

    console.log(`Created user with token: ${token} and code: ${code}`);
    res.json({ token: token, code: code });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Error creating user: ' + error);
  }
});

app.post('/addAddress', async (req, res) => {
  console.log("░▒▓█ Hit addAddress. Time: " + CurrentTime());
  console.log(req.body);
  const addressData = req.body.data;

  // addressKey can be passed in, when requesting an edit, or given by MySQL for a new address
  let addressKey;
  addressKey = Number(addressData.addressKey) || null;
  const newAddress = (addressKey === null)

  function SanitizeInput(input) { return (input) ? input.replace(/[^\p{L}\p{N}\p{Z}\-#&()]/gu, '') : ""; }
  const firstName =   SanitizeInput(addressData.firstName);
  const lastName =    SanitizeInput(addressData.lastName);
  const postalCode =  SanitizeInput(addressData.postalCode);
  const prefCode =    SanitizeInput(addressData.prefCode);
  const pref =        SanitizeInput(addressData.pref);
  const city =        SanitizeInput(addressData.city);
  const ward =        SanitizeInput(addressData.ward);
  const address2 =    SanitizeInput(addressData.address2);
  const phoneNumber = SanitizeInput(addressData.phoneNumber);
  const customerKey = Number(addressData.customerKey);

  // This can be changed later if needed
  let defaultAddress = (addressData.defaultAddress ? "1" : "0");

  if (!Number.isInteger(customerKey) || customerKey <= 0 || customerKey >= 2147483647) {
    res.status(400).send('Malformed customerKey: ' + customerKey);
  }


  // Count the number of default addresses. If it's zero, force this new one to be default
  // If it's an update, don't include the one being updates in this count
  // When addressKey is not null, it will exclude the address with that key.
  // When addressKey is null, the ? IS NULL condition becomes true, so the addressKey <> ? part is effectively ignored.
  query = "SELECT COUNT(*) FROM address WHERE defaultAddress = 1 AND customerKey = ? AND (? IS NULL OR addressKey <> ?)";
  try {
    const [defaultsCount] = await pool.query(query, [customerKey, addressKey, addressKey]);
    if(defaultsCount[0]['COUNT(*)'] === 0) { defaultAddress = true; }
  } catch(error) {
    console.error('Error counting address defaults:', error);
    res.status(500).send('Error counting address defaults: ' + error);  
  }


  // If this address wants to be the default, all others must not be default
  if(defaultAddress) {
    query = "UPDATE address SET defaultAddress = 0 WHERE customerKey = ?;"
    try {
      await pool.query(query, [customerKey]);
    } catch(error) {
      console.error('Error updating old address defaults:', error);
      res.status(500).send('Error updating old address defaults: ' + error);  
    }
  }

  values = [customerKey, firstName, lastName, postalCode, prefCode, pref, city, ward, address2, phoneNumber, defaultAddress];

  // Make a query to add a new address
  if(newAddress) {
    query = `
      INSERT INTO address (customerKey, firstName, lastName, postalCode, prefCode, pref, city, ward, address2, phoneNumber, defaultAddress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  }

  // Make a query to edit an existing address
  else {
    query = `
    UPDATE address SET customerKey = ?, firstName = ?, lastName = ?, postalCode = ?, prefCode = ?, pref = ?, city = ?, ward = ?, address2 = ?, phoneNumber = ?, defaultAddress = ?
    WHERE addressKey = ?`;
    values.push(addressKey);
  }

  // Make the change in the database
  try {
    await pool.query(query, values);
    //const addressKey = results[0].insertId;
    //console.log('Generated Address Key:', addressKey);
  } catch (error) {
    console.error(`Error ${newAddress ? "adding" : "updating"} address: ${error}`);
    res.status(500).send(`Error ${newAddress ? "adding" : "updating"} address: ${error}`);
  }

  const freshAddresses = await PullFreshAddresses(customerKey)
  res.json({ addresses: freshAddresses });
});

app.post('/deleteAddress', async (req, res) => {
  console.log("░▒▓█ Hit deleteAddress. Time: " + CurrentTime());
  console.log(req.body);
  const addressData = req.body.data;

  const addressKey = Number(addressData.addressKey);
  if(!addressKey) {
    const errorMessage = `Malformed addressKey in deleteAddress: ${addressKey}`;
    console.error(errorMessage);
    res.status(400).send(errorMessage);
  }

  const customerKey = Number(addressData.customerKey);
  if(!customerKey) {
    const errorMessage = `Malformed customerKey in deleteAddress: ${customerKey}`;
    console.error(errorMessage);
    res.status(400).send(errorMessage);
  }

  query = `DELETE FROM address WHERE addressKey = ? AND customerKey = ?`;
  try {
    await pool.query(query, [addressKey, customerKey]);
  } catch(error) {
    const errorMessage = `Error deleting address, addressKey: ${addressKey}, customerKey: ${customerKey}`;
    console.error(errorMessage);
    res.status(500).send(errorMessage);
  }

  let forceNewDefault = false;
  query = "SELECT COUNT(*) FROM address WHERE defaultAddress = 1 AND customerKey = ?";
  try {
    const [defaultsCount] = await pool.query(query, [customerKey]);
    if(defaultsCount[0]['COUNT(*)'] === 0) { forceNewDefault = true; }
  } catch(error) {
    console.error('Error counting address defaults after delete:', error);
    res.status(500).send('Error counting address defaults after delete: ' + error);  
  }

  if(forceNewDefault) {
    query = `UPDATE address SET defaultAddress = ? WHERE customerKey = ? LIMIT 1`;
    await pool.query(query, [true, customerKey]);
  }

  const freshAddresses = await PullFreshAddresses(customerKey)
  res.json({ addresses: freshAddresses });
});

async function PullFreshAddresses(customerKey) {
  // Pull fresh copy of all addresses to send back
  query = "SELECT * FROM address WHERE customerKey = ?";
  try {
    const [addresses] = await pool.query(query, [customerKey]);

    // MySQL uses 1 and 0 for true and false, but I want real bools
    addresses.forEach(address => {address.defaultAddress = (address.defaultAddress === 1) ? true : false});
    return addresses;
  } catch (error) {
    console.error(`Error pulling fresh addresses after updating address: ${error}`);
    res.status(500).send(`Error pulling fresh addresses after updating address: ${error}`);
  }  
}

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
  console.log("░▒▓█ Hit login. Time:" + CurrentTime());
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

  //console.log("Customer data:")
  //console.log(customerData)

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
  console.log("░▒▓█ Hit addToCart. Time: " + CurrentTime());
  console.log(req.body); // { data: { productKey: 1, customerKey: 1, quantity: 1 } }
  const cartData = req.body.data;
  const { productKey, customerKey, unitPrice, taxRate, quantity } = cartData;

  // Sanitize input
  if (!Number.isInteger(productKey)  || productKey.toString().length > 50  ||
      !Number.isInteger(customerKey) || customerKey.toString().length > 50 ||
       Number.isNaN(unitPrice)       || unitPrice > 100000000              || unitPrice < 0 ||
       Number.isNaN(taxRate)         || taxRate > 10                       || taxRate < 0 ||
      !Number.isInteger(quantity)    || quantity > 100) {
      return res.status(400).send('Invalid input');
  }

  const roundedUnitPrice = Math.round(unitPrice * 100) / 100;
  const roundedTaxRate   = Math.round(taxRate * 1000) / 1000;


  try {
    // Check if the item already exists in the cart
    // If it has a purchase record, other than "created", it should not be counted
    const checkQuery = `
      SELECT lineItem.quantity
      FROM lineItem
      LEFT JOIN purchase ON lineItem.purchaseKey = purchase.purchaseKey
      WHERE lineItem.productKey = ?
      AND lineItem.customerKey = ?
      AND lineItem.unitPrice = ?
      AND lineItem.taxRate = ?
      AND (lineItem.purchaseKey IS NULL OR purchase.status = 'created');`;
    const [existingItem] = (await pool.query(checkQuery, [productKey, customerKey, roundedUnitPrice, roundedTaxRate]));
  
    if (existingItem.length > 0) {
      // Item exists, update the quantity
      const newQuantity = existingItem[0].quantity + quantity;
      const updateQuery = "UPDATE lineItem SET quantity = ? WHERE productKey = ? AND customerKey = ? AND unitPrice = ? AND taxRate = ?";
      await pool.query(updateQuery, [newQuantity, productKey, customerKey, roundedUnitPrice, roundedTaxRate]);
    } else {
      // Insert data into the database
      const insertQuery = "INSERT INTO lineItem (productKey, customerKey, unitPrice, taxRate, quantity) VALUES (?, ?, ?, ?, ?)";
      await pool.query(insertQuery, [productKey, customerKey, roundedUnitPrice, roundedTaxRate, quantity]);
    }
  
    // Get updated cart data
    const updatedCart = await GetCartDataFromCustomerKey(customerKey);
    res.json(updatedCart);
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).send('An error occurred');
  }
});

app.post('/updateCartQuantity', async (req, res) => {
  console.log("░▒▓█ Hit updateCartQuantity. Time: " + CurrentTime());
  console.log(req.body); //
  const updateData = req.body.data;
  const { customerKey, token, lineItemKey, quantity } = updateData;

  // Sanitize input
  if (!Number.isInteger(customerKey) || customerKey.toString().length > 50 ||
      !/^[a-zA-Z0-9]+$/.test(token)  || token.length > 200 ||
      !Number.isInteger(lineItemKey) || lineItemKey.toString().length > 50 ||
      !Number.isInteger(quantity)    || quantity.toString().length > 50) {
      return res.status(400).send('Invalid input');
  }

  const tokenVerification = await verifyToken(customerKey, token);
  if(tokenVerification.valid === false) { return res.status(400).send('Invalid input: ' + tokenVerification.error); }

  try {
    // Update line quantity in the database
    const updateQuery = "UPDATE lineItem SET quantity = ? WHERE customerKey = ? AND lineItemKey = ?";
    await pool.query(updateQuery, [quantity, customerKey, lineItemKey]);
  
    // Get updated cart data
    const updatedCart = await GetCartDataFromCustomerKey(customerKey);
    res.json(updatedCart);
  } catch (error) {
    console.error('Error in updateCartQuantity:', error);
    res.status(500).send('An error occurred');
  }
});

app.post('/deleteFromCart', async (req, res) => {
  console.log("░▒▓█ Hit deleteFromCart. Time: " + CurrentTime());
  console.log(req.body); // { data: { customerKey: 1, token: "abc", lineItemKey: 1 } }
  const lineItemData = req.body.data;
  const { customerKey, token, lineItemKey } = lineItemData;

  // Sanitize input
  if (!Number.isInteger(customerKey) || customerKey.toString().length > 50 ||
      !/^[a-zA-Z0-9]+$/.test(token)  || token.length > 200 ||
      !Number.isInteger(lineItemKey) || lineItemKey.toString().length > 50) {
      return res.status(400).send('Invalid input');
  }

  const tokenVerification = await verifyToken(customerKey, token);
  if(tokenVerification.valid === false) { return res.status(400).send('Invalid input: ' + tokenVerification.error); }

  try {
    // Delete line from the database
    const deleteQuery = "DELETE FROM lineItem WHERE customerKey = ? AND lineItemKey = ?";
    await pool.query(deleteQuery, [customerKey, lineItemKey]);
  
    // Get updated cart data
    const updatedCart = await GetCartDataFromCustomerKey(customerKey);
    res.json(updatedCart);
  } catch (error) {
    console.error('Error in deleteFromCart:', error);
    res.status(500).send('An error occurred');
  }

});


//#region Azure backup
const BASE_URL = 'https://wellmill-test-api-mgmnt.azure-api.net/api/';


// Works a charm
/*
app.post('/storeBackupData', async (req, res) => {
  console.log("░▒▓█ Hit storeBackupData. Time: " + CurrentTime());
  console.log(req.body);

  // Extract data from the request body
  const { endpoint, inputData } = req.body;

  try {
    const fullEndpoint = `${BASE_URL}${endpoint}`;
    const fullFetchContent = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.AZURE_TEST_API_KEY,
      },
      body: JSON.stringify(inputData),
    };

    console.log("fullEndpoint");
    console.log(fullEndpoint);
    console.log("fullFetchContent");
    console.log(fullFetchContent);

    // Make the POST request to the backup server
    const response = await fetch(fullEndpoint, fullFetchContent);
    const responseData = await response.json();

    console.log("Json response:");
    console.log(responseData);

    if (!response.ok) {
      // Forward any non-2xx responses as is
      return res.status(response.status).json({ message: `API request failed with status ${response.status}` });
    }

    // Send the response from the backup server to the client
    res.json(responseData);

  } catch (error) {
    // Handle any other errors
    res.status(500).json({ message: error.message || 'An unexpected error occurred.' });
  }
});
*/

app.post('/storeBackupData', async (req, res) => {
  const { endpoint, inputData } = req.body;

  const result = await StoreBackupData(endpoint, inputData);

  if (result.error) {
    return res.status(result.status).json({ message: result.message });
  }

  res.json(result);
});

async function StoreBackupData(endpoint, inputData) {
  try {
    const fullEndpoint = `${BASE_URL}${endpoint}`;
    const fullFetchContent = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.AZURE_TEST_API_KEY,
      },
      body: JSON.stringify(inputData),
    };

    // Make the POST request to the backup server
    const response = await fetch(fullEndpoint, fullFetchContent);
    const responseData = await response.json();

    if (!response.ok) {
      return { error: true, status: response.status, message: 'An unexpected error occurred in StoreBackupData.' };
    }

    return responseData;
  } catch (error) {
    return { error: true, status: 500, message: error.message || 'An unexpected error occurred in StoreBackupData.' };
  }
}
//#endregion Azure backup


async function verifyToken(customerKey, token) {
  try {
    query = 'SELECT * FROM customer WHERE customerKey = ? AND token = ?';
    const [results] = await pool.query(query, [customerKey, token]);

    if (results.length > 0) {
      return { valid: true, error: null };
    } else {
      return { valid: false, error: 'Invalid token or customer key' };
    }
  } catch (error) {
    return { valid: false, error: `Verify Token error: ${error.message}` };
  }
}

async function GetCustomerDataFromCredentials(email, password) {
  try {
    // Prepare the SQL query to find the user by email
    query = `SELECT * FROM customer WHERE email = ?`;

    // Execute the query using the promisified pool.query and wait for the promise to resolve
    const [results] = await pool.query(query, [email]);

    // If no results, the email is not registered
    if (results.length === 0) {
      return null;
    }

    const [customer] = results;
    //console.log("In GetCustomerDataFromCredentials with the following customer:");
    //console.log(customer);
    //console.log("Password:");
    //console.log(password);
    //console.log("Hash:");
    //console.log(customer.passwordHash);

    // Compare the provided password with the stored hash
    const match = await bcrypt.compare(password, customer.passwordHash);

    // Passwords do not match
    if (!match) {
      // TODO think about some login attempt limit
      return null;
    }

    // Passwords match, now fetch the customer's cart
    //console.log("Correct password");

    // Pull customer's cart
    const cartData = await GetCartDataFromCustomerKey(customer.customerKey);
    customer.cart = { lines: cartData };

    // Pull customer's purchases
    const purchases = await GetPurchasesFromCustomerKey(customer.customerKey);
    customer.purchases = purchases;

    // Pull customer's addresses
    const addresses = await GetAddressesFromCustomerKey(customer.customerKey);
    customer.addresses = addresses;

    // Remove sensitive data before sending the customer object
    delete customer.passwordHash;

    return customer;
  } catch (error) {
    console.error('Error in GetCustomerDataFromCredentials:', error);
    throw error;
  }
}

async function GetCustomerDataFromToken(token) {
  try {
    // Prepare the SQL query to find the user by token
    query = `SELECT * FROM customer WHERE token = ?`;

    // Execute the query using the promisified pool.query and wait for the promise to resolve
    const [results] = await pool.query(query, [token]);

    // If no results, the token does not exist
    if (results.length === 0) {
      // TODO think about some login attempt limit
      return null;
    }

    // If a token exists, the user is authenticated
    const customer = results[0];

    // Pull customer's cart
    const cartData = await GetCartDataFromCustomerKey(customer.customerKey);
    customer.cart = { lines: cartData };

    // Pull customer's purchases
    const purchases = await GetPurchasesFromCustomerKey(customer.customerKey);
    customer.purchases = purchases;

    // Pull customer's addresses
    const addresses = await GetAddressesFromCustomerKey(customer.customerKey);
    customer.addresses = addresses;

    // Remove sensitive data before sending the customer object
    delete customer.password_hash;

    return customer;
  } catch (error) {
    console.error('Error in GetCustomerDataFromToken:', error);
    throw error;
  }
}

async function GetCartDataFromCustomerKey(customerKey) {
  // Prepare the SQL query to get a customer's line items that haven't been purchased
  const selectQuery = `
    SELECT lineItem.*, purchase.status
    FROM lineItem 
    LEFT JOIN purchase ON lineItem.purchaseKey = purchase.purchaseKey
    WHERE lineItem.customerKey = ?
    AND (lineItem.purchaseKey IS NULL OR purchase.status = 'created');`;

  // Execute the query using the promisified pool.query and wait for the promise to resolve
  try {
    const [currentCart] = (await pool.query(selectQuery, [customerKey]));
    return currentCart;
  } catch (error) {
    console.error('Error in GetCartDataFromCustomerKey: ', error);
    throw error;
  }
}

async function GetPurchasesFromCustomerKey(customerKey) {
  // Prepare the SQL query to get a customer's line items that haven't been purchased
  // Could be more selective
  const selectQuery = `
    SELECT lineItem.*, purchase.*
    FROM lineItem 
    JOIN purchase ON lineItem.purchaseKey = purchase.purchaseKey
    WHERE lineItem.customerKey = ?
    AND purchase.status != 'created';`;

  // Execute the query using the promisified pool.query and wait for the promise to resolve
  try {
    const [purchaseHistory] = await pool.query(selectQuery, [customerKey]);
    //console.log("ProcessPurchaseHistory(purchaseHistory)");
    //console.log(ProcessPurchaseHistory(purchaseHistory));
    return ProcessPurchaseHistory(purchaseHistory);
  } catch (error) {
    console.error('Error in GetPurchasesFromCustomerKey: ', error);
    throw error;
  }
}

async function GetAddressesFromCustomerKey(customerKey) {
  // Prepare the SQL query to get a customer's line items that haven't been purchased
  const selectQuery = `
    SELECT * FROM address
    WHERE customerKey = ?`;

  // Execute the query using the promisified pool.query and wait for the promise to resolve
  try {
    const [addresses] = (await pool.query(selectQuery, [customerKey]));
    return ProcessAddresses(addresses);
  } catch (error) {
    console.error('Error in GetAddressesFromCustomerKey: ', error);
    throw error;
  }
}

// All values in Addresses come from MySQL as strings, but I want the bool to be a real bool
function ProcessAddresses(addresses) {
  return updatedAddresses = addresses.map(address => {
    if(address === undefined) return null;
    address.defaultAddress = (address.defaultAddress?.toString() === "1");
    return address;
  });
}

// All values in Purchase History come from MySQL as strings, but I want the numbers to be real numbers
function ProcessPurchaseHistory(purchaseHistory) {
  return purchaseHistory.map(oneHistory => {
    oneHistory.unitPrice = Math.round(Number(oneHistory.unitPrice));
    oneHistory.taxRate = Math.round(Number(oneHistory.taxRate)*100)/100;
    return oneHistory;
  });
}


//#region Stripe
const calculateOrderAmount = (cartLines) => {
  return Math.round(cartLines.reduce((total, line) => {
    const lineCost = line.unitPrice * (1 + line.taxRate) * line.quantity;
    return total + lineCost;
  }, 0));
};

app.post("/createPaymentIntent", async (req, res) => {
  console.log("░▒▓█ Hit createPaymentIntent. Time: " + CurrentTime());
  console.log(req.body);

  const { user, cartLines } = req.body;
  const purchaseTotal = calculateOrderAmount(cartLines);

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: purchaseTotal,
    currency: "jpy",
  });

  console.log("Created paymentIntent:");
  console.log(paymentIntent);

  // Make the purchase intention, even though they are just on the checkout screen. Stripe suggests doing this
  query = `
    INSERT INTO purchase (customerKey, paymentIntentId, amount)
    VALUES (?, ?, ?)`;
  values = [user.customerKey, paymentIntent.id, paymentIntent.amount];

  let purchaseInsertId;
  try {
    const [results] = await pool.query(query, values);
    purchaseInsertId = results.insertId;
  } catch (error) {
    console.error('Error creating user: ', error);
    res.status(500).send('Error creating user: ' + error);
  }

  const cartLineKeys = cartLines.map(line => line.lineItemKey);
  // Match lineItem	in the cart to this intention
  query = `
    UPDATE lineItem
    SET purchaseKey = ?
    WHERE lineItemKey IN (?)`;
  values = [purchaseInsertId, cartLineKeys];

  try {
    const [results] = await pool.query(query, values);
    //console.log("Results after saving purchase in MySQL:");
    //console.log(results);
  } catch (error) {
    console.error('Error creating user: ', error);
    res.status(500).send('Error creating user: ' + error);
  }

  res.send({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });

});


app.post("/verifyPayment", async (req, res) => {
  console.log("░▒▓█ Hit verifyPayment. Time: " + CurrentTime());
  console.log(req.body);

  const { paymentIntentId, paymentIntentClientSecret } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const paymentStatus = paymentIntent.status;
  console.log("paymentIntent");
  console.log(paymentIntent);

  console.log("Bad debugging paymentStatus: " + paymentStatus);
  if (paymentStatus === 'succeeded' || paymentStatus === 'created') {
    query = `
      UPDATE purchase 
      SET status = ?, purchaseTime = CURRENT_TIMESTAMP
      WHERE paymentIntentId = ? AND status != ?`;
    values = [paymentStatus, paymentIntentId, paymentStatus];

    try {
      const [verifyPaymentResults] = await pool.query(query, values);
      console.log("verifyPayment results");
      console.log(verifyPaymentResults);

      //Send order details to Azure
      if(paymentStatus === 'succeeded' && verifyPaymentResults.affectedRows > 0) {
        console.log("Bad debugging 1");
        query = `
        SELECT * FROM customer 
        WHERE customerKey = (
            SELECT customerKey 
            FROM purchase 
            WHERE paymentIntentId = ?)`;
        values = [paymentIntentId];

        const [customerResults] = await pool.query(query, values);

        // If no results, the user isn't found
        if (customerResults.length === 0) {
          console.log("Thrown out at customerResults.length === 0");
          return null; // TODO throw an error
        }
        const customer = customerResults[0];
        console.log("Bad debugging 2");

        query = `SELECT * FROM product`;
        values = [];

        const [productResults] = await pool.query(query, values);

        // If no results, the purchase isn't found
        if (productResults.length === 0) {
          console.log("Thrown out at productResults.length === 0");
          return null; // TODO throw an error
        }
    
        const products = productResults;
        console.log("Bad debugging 3");

        query = `
          SELECT * FROM purchase 
          WHERE paymentIntentId = ?`;
        values = [paymentIntentId];

        const [purchaseResults] = await pool.query(query, values);

        // If no results, the purchase isn't found
        if (purchaseResults.length === 0) {
          console.log("Thrown out at purchaseResults.length === 0");
          return null; // TODO throw an error
        }
    
        const purchase = purchaseResults[0];
        console.log("Bad debugging 4");

        // TODO this pulls the default address
        query = `
          SELECT * FROM address 
          WHERE customerKey = ? ORDER BY defaultAddress DESC`;
        values = [customer.customerKey];

        const [addressResults] = await pool.query(query, values);

        // If no results, the user isn't found
        if (addressResults.length === 0) {
          console.log("Thrown out at addressResults.length === 0");
          console.log("Query:")
          console.log(query)
          console.log("values:")
          console.log(values)
          return null; // TODO throw an error
        }
    
        // If a token exists, the user is authenticated
        const address = addressResults[0];
        console.log("Bad debugging 5");

        query = `
          SELECT * FROM lineItem 
          WHERE purchaseKey = ?`;
        values = [purchase.purchaseKey];

        const [lineItemResults] = await pool.query(query, values);

        // If no results, the purchase isn't found
        if (lineItemResults.length === 0) {
          console.log("Thrown out at lineItemResults.length === 0");
          return null; // TODO throw an error
        }
    
        console.log("lineItemResults");
        console.log(lineItemResults);
        console.log("products");
        console.log(products);

        const lineItems = lineItemResults.map(lineItem => {
          const product = products.find(product => {return lineItem.productKey === product.productKey});
          return({
            "chumon_meisai_no": lineItem.lineItemKey,
            "shohin_code": product?.id,
            "shohin_name": product?.title,
            "suryo": lineItem.quantity,
            "tanka": Number(lineItem.unitPrice),
            "kingaku": Math.round(Number(lineItem.unitPrice) * (1+Number(lineItem.taxRate))),
            "soryo": 0,
            "zei_ritsu": Number(lineItem.taxRate) * 100,
            "gokei_kingaku": Math.round(Number(lineItem.unitPrice) * (1+Number(lineItem.taxRate)) * lineItem.quantity)
          })
        });

        console.log("Bad debugging 6");

        const shippingDetails = lineItemResults.map(lineItem => {
          const product = products.find(product => {return lineItem.productKey === product.productKey});
          return ({
            "haiso_meisai_no": 12,
            "shohin_code": product?.id,
            "shohin_name": product?.title,
            "suryo": lineItem.quantity,
            "chumon_meisai_no": lineItem.lineItemKey
          })
        })
  
        console.log("Bad debugging 7");

        const backupData = {
          "chumon_no": "NVP-" + purchase.purchaseKey,
          "chumon_date": formatDate(purchase.purchaseTime),
          "konyu_name": `${customer.lastName}, ${customer.firstName}`,
          "nebiki": 0,
          "soryo": 0,
          "zei1": Math.round(purchase.amount * (1/1.1)),
          "zei_ritsu1": 10,
          "zei2": 0,
          "zei_ritsu2": 0,
          "zei3": 0,
          "zei_ritsu3": 0,
          "konyu_mail_address": customer.email,
          "touroku_kbn": 0,
          "chumon_meisai": lineItems, // This is an array
          "haiso": [
            {
              "shuka_date": formatDate(purchase.purchaseTime),
              "haiso_name": address.firstName,
              "haiso_post_code": address.postalCode,
              "haiso_pref_code": address.prefCode,
              "haiso_pref": address.pref,
              "haiso_city": address.city,
              "haiso_address1": address.ward,
              "haiso_address2": address.address2,
              "haiso_renrakusaki": `${address.lastName}, ${address.firstName}`,
              "haiso_meisai": shippingDetails // This is an array
            }
          ]
        }
        console.log("backupData");
        console.dir(backupData, { depth: null });
        const backupResults = await StoreBackupData("chumon_renkei_api", backupData);
        console.log("backupResults");
        console.log(backupResults);
      } // Only runs on "succeeded"
    } catch (error) {
      console.error('Error updating payment: ', error);
      return res.status(500).send('Error updating payment: ' + error);
    }
  }

  console.log("Bad debugging 8");

  query = `SELECT customerKey FROM purchase WHERE paymentIntentId = ?;`
  values = [paymentIntentId];
  let customerKey;

  try {
    const [results] = await pool.query(query, values);

    console.log("Bad debugging 9");
    if (results.length === 0) {
      console.error('Error finding customer key after payment verification: ', error);
      return res.status(500).send('Error finding customer key after payment verification: ' + error);
    }

    customerKey = results[0].customerKey;
    console.log("Bad debugging 10");

  } catch (error) {
    console.error('Error pulling customer data after payment verification: ', error);
    return res.status(500).send('Error pulling customer data after payment verification: ' + error);
  }

  console.log("Bad debugging 11");
  query = `SELECT * FROM customer WHERE customerKey = ?`;
  values = [customerKey];
  const [results] = await pool.query(query, values);

  if (results.length === 0) {
    console.error('Error pulling customer data with key after payment verification: ', error);
    return res.status(500).send('Error pulling customer data with key after payment verification: ' + error);
  }

  const customer = results[0];

  console.log("Bad debugging 12");
  // Pull customer's cart
  const cartData = await GetCartDataFromCustomerKey(customerKey);
  customer.cart = { lines: cartData };

  // Pull customer's purchases
  const purchases = await GetPurchasesFromCustomerKey(customerKey);
  customer.purchases = purchases;

  // Pull customer's addresses
  const addresses = await GetAddressesFromCustomerKey(customerKey);
  customer.addresses = addresses;

  // Remove sensitive data before sending the customer object
  delete customer.password_hash;

  console.log("Bad debugging 13");
  return res.json({customerData: customer, paymentStatus: paymentStatus});
});
//#endregion Stripe


app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    res.status(500).send('Something broke! Time: ' + CurrentTime());
});

function CurrentTime() {
  const current = new Date();
  return `${current.getFullYear()}/${String(current.getMonth() + 1).padStart(2, '0')}/${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}:${String(current.getSeconds()).padStart(2, '0')}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);

  // Format the date components to be in YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Add 1 because months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => { console.log(`Server started on ${PORT} at ${CurrentTime()}`); });
