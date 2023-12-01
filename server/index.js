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



async function fetchProducts() {
  console.log("Hit fetchProducts. Time: " + CurrentTime());

  const query = `
    SELECT p.*, i.imageKey, i.url, i.displayOrder, i.altText 
    FROM product p
    LEFT JOIN image i ON p.productKey = i.productKey
  `;
  //console.log("Query: " + query);

  try{
    const results = (await pool.query(query))[0];

    if (!results) {
      console.log("Products not found");
      return Promise.reject("Products not found");
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
    console.log(`[${CurrentTime()}] Updated modern products.json`);

    return Promise.resolve(true);
  } catch(error) {
    console.error(`[${CurrentTime()}] Error fetching products:`, error);
    return Promise.reject(error);
  }
}

fetchProducts();


app.post('/createUser', async (req, res) => {
  try {
    const userData = req.body.data;
    let firstName = userData.firstName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let lastName = userData.lastName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let firstNameKana = userData.firstNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let lastNameKana = userData.lastNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    let email = userData.email?.replace(/[^\w.@-]/g, '');
    let password = userData.password?.replace(/[^\x20-\x7E]/g, '');

    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds
  
    const token = crypto.randomBytes(48).toString('hex');

    const query = `
      INSERT INTO customer (firstName, lastName, firstNameKana, lastNameKana, email, passwordHash, token)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [firstName, lastName, firstNameKana, lastNameKana, email, hashedPassword, token];

    pool.query(query, values);

    console.log(`Created user with token: ${token}`);
    res.json({ token: token });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Error creating user: ' + error);
  }
});

app.post('/addAddress', async (req, res) => {
  console.log("Hit addAddress. Time: " + CurrentTime());
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


  let query;

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

  const values = [customerKey, firstName, lastName, postalCode, prefCode, pref, city, ward, address2, phoneNumber, defaultAddress];

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
  console.log("Hit deleteAddress. Time: " + CurrentTime());
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

  let query = `DELETE FROM address WHERE addressKey = ? AND customerKey = ?`;
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
  console.log("Hit login. Time:" + CurrentTime());
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
  console.log("Hit addToCart. Time: " + CurrentTime());
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

  /*
  try {
    // Check if the item already exists in the cart
    const checkQuery = "SELECT quantity FROM lineItem WHERE productKey = ? AND customerKey = ? AND unitPrice = ? AND taxRate = ?";
    const existingItem = await new Promise((resolve, reject) => {
        connection.query(checkQuery, [productKey, customerKey, roundedUnitPrice, roundedTaxRate], (error, results) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    if (existingItem.length > 0) {
      // Item exists, update the quantity
      const newQuantity = existingItem[0].quantity + quantity;
      const updateQuery = "UPDATE lineItem SET quantity = ? WHERE productKey = ? AND customerKey = ? AND unitPrice = ? AND taxRate = ?";
      await new Promise((resolve, reject) => {
          connection.query(updateQuery, [newQuantity, productKey, customerKey, roundedUnitPrice, roundedTaxRate], (error, results) => {
              if (error) reject(error);
              resolve(results);
          });
      });
    } else {
      // Insert data into the database
      const insertQuery = "INSERT INTO lineItem (productKey, customerKey, unitPrice, taxRate, quantity) VALUES (?, ?, ?, ?, ?)";
      await new Promise((resolve, reject) => {
          connection.query(insertQuery, [productKey, customerKey, roundedUnitPrice, roundedTaxRate, quantity], (error, results) => {
              if (error) reject(error);
              resolve(results);
          });
      });
    }

    const updatedCart = await GetCartDataFromCustomerKey(customerKey)
    res.json(updatedCart);
  } catch (error) {
      console.error('Error in addToCart:', error);
      res.status(500).send('An error occurred');
  }
  */

  try {
    // Check if the item already exists in the cart
    const checkQuery = "SELECT quantity FROM lineItem WHERE productKey = ? AND customerKey = ? AND unitPrice = ? AND taxRate = ?";
    const existingItem = (await pool.query(checkQuery, [productKey, customerKey, roundedUnitPrice, roundedTaxRate]))[0];
  
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
  console.log("Hit updateCartQuantity. Time: " + CurrentTime());
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

  /*
  try {
    // Update line quantity in database
    const updateQuery = "UPDATE lineItem SET quantity = ? WHERE customerKey = ? AND lineItemKey = ?";
    await new Promise((resolve, reject) => {
      connection.query(updateQuery, [quantity, customerKey, lineItemKey], (error, results) => {
        if (error) { reject(error); }
        resolve(results);
      });
    });

    const updatedCart = await GetCartDataFromCustomerKey(customerKey)
    res.json(updatedCart);
  } catch (error) {
      console.error('Error in updateCartQuantity:', error);
      res.status(500).send('An error occurred');
  }
  */

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
  console.log("Hit deleteFromCart. Time: " + CurrentTime());
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

  /*
  try {
    // Delete line from database
    const deleteQuery = "DELETE FROM lineItem WHERE customerKey = ? AND lineItemKey = ?";
    await new Promise((resolve, reject) => {
      connection.query(deleteQuery, [customerKey, lineItemKey], (error, results) => {
        if (error) { reject(error); }
        resolve(results);
      });
    });

    const updatedCart = await GetCartDataFromCustomerKey(customerKey)
    res.json(updatedCart);
  } catch (error) {
      console.error('Error in deleteFromCart:', error);
      res.status(500).send('An error occurred');
  }
  */

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

async function verifyToken(customerKey, token) {
  try {
    const query = 'SELECT * FROM customer WHERE customerKey = ? AND token = ?';
    const results = (await pool.query(query, [customerKey, token]))[0];

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
    const query = `SELECT * FROM customer WHERE email = ?`;

    // Execute the query using the promisified pool.query and wait for the promise to resolve
    const results = (await pool.query(query, [email]))[0];

    // If no results, the email is not registered
    if (results.length === 0) {
      return null;
    }

    const customer = results[0];
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
    const query = `SELECT * FROM customer WHERE token = ?`;

    // Execute the query using the promisified pool.query and wait for the promise to resolve
    const results = (await pool.query(query, [token]))[0];

    // If no results, the token does not exist
    if (results.length === 0) {
      return null;
    }

    // If a token exists, the user is authenticated
    const customer = results[0];

    // Pull customer's cart
    const cartData = await GetCartDataFromCustomerKey(customer.customerKey);
    if (cartData.error) {
      throw new Error("Cart query error: " + cartData.error);
    }
    customer.cart = { lines: cartData };

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
    SELECT * FROM lineItem
    WHERE customerKey = ? AND purchaseKey IS NULL`;

  // Execute the query using the promisified pool.query and wait for the promise to resolve
  try {
    const updatedCart = (await pool.query(selectQuery, [customerKey]))[0];
    return updatedCart;
  } catch (error) {
    console.error('Error in GetCartDataFromCustomerKey: ', error);
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

function ProcessAddresses(addresses) {
  const updatedAddresses = addresses.map(address => {
    if(address === undefined) return null;

    const defaultAddress = address.defaultAddress?.toString() === "1"
    return {
      ...address,
      defaultAddress: defaultAddress
    }
  });
  
  return updatedAddresses;
}


//#region Stripe
const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};

app.post("/createPaymentIntent", async (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "jpy",
  });

  res.send({ clientSecret: paymentIntent.client_secret });
});
//#endregion

app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    res.status(500).send('Something broke! Time: ' + CurrentTime());
});

function CurrentTime() {
  const current = new Date();
  return `${current.getFullYear()}/${String(current.getMonth() + 1).padStart(2, '0')}/${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}:${String(current.getSeconds()).padStart(2, '0')}`;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => { console.log(`Server started on ${PORT} at ${CurrentTime()}`); });
