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

const prefectureNames = [
  {code: 1 , name:"北海道"},
  {code: 2 , name:"青森県"},
  {code: 3 , name:"岩手県"},
  {code: 4 , name:"宮城県"},
  {code: 5 , name:"秋田県"},
  {code: 6 , name:"山形県"},
  {code: 7 , name:"福島県"},
  {code: 8 , name:"茨城県"},
  {code: 9 , name:"栃木県"},
  {code: 10, name:"群馬県"},
  {code: 11, name:"埼玉県"},
  {code: 12, name:"千葉県"},
  {code: 13, name:"東京都"},
  {code: 14, name:"神奈川県"},
  {code: 15, name:"新潟県"},
  {code: 16, name:"富山県"},
  {code: 17, name:"石川県"},
  {code: 18, name:"福井県"},
  {code: 19, name:"山梨県"},
  {code: 20, name:"長野県"},
  {code: 21, name:"岐阜県"},
  {code: 22, name:"静岡県"},
  {code: 23, name:"愛知県"},
  {code: 24, name:"三重県"},
  {code: 25, name:"滋賀県"},
  {code: 26, name:"京都府"},
  {code: 27, name:"大阪府"},
  {code: 28, name:"兵庫県"},
  {code: 29, name:"奈良県"},
  {code: 30, name:"和歌山県"},
  {code: 31, name:"鳥取県"},
  {code: 32, name:"島根県"},
  {code: 33, name:"岡山県"},
  {code: 34, name:"広島県"},
  {code: 35, name:"山口県"},
  {code: 36, name:"徳島県"},
  {code: 37, name:"香川県"},
  {code: 38, name:"愛媛県"},
  {code: 39, name:"高知県"},
  {code: 40, name:"福岡県"},
  {code: 41, name:"佐賀県"},
  {code: 42, name:"長崎県"},
  {code: 43, name:"熊本県"},
  {code: 44, name:"大分県"},
  {code: 45, name:"宮崎県"},
  {code: 46, name:"鹿児島県"},
  {code: 47, name:"沖縄県"},
]

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

    const firstName = userData.firstName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    const lastName = userData.lastName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    const firstNameKana = userData.firstNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    const lastNameKana = userData.lastNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
    const gender = userData.gender?.replace(/[^\p{L}\p{N}\p{Z}]/gu, ''); // "male" or "female" typically

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!userData.email || !emailRegex.test(userData.email)) { return res.status(400).send('Missing or malformed email'); }
    const email = userData.email;

    const passwordRegex = /^[\x20-\x7E]{8,}$/;
    if(!userData.password || !passwordRegex.test(userData.password)) { return res.status(400).send('Missing or malformed password'); }
    const password = userData.password;

    const birthday = ValidateBirthday(userData.birthday);

    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds
  
    const token = crypto.randomBytes(48).toString('hex');

    query = "SELECT COUNT(*) FROM customer WHERE email = ?";
    try {
      const [existingCustomerCount] = await pool.query(query, [email]);
      if(existingCustomerCount[0]['COUNT(*)'] > 0) {
        //return res.status(400).send("すでに登録されたメール"); // Email already registered
        return res.status(400).json({data: null, error: "すでに登録されたメール"}); // Email already registered
      }
    } catch(error) {
      console.error('Error counting existing users by email:', error);
      return res.status(500).send('Error counting existing users by email');  
    }

    query = `
      INSERT INTO customer (firstName, lastName, firstNameKana, lastNameKana, gender, birthday, email, passwordHash, token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    values = [firstName, lastName, firstNameKana, lastNameKana, gender, birthday, email, hashedPassword, token];

  try {
    const [results] = await pool.query(query, values);
    //console.log("Results after adding new customer:");
    //console.log(results);

    const customerKey = results.insertId;
    const code = "NV" + customerKey;

    console.log(`Created user with customerKey: ${customerKey}, token: ${token} and code: ${code}`);
    return res.json({ customerKey: customerKey, token: token, code: code });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).send('Error creating user: ' + error);
  }
});

app.post('/updateUser', async (req, res) => {
  console.log("░▒▓█ Hit updateUser. Time: " + CurrentTime());
  console.log(req.body);

  //#region Validate input
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in updateUser: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const userData = req.body.data;
  const token = userData.token;

  const firstName = userData.firstName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
  const lastName = userData.lastName?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
  const firstNameKana = userData.firstNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
  const lastNameKana = userData.lastNameKana?.replace(/[^\p{L}\p{N}\p{Z}]/gu, '');
  const gender = userData.gender?.replace(/[^\p{L}\p{N}\p{Z}]/gu, ''); // "male" or "female" typically

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if(userData.email && !emailRegex.test(userData.email)) { return res.status(400).send('Malformed email'); }
  const email = userData.email;

  const passwordRegex = /^[\x20-\x7E]{8,}$/;
  if(userData.password && !passwordRegex.test(userData.password)) { return res.status(400).send('Malformed current password'); }
  const password = userData.password;

  if(userData.newPassword1 && !passwordRegex.test(userData.newPassword1)) { return res.status(400).send('Malformed new password'); }
  const newPassword1 = userData.newPassword1;

  if(userData.newPassword2 && !passwordRegex.test(userData.newPassword2)) { return res.status(400).send('Malformed new password'); }
  const newPassword2 = userData.newPassword2;

  if(newPassword1 && newPassword2 && newPassword1 !== newPassword2) { return res.status(400).send('Mismatched new password'); }

  if(newPassword1 && !password) { return res.status(400).send('Current password required to change password'); }

  const birthday = ValidateBirthday(userData.birthday);
  //#endregion

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined; // 10 salt rounds
  const hashedNewPassword = newPassword1 ? await bcrypt.hash(newPassword1, 10) : undefined; // 10 salt rounds


  // If updating to a new email address, make sure no one else has it.
  if(email) {
    query = "SELECT COUNT(*) FROM customer WHERE email = ? AND customerKey != ?";
    try {
      const [existingCustomerCount] = await pool.query(query, [email, customerKey]);
      if(existingCustomerCount[0]['COUNT(*)'] > 0) {
        return res.status(400).json({data: null, error: "※すでにこのメールアドレスのユーザーが存在しています。"}); // Email already registered
      }
    } catch(error) {
      console.error('Error counting existing users by email:', error);
      return res.status(500).send('Error counting existing users by email');
    }    
  }

  //#region Query to get customer info by customerKey and verify current password, if given
  try {
    query = `SELECT passwordHash FROM customer WHERE customerKey = ?`;
    const [results] = await pool.query(query, [customerKey]);

    // If no results, customer not found
    if (results.length === 0) {
      return res.status(500).send("Can't SELECT customer data");
    }

    const [customer] = results;

    // Compare the password (if provided) with the stored hash
    if(password) {
      const match = await bcrypt.compare(password, customer.passwordHash);
      if(!match) {
        return res.status(400).send("現在のパスワードが正しくありません");
      }  
    }
  } catch(error) {
    return res.status(500).send("Error pulling customer data");
  }
  //#endregion

  const queryParts = [];
  values = [];

  if (firstName      !== undefined) { queryParts.push('firstName = ?');      values.push(firstName); }
  if (lastName       !== undefined) { queryParts.push('lastName = ?');       values.push(lastName); }
  if (firstNameKana  !== undefined) { queryParts.push('firstNameKana = ?');  values.push(firstNameKana); }
  if (lastNameKana   !== undefined) { queryParts.push('lastNameKana = ?');   values.push(lastNameKana); }
  if (gender         !== undefined) { queryParts.push('gender = ?');         values.push(gender); }
  if (birthday       !== undefined) { queryParts.push('birthday = ?');       values.push(birthday); }
  if (email          !== undefined) { queryParts.push('email = ?');          values.push(email); }

  if (hashedPassword !== undefined && !hashedNewPassword) { queryParts.push('passwordHash = ?'); values.push(hashedPassword); }
  if (hashedNewPassword) { queryParts.push('passwordHash = ?'); values.push(hashedNewPassword); }

  if (queryParts.length === 0) {
    return res.status(400).send('No updateable fields provided');
  }

  query = `UPDATE customer SET ${queryParts.join(', ')} WHERE customerKey = ?`;
  values.push(customerKey);

  console.log("Update query:")
  console.log(query)
  console.log("Update values:")
  console.log(values)

  try {
    const [results] = await pool.query(query, values);
    console.log("Results after updating customer:");
    console.log(results);

    console.log(`Updated user with key: ${customerKey}`);
    return res.json({ customerKey: customerKey, code: `NV${customerKey}` });
  } catch (error) {
    console.error('Internal error updating user:', error);
    return res.status(500).send('Internal error updating user');
  }
});

function ValidateBirthday(birthdayInput) {
  if(!birthdayInput) return undefined;
  const birthdayObject = new Date(birthdayInput.replace(/[^\w\-:\/]/g, ''));
  if (isNaN(birthdayObject.getTime())) { return undefined; }

  const now = new Date();
  const oneHundredFiftyYearsAgo = new Date(now.getFullYear() - 150, now.getMonth(), now.getDate());
  if (birthdayObject > now || birthdayObject < oneHundredFiftyYearsAgo) { return undefined; }

  const year = birthdayObject.getFullYear();
  const month = (birthdayObject.getMonth() + 1).toString().padStart(2, '0');
  const day = birthdayObject.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
  //return `${year}年${month}月${day}日`;
}

app.post('/addAddress', async (req, res) => {
  console.log("░▒▓█ Hit addAddress. Time: " + CurrentTime());
  console.log(req.body);
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in addAddress: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const addressData = req.body.data;

  // addressKey can be passed in, when requesting an edit, or given by MySQL for a new address
  let addressKey;
  addressKey = Number(addressData.addressKey) || null;
  const newAddress = (addressKey === null)

  function SanitizeInput(input) { return (input) ? input.replace(/[^\p{L}\p{N}\p{Z}\-#&()]/gu, '') : ""; }
  const firstName =   SanitizeInput(addressData.firstName);
  const lastName =    SanitizeInput(addressData.lastName);
  const postalCode =  SanitizeInput(addressData.postalCode);
  const prefCode =    parseInt(SanitizeInput(addressData.prefCode));
  const pref =        prefectureNames.find(prefectureName => {return prefectureName.code === prefCode}).name;
  const city =        SanitizeInput(addressData.city);
  const ward =        SanitizeInput(addressData.ward);
  const address2 =    SanitizeInput(addressData.address2);
  const phoneNumber = SanitizeInput(addressData.phoneNumber);

  // This can be changed later if needed
  // MySQL uses "1" and "0" for true and false
  let defaultAddress = (addressData.defaultAddress ? "1" : "0");

  if (!Number.isInteger(customerKey) || customerKey <= 0 || customerKey >= 2147483647) {
    return res.status(400).send('Malformed customerKey: ' + customerKey);
  }


  // Count the number of default addresses. If it's zero, force this new one to be default
  // If it's an update, don't include the one being updates in this count
  // When addressKey is not null, it will exclude the address with that key.
  // When addressKey is null, the ? IS NULL condition becomes true, so the addressKey <> ? part is effectively ignored.
  query = "SELECT COUNT(*) FROM address WHERE defaultAddress = 1 AND customerKey = ? AND (? IS NULL OR addressKey <> ?)";
  try {
    const [defaultsCount] = await pool.query(query, [customerKey, addressKey, addressKey]);
    if(defaultsCount[0]['COUNT(*)'] === 0) { defaultAddress = "1"; }
  } catch(error) {
    console.error('Error counting address defaults:', error);
    return res.status(500).send('Error counting address defaults: ' + error);  
  }


  // If this address wants to be the default, all others must not be default
  if(defaultAddress === "1") {
    query = "UPDATE address SET defaultAddress = 0 WHERE customerKey = ?;"
    try {
      await pool.query(query, [customerKey]);
    } catch(error) {
      console.error('Error updating old address defaults:', error);
      return res.status(500).send('Error updating old address defaults: ' + error);  
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
    return res.status(500).send(`Error ${newAddress ? "adding" : "updating"} address: ${error}`);
  }

  const freshAddresses = await PullFreshAddresses(customerKey)
  return res.json({ addresses: freshAddresses });
});

app.post('/deleteAddress', async (req, res) => {
  console.log("░▒▓█ Hit deleteAddress. Time: " + CurrentTime());
  console.log(req.body);
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in deleteAddress: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const addressData = req.body.data;
  if(!addressData) {
    const errorMessage = "No addresses data in deleteAddress";
    console.error(errorMessage);
    return res.status(400).send(errorMessage);
  }

  const addressKey = Number(addressData.addressKey);
  if(!addressKey) {
    const errorMessage = `Malformed addressKey in deleteAddress: ${addressKey}`;
    console.error(errorMessage);
    return res.status(400).send(errorMessage);
  }

  query = `DELETE FROM address WHERE addressKey = ? AND customerKey = ?`;
  try {
    await pool.query(query, [addressKey, customerKey]);
  } catch(error) {
    const errorMessage = `Error deleting address, addressKey: ${addressKey}, customerKey: ${customerKey}`;
    console.error(errorMessage);
    return res.status(500).send(errorMessage);
  }

  let forceNewDefault = false;
  query = "SELECT COUNT(*) FROM address WHERE defaultAddress = 1 AND customerKey = ?";
  try {
    const [defaultsCount] = await pool.query(query, [customerKey]);
    if(defaultsCount[0]['COUNT(*)'] === 0) { forceNewDefault = true; }
  } catch(error) {
    console.error('Error counting address defaults after delete:', error);
    return res.status(500).send('Error counting address defaults after delete: ' + error);  
  }

  if(forceNewDefault) {
    query = `UPDATE address SET defaultAddress = ? WHERE customerKey = ? LIMIT 1`;
    await pool.query(query, [true, customerKey]);
  }

  const freshAddresses = await PullFreshAddresses(customerKey)
  return res.json({ addresses: freshAddresses });
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
    return res.status(500).send(`Error pulling fresh addresses after updating address: ${error}`);
  }  
}

app.post('/sendEmail', async (req, res) => {
  console.log("░▒▓█ Hit sendEmail. Time: " + CurrentTime());
  console.log(req.body);
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
      return res.status(200).send('Email sent successfully');
  } catch (error) {
      const errorMessage = `[${new Date().toISOString()}] Error in /sendEmail: ${error.message}`;
      console.error(errorMessage);
      return res.status(500).send(errorMessage);
  }
});

app.post('/sendWelcome', async (req, res) => {
  console.log("░▒▓█ Hit sendWelcome. Time: " + CurrentTime());
  console.log(req.body);

  const recipient = req.body.recipient;
  console.log("recipient: " + recipient);

  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.WELLMILL_EMAIL_ADDRESS,
          pass: process.env.WELLMILL_EMAIL_APP_PASSWORD
      }
  });

  const old_emailHTML = `
  <html>
      <head>
          <style>
              /* Inline CSS here */
          </style>
      </head>
      <body>
        <div style="display: flex; justify-content: center">
          <div style="display: grid; width: 30rem; margin-top: 2rem; grid-template-columns: 1fr;">
          <img src="cid:logo" alt="Logo">
          <span style="font-size: 1.5rem; display: flex; margin-top: 1rem;">ウェルミル（デストサイト）へようこそ!</span>
          <span style="color: #444; display: flex; margin: 1rem 0;">会員登録いただきありがとうございます。引き続きお買い物をお楽しみください。</span>
          <a href="https://cdehaan.ca/wellmill/shop" style="width: 10rem; text-align: center; background-color: #FFA500; padding: 1rem; border-radius: 0.25rem; color: white; text-decoration: none; justify-self: flex-start">ショッピングアクセスする</a>
          </div>
        </div>
        <hr/>
        <div style="display: flex; justify-content: center">
          <div style="display: grid; width: 30rem; margin-top: 2rem; grid-template-columns: 1fr;">
            <span style="display: flex; font-size: 0.9rem; color: #444;">株式会社リプロセル 臨床検査室</span>
            <span style="display: flex; font-size: 0.9rem; color: #444;">〒222-0033 神奈川県横浜市港北区新横浜3-8-11</span>
            <span style="display: flex; font-size: 0.9rem; color: #FFA500;">0120-825-828</span>
            <span style="display: flex; font-size: 0.9rem; color: #444;">(平日9:00~18:00 土日祝日休み)</span>
          </div>
        </div>
      </body>
  </html>
  `;

  const emailHTML = `
<html>
  <head>
    <style>
      /* Inline CSS here for styling */
      table {
        border-spacing: 0;
      }
      td {
        padding: 0;
      }
      img {
        border: 0;
      }
      .content {
        width: 600px;
        margin: 0 auto;
      }
      .button {
        background-color: #FFA500;
        color: #FFFFFF;
        padding: 1rem;
        border-radius: 0.25rem;
        text-decoration: none;
        text-align: center;
        display: inline-block;
      }
      .footer-text {
        font-size: 0.9rem;
        color: #888;
        padding: 0;
      }
      .footer-highlight {
        color: #FFA500;
      }
    </style>
  </head>
  <body>
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table class="content" cellspacing="0" cellpadding="0">
            <!-- Logo -->
            <tr>
              <td align="left" style="padding-top: 2rem;">
                <img src="cid:logo" alt="Logo" style="max-width: 100%;">
              </td>
            </tr>
            <!-- Title -->
            <tr>
              <td align="left" style="font-size: 1.5rem; color: #000; padding: 1rem 0;">
                ウェルミル（デストサイト）へようこそ!
              </td>
            </tr>
            <!-- Message -->
            <tr>
              <td align="left" style="color: #444; padding: 0;">
                会員登録いただきありがとうございます。引き続きお買い物をお楽しみください。
              </td>
            </tr>
            <!-- Button -->
            <tr>
              <td align="left" style="padding: 1rem 0;">
                <a href="https://cdehaan.ca/wellmill/shop" class="button" style="color: #FFFFFF">
                  ショッピングアクセスする
                </a>
              </td>
            </tr>
            <!-- Separator -->
            <tr>
              <td align="center" style="padding: 2rem 0;">
                <hr/>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="left" style="padding-bottom: 2rem;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="footer-text" align="left">
                      株式会社リプロセル 臨床検査室
                    </td>
                  </tr>
                  <tr>
                    <td class="footer-text" align="left">
                      〒222-0033 神奈川県横浜市港北区新横浜3-8-11
                    </td>
                  </tr>
                  <tr>
                    <td class="footer-text footer-highlight" align="left">
                      0120-825-828
                    </td>
                  </tr>
                  <tr>
                    <td class="footer-text" align="left">
                      (平日9:00~18:00 土日祝日休み)
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  let mailOptions = {
      from: process.env.WELLMILL_EMAIL_ADDRESS, 
      to: recipient, 
      //to: "cdehaan@gmail.com", 
      subject: '【ウェルミル】お客様アカウントの確認',
      html: emailHTML,
      attachments: [{
        filename: 'logo.png',
        path: __dirname + '/logo.png',
        cid: 'logo'
    }]
  };

  try {
      await transporter.sendMail(mailOptions);
      return res.status(200).send('Email sent successfully');
  } catch (error) {
      const errorMessage = `[${new Date().toISOString()}] Error in /sendEmail: ${error.message}`;
      console.error(errorMessage);
      return res.status(500).send(errorMessage);
  }
});

app.post('/sendPassword', async (req, res) => {
  console.log("░▒▓█ Hit sendPassword. Time: " + CurrentTime());
  console.log(req.body);

  const recipient = req.body.recipient;
  console.log("recipient: " + recipient);

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if(!emailRegex.test(recipient)) {
     return res.status(400).send("Malformed email");
  }

  const newPassword = crypto.randomBytes(4).toString('hex');
  const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 salt rounds
  
  query = `UPDATE customer SET passwordHash = ? WHERE email = ?`;
  await pool.query(query, [hashedPassword, recipient]);


  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.WELLMILL_EMAIL_ADDRESS,
          pass: process.env.WELLMILL_EMAIL_APP_PASSWORD
      }
  });

  const emailHTML = `
<html>
  <head>
    <style>
      /* Inline CSS here for styling */
      table {
        border-spacing: 0;
      }
      td {
        padding: 0;
      }
      img {
        border: 0;
      }
      .content {
        width: 600px;
        margin: 0 auto;
      }
      .newPassword {
        background-color: #DDEEFF;
        border: 1px solid #a8d4ff;
        padding: 0.5rem 2rem;
      }
      .button {
        background-color: #FFA500;
        color: #FFFFFF;
        padding: 1rem;
        border-radius: 0.25rem;
        text-decoration: none;
        text-align: center;
        display: inline-block;
      }
      .footer-text {
        font-size: 0.9rem;
        color: #888;
        padding: 0;
      }
      .footer-highlight {
        color: #FFA500;
      }
    </style>
  </head>
  <body>
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table class="content" cellspacing="0" cellpadding="0">
            <!-- Logo -->
            <tr>
              <td align="left" style="padding-top: 2rem;">
                <img src="cid:logo" alt="Logo" style="max-width: 100%;">
              </td>
            </tr>
            <!-- Title -->
            <tr>
              <td align="left" style="font-size: 1.5rem; color: #000; padding: 1rem 0;">
                パスワードのリセット
              </td>
            </tr>
            <!-- Message -->
            <tr>
              <td align="left" style="color: #444; padding: 0;">
              これが新しいパスワードです。 サイトにサインインして、できるだけ早く変更してください。
              </td>
            </tr>
            <tr>
              <td align="left" class="newPassword">
                ${newPassword}
              </td>
            </tr>
            <!-- Button -->
            <tr>
              <td align="left" style="padding: 1rem 0;">
                <a href="https://cdehaan.ca/wellmill/login" class="button" style="color: #FFFFFF">
                  今すぐサインイン
                </a>
              </td>
            </tr>
            <!-- Separator -->
            <tr>
              <td align="center" style="padding: 2rem 0;">
                <hr/>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="left" style="padding-bottom: 2rem;">
                <table width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="footer-text" align="left">
                      株式会社リプロセル 臨床検査室
                    </td>
                  </tr>
                  <tr>
                    <td class="footer-text" align="left">
                      〒222-0033 神奈川県横浜市港北区新横浜3-8-11
                    </td>
                  </tr>
                  <tr>
                    <td class="footer-text footer-highlight" align="left">
                      0120-825-828
                    </td>
                  </tr>
                  <tr>
                    <td class="footer-text" align="left">
                      (平日9:00~18:00 土日祝日休み)
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  let mailOptions = {
      from: process.env.WELLMILL_EMAIL_ADDRESS, 
      to: recipient, 
      //to: "cdehaan@gmail.com", 
      subject: '【ウェルミル】お客様アカウントの確認',
      html: emailHTML,
      attachments: [{
        filename: 'logo.png',
        path: __dirname + '/logo.png',
        cid: 'logo'
    }]
  };

  try {
      await transporter.sendMail(mailOptions);
      return res.status(200).send('Email sent successfully');
  } catch (error) {
      const errorMessage = `[${new Date().toISOString()}] Error in /sendEmail: ${error.message}`;
      console.error(errorMessage);
      return res.status(500).send(errorMessage);
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
    if(customerData.error) {
      return res.status(401).json({ error: customerData.error });
    }
  } else if(token) {
    console.log("token login");
    customerData = await GetCustomerDataFromToken(token);
    if(customerData.error) {
      return res.status(401).json({ error: customerData.error });
    }
  } else {
    return res.status(401).json({ error: "No customer credentials given" });
  }

  return res.json({customerData: customerData});
});

app.post('/addToCart', async (req, res) => {
  console.log("░▒▓█ Hit addToCart. Time: " + CurrentTime());
  console.log(req.body); // { data: { productKey: 1, customerKey: 1, quantity: 1 } }
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in addToCart: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const cartData = req.body.data;
  const { productKey, unitPrice, taxRate, quantity } = cartData;

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
    return res.json(updatedCart);
  } catch (error) {
    console.error('Error in addToCart:', error);
    return res.status(500).send('An error occurred');
  }
});

app.post('/updateCartQuantity', async (req, res) => {
  console.log("░▒▓█ Hit updateCartQuantity. Time: " + CurrentTime());
  console.log(req.body);
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in updateCartQuantity: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const updateData = req.body.data;
  const { lineItemKey, quantity } = updateData;

  // Sanitize input
  if (!Number.isInteger(lineItemKey) || lineItemKey.toString().length > 50 ||
      !Number.isInteger(quantity)    || quantity.toString().length > 50) {
      return res.status(400).send('Invalid input');
  }

  try {
    // Update line quantity in the database
    const updateQuery = "UPDATE lineItem SET quantity = ? WHERE customerKey = ? AND lineItemKey = ?";
    await pool.query(updateQuery, [quantity, customerKey, lineItemKey]);
  
    // Get updated cart data
    const updatedCart = await GetCartDataFromCustomerKey(customerKey);
    return res.json(updatedCart);
  } catch (error) {
    console.error('Error in updateCartQuantity:', error);
    return res.status(500).send('An error occurred');
  }
});

app.post('/deleteFromCart', async (req, res) => {
  console.log("░▒▓█ Hit deleteFromCart. Time: " + CurrentTime());
  console.log(req.body); // { data: { customerKey: 1, token: "abc", lineItemKey: 1 } }
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in deleteFromCart: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const lineItemData = req.body.data;
  const { lineItemKey } = lineItemData;

  // Sanitize input
  if (!Number.isInteger(lineItemKey) || lineItemKey.toString().length > 50) {
      return res.status(400).send('Invalid input');
  }

  try {
    // Delete line from the database
    const deleteQuery = "DELETE FROM lineItem WHERE customerKey = ? AND lineItemKey = ?";
    await pool.query(deleteQuery, [customerKey, lineItemKey]);
  
    // Get updated cart data
    const updatedCart = await GetCartDataFromCustomerKey(customerKey);
    return res.json(updatedCart);
  } catch (error) {
    console.error('Error in deleteFromCart:', error);
    return res.status(500).send('An error occurred');
  }
});

app.post('/cancelPurchase', async (req, res) => {
  console.log("░▒▓█ Hit cancelPurchase. Time: " + CurrentTime());
  console.log(req.body); // { data: { customerKey: 1, token: "abc", purchaseKey: 193 } }
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in deleteFromCart: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const purchaseKey = req.body.data.purchaseKey;

  // Sanitize input
  if (!Number.isInteger(purchaseKey) || purchaseKey.toString().length > 50) {
      return res.status(400).send('Invalid input');
  }

  const connection = await pool.getConnection();
  try {
    // Delete query for lineItem table
    const deleteLineItemQuery = "DELETE FROM lineItem WHERE customerKey = ? AND purchaseKey = ?";
    await connection.query(deleteLineItemQuery, [customerKey, purchaseKey]);

    // Delete query for purchase table
    const deletePurchaseQuery = "DELETE FROM purchase WHERE customerKey = ? AND purchaseKey = ?";
    await connection.query(deletePurchaseQuery, [customerKey, purchaseKey]);

    // Commit the transaction if both queries succeed
    await connection.commit();
  } catch (error) {
    // If an error occurs, roll back the transaction
    await connection.rollback();
    console.log("Error while canceling purchase: ");
    console.dir(error, { depth: null, colors: true });
    return res.status(500).send("Error canceling purchase");
  } finally {
    // Release the connection back to the pool
    connection.release();
  }

  // Get updated customer data
  const customerData = await GetCustomerDataFromCustomerKey(customerKey);
  return res.json(customerData);
});

app.post('/deleteLineItem', async (req, res) => {
  console.log("░▒▓█ Hit deleteLineItem. Time: " + CurrentTime());
  console.log(req.body);
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in deleteFromCart: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const lineItemKey = req.body.data?.lineItemKey;

  // Sanitize input
  if (!Number.isInteger(lineItemKey) || lineItemKey.toString().length > 50) {
      return res.status(400).send('Invalid input');
  }

  query = `
    SELECT p.newPurchaseJson 
    FROM lineItem li
    JOIN purchase p ON li.purchaseKey = p.purchaseKey
    WHERE li.lineItemKey = ?;
  `;

  try {
    const results = await pool.query(query, [lineItemKey]);
    if (results.length > 0) {
        const originalPurchaseJson = JSON.parse(results[0].newPurchaseJson);
        console.log("originalPurchaseJson");
        console.dir(originalPurchaseJson, { depth: null, colors: true });


        // Now `originalPurchaseJson` is your object, and you can make changes to it
    } else {
      console.log("results.length > 0 failed when selecting newPurchaseJson using lineItemKey: " + lineItemKey);
      return res.status(400).send('Purchase not found');
    }
  } catch (error) {
    console.log("query failed when selecting newPurchaseJson using lineItemKey: " + lineItemKey + ", error:");
    console.dir(error, { depth: null, colors: true });
    return res.status(500).send('Purchase not found');
  }


  try {
    // Delete line from the database
    const deleteQuery = "DELETE FROM lineItem WHERE customerKey = ? AND lineItemKey = ?";
    await pool.query(deleteQuery, [customerKey, lineItemKey]);
  
    // Get updated cart data
    const updatedCart = await GetCartDataFromCustomerKey(customerKey);
    return res.json(updatedCart);
  } catch (error) {
    console.error('Error in deleteFromCart:', error);
    return res.status(500).send('An error occurred');
  }
});


//#region Azure backup
const BASE_URL = 'https://wellmill-test-api-mgmnt.azure-api.net/api/';


// This storeBackupData Works a charm
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
    return res.json(responseData);

  } catch (error) {
    // Handle any other errors
    return res.status(500).json({ message: error.message || 'An unexpected error occurred.' });
  }
});
*/

app.post('/storeBackupData', async (req, res) => {
  console.log("░▒▓█ Hit storeBackupData. Time: " + CurrentTime());
  console.log(req.body);

  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in storeBackupData: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const { endpoint, inputData } = req.body.data;

  const result = await StoreBackupData(endpoint, inputData);

  if (result.error) {
    return res.status(result.status).json({ message: result.message });
  }

  return res.json(result);
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
    //console.dir(responseData);

    if (!response.ok) {
      return { error: true, status: response.status, message: 'An unexpected error occurred in StoreBackupData.' };
    }

    return responseData;
  } catch (error) {
    return { error: true, status: 500, message: error.message || 'An unexpected error occurred in StoreBackupData.' };
  }
}
//#endregion Azure backup


async function GetCustomerDataFromCredentials(email, password) {
  try {
    // Prepare the SQL query to find the user by email
    query = `SELECT * FROM customer WHERE email = ?`;

    // Execute the query using the promisified pool.query and wait for the promise to resolve
    const [results] = await pool.query(query, [email]);

    // If no results, the email is not registered
    if (results.length === 0) {
      //return {error: "Email and Password pair not found"};
      return {error: "メールアドレスとパスワードが一致しません"};
    }

    const [customerResults] = results;

    // Compare the provided password with the stored hash
    const match = await bcrypt.compare(password, customerResults.passwordHash);

    // Passwords do not match
    if (!match) {
      // TODO think about some login attempt limit
      //return {error: "Email and Password pair not found"};
      return {error: "メールアドレスとパスワードが一致しません"};
    }

    // Passwords match, now fetch the customer's cart
    //console.log("Correct password");

    const customer = GetCustomerDataFromCustomerKey(customerResults.customerKey);

    return customer;
  } catch (error) {
    console.error('Error in GetCustomerDataFromCredentials:', error);
    return {error: "Internal login error"};
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
      return {error: "Token not validated"};
    }

    // Token exists, the user is authenticated, get their customerKey
    const customerKey = results[0].customerKey;

    const customer = GetCustomerDataFromCustomerKey(customerKey);

    return customer;
  } catch (error) {
    console.error('Error in GetCustomerDataFromToken:', error);
    return {error: "Error validating token"};
  }
}

async function GetCustomerDataFromCustomerKey(customerKey) {
    query = `SELECT * FROM customer WHERE customerKey = ?`;

    // Execute the query using the promisified pool.query and wait for the promise to resolve
    const [results] = await pool.query(query, [customerKey]);

    // If no results, the customer does not exist
    if (results.length === 0) {
      return {error: "Customer not found with customerKey"};
    }

    // A customer exists
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
    delete customer.passwordHash;

    return customer;
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
  console.dir(req.body, { depth: null, colors: true });
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in createPaymentIntent: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  const cartLines = req.body.data.cartLines;
  const purchaseTotal = calculateOrderAmount(cartLines);
  if(isNaN(purchaseTotal)) { return res.status(400).send('Malformed items in cart'); }

  const addressesState = req.body.data.addressesState;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: purchaseTotal,
    currency: "jpy",
  });

  console.log("Created paymentIntent:");
  //console.log(paymentIntent);

  // Make the purchase intention, even though they are just on the checkout screen. Stripe suggests doing this
  query = `
    INSERT INTO purchase (customerKey, paymentIntentId, amount)
    VALUES (?, ?, ?)`;
  values = [customerKey, paymentIntent.id, paymentIntent.amount];

  let purchaseInsertId;
  try {
    const [results] = await pool.query(query, values);
    purchaseInsertId = results.insertId;
  } catch (error) {
    console.error('Error creating purchase intention: ', error);
    return res.status(500).send('Error creating purchase intention: ' + error);
  }

  // Match lineItem	in the cart to this intention
  const cartLineKeys = cartLines.map(line => line.lineItemKey);
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
    console.error('Error updating line items after making payment intent: ', error);
    return res.status(500).send('Error updating line items after making payment intent: ' + error);
  }



  // Make duplicate lineItems for orders sent to multiple addresses
  for (const addressState of addressesState) {
    console.log(`addressState`);
    console.dir(addressState, { depth: null, colors: true });

    // If addresses is null, the address will be set later
    if (addressState.addresses === null) { continue; }

    const lineItemKeys = [addressState.lineItemKey]

    query = `
      INSERT INTO lineItem (productKey, customerKey, purchaseKey, addedAt, unitPrice, taxRate)
      SELECT productKey, customerKey, purchaseKey, addedAt, unitPrice, taxRate
      FROM lineItem
      WHERE lineItemKey = ?`;

    const values = [addressState.lineItemKey];

    // We already have one copy, so start loop counter at 1
    const copiesNeeded = addressState.addresses.length;
    console.log(`copiesNeeded: ${copiesNeeded}`);
    console.log(`query: ${query}`);

    for(let duplicateLoop = 1; duplicateLoop < copiesNeeded; duplicateLoop++) {
      try {
        const [results] = await pool.query(query, values);
        lineItemKeys.push(results.insertId);
        console.log(`lineItemKeys: ${lineItemKeys}`);
      } catch (error) {
        console.error('Error in duplicating line item:', error);
        throw error;
      }
    }

    if(lineItemKeys.length !== copiesNeeded) {
      console.error(`Error in number of duplicated line items. lineItemKeys.length: ${lineItemKeys.length}, copiesNeeded: ${copiesNeeded}`);
      return;
    }

    const addresses = await GetAddressesFromCustomerKey(customerKey);

    for (const [index, lineItemAddress] of addressState.addresses.entries()) {
      const addressKey = lineItemAddress.addressKey;
      const quantity = lineItemAddress.quantity;
      const address = addresses.find(ad => {return ad.addressKey === addressKey});

      query = `
        UPDATE lineItem
        SET addressKey = ?, quantity = ?, firstName = ?, lastName = ?, postalCode = ?, prefCode = ?, pref = ?, city = ?, ward = ?, address2 = ?, phoneNumber = ?
        WHERE lineItemKey = ?`;
      const values = [addressKey, quantity, address.firstName, address.lastName, address.postalCode, address.prefCode, address.pref, address.city, address.ward, address.address2, address.phoneNumber, lineItemKeys[index]];

      try {
        await pool.query(query, values);
      } catch (error) {
        console.error('Error populating duplicated line item:', error);
        throw error;
      }
    }
  }

  return res.send({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
});


app.post("/verifyPayment", async (req, res) => {
  console.log("░▒▓█ Hit verifyPayment. Time: " + CurrentTime());
  console.log(req.body);
  const validation = await ValidatePayload(req.body.data);
  if(validation.valid === false) {
    console.log(`Validation error in createPaymentIntent: ${validation.message}`);
    return res.status(400).send("Validation error");
  }
  const customerKey = validation.customerKey;

  query = `SELECT * FROM customer WHERE customerKey = ?`;
  values = [customerKey];
  const [results] = await pool.query(query, values);

  if (results.length === 0) {
    console.error('Error pulling customer data with key before payment verification. Customer Key: ', customerKey);
    return res.status(500).send('Error pulling customer data with key before payment verification. Customer Key: ' + customerKey);
  }

  const customer = results[0];

  // This is the address key to use for line items that don't have a line-item level address specified
  const addressKey = parseInt(req.body.data.addressKey);
  if(isNaN(addressKey)) { return res.status(400).send('addressKey must be a valid integer'); }

  // Pick the address with the key specified OR the default OR anything else
  query = `
    SELECT * FROM address 
    WHERE customerKey = ?
    ORDER BY
      (addressKey = ?) DESC,
      defaultAddress DESC`;
    //LIMIT 1`;
  values = [customerKey, addressKey];

  const [addresses] = await pool.query(query, values);

  // If no results, there are no addresses for this user
  if (addresses.length === 0) {
    console.log("Thrown out at addressResults.length === 0");
    console.log("Query:")
    console.log(query)
    console.log("values:")
    console.log(values)
    return res.status(500).send('Error pulling customer addresses. Address Key: ' + addressKey);
  }

  // Address data exists, use the top result
  // This address will only be used if the line item doesn't contain any address data
  const defaultAddress = addresses[0];


  // Validate the email
  const email = req.body.data.email;
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if(!regex.test(email)) { return res.status(400).send('Malformed email address'); }



  // I used their token to validate, not using this secret
  const {paymentIntentId, paymentIntentClientSecret } = req.body.data;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if(!paymentIntent) { return res.status(400).send('Payment intent not found.'); }

  const paymentStatus = paymentIntent.status;
  console.log("paymentIntent");
  console.log(paymentIntent);

  if (paymentStatus === 'succeeded' || paymentStatus === 'created') {
    query = `
      UPDATE purchase 
      SET status = ?, email = ?, purchaseTime = CURRENT_TIMESTAMP
      WHERE paymentIntentId = ? AND status != ?`;
    values = [paymentStatus, email, paymentIntentId, paymentStatus];

    try {
      const [verifyPaymentResults] = await pool.query(query, values);
      console.log("verifyPayment results");
      console.log(verifyPaymentResults);

      //Send order details to Azure
      if(paymentStatus === 'succeeded' && verifyPaymentResults.affectedRows > 0) {
        query = `SELECT * FROM product`;
        const [products] = await pool.query(query);

        // If no results, no products found
        if (products.length === 0) {
          console.log("Thrown out at productResults.length === 0");
          return null; // TODO throw an error
        }

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

        query = `
          SELECT * FROM lineItem 
          WHERE purchaseKey = ?`;
        values = [purchase.purchaseKey];

        const [lineItemResults] = await pool.query(query, values);

        // If no results, the purchase isn't found
        if (lineItemResults.length === 0) {
          console.log("Thrown out at lineItemResults.length === 0");
          console.log(`purchase.purchaseKey: ${purchase.purchaseKey}`);
          return null; // TODO throw an error
        }

        // Filter out line items that need their address updated
        const noAddressLineItems = lineItemResults.filter(lineItem => lineItem.addressKey === null);
        console.log("noAddressLineItems")
        console.dir(noAddressLineItems, { depth: null, colors: true });


        for (const lineItem of noAddressLineItems) {
          query = `
            UPDATE lineItem
            SET addressKey = ?, firstName = ?, lastName = ?, postalCode = ?, prefCode = ?, pref = ?, city = ?, ward = ?, address2 = ?, phoneNumber = ?
            WHERE lineItemKey = ?`;

          values = [defaultAddress.addressKey, defaultAddress.firstName, defaultAddress.lastName, defaultAddress.postalCode, defaultAddress.prefCode, defaultAddress.pref, defaultAddress.city, defaultAddress.ward, defaultAddress.address2, defaultAddress.phoneNumber, lineItem.lineItemKey];

          try {
              await pool.query(query, values);
              console.log(`Updated line item ${lineItem.lineItemKey} with default address.`);
          } catch (error) {
              console.error(`Error updating line item ${lineItem.lineItemKey}:`, error);
              // Handle error appropriately (e.g., continue, throw, etc.)
          }
        }

        query = `
          SELECT * FROM lineItem 
          WHERE purchaseKey = ?`;
        values = [purchase.purchaseKey];

        const [lineItemUpdatedResults] = await pool.query(query, values);

        console.log("lineItemUpdatedResults");
        console.log(lineItemUpdatedResults);
        console.log("products");
        console.log(products);

        // TODO good place to send an email that this purchase was made.
        // use email, lineItemUpdatedResults, and products


        const orderDetails = lineItemUpdatedResults.map(lineItem => {
          const product = products.find(product => {return lineItem.productKey === product.productKey});
          return({
            "chumon_meisai_no": lineItem.lineItemKey,
            "shohin_code": product?.id,
            "shohin_name": product?.title,
            "suryo": lineItem.quantity,
            //"tanka": Number(lineItem.unitPrice),
            "tanka": Math.round(Number(lineItem.unitPrice) * (1+Number(lineItem.taxRate))),
            "kingaku": Math.round(Number(lineItem.unitPrice) * (1+Number(lineItem.taxRate))),
            "soryo": 0,
            "zei_ritsu": Number(lineItem.taxRate) * 100,
            "gokei_kingaku": Math.round(Number(lineItem.unitPrice) * (1+Number(lineItem.taxRate)) * lineItem.quantity)
          })
        });

        console.log("orderDetails");
        console.dir(orderDetails, { depth: null, colors: true });


        
        const uniqueAddressKeysSet = new Set();
        for (const item of lineItemUpdatedResults) {
          uniqueAddressKeysSet.add(item.addressKey);
        }
        const uniqueAddressKeys = Array.from(uniqueAddressKeysSet);
        console.log("uniqueAddressKeys");
        console.dir(uniqueAddressKeys, { depth: null, colors: true });

        //haiso
        const delivery = uniqueAddressKeys.map(addressKey => {
          const address = addresses.find(ad => {return ad.addressKey === addressKey});
          const lineItems = lineItemUpdatedResults.filter(lineItem => {return lineItem.addressKey === addressKey})

          //haiso_meisai
          const deliveryDetails = lineItems.map(lineItem => {
            const product = products.find(product => {return lineItem.productKey === product.productKey});
            return {
              "haiso_meisai_no": lineItem.lineItemKey, // must be a number
              "shohin_code": product?.id,
              "shohin_name": product?.title,
              "suryo": lineItem.quantity,
              "chumon_meisai_no": lineItem.lineItemKey  
            }
          });

          return {
            "shuka_date": formatDate(purchase.purchaseTime),
            "haiso_name": `${address.lastName} ${address.firstName}`,
            "haiso_post_code": address.postalCode,
            "haiso_pref_code": address.prefCode,
            "haiso_pref": address.pref,
            "haiso_city": address.city,
            "haiso_address1": address.ward,
            "haiso_address2": address.address2,
            "haiso_renrakusaki": `${address.phoneNumber.replace(/\D/g, '')}`,
            "haiso_meisai": deliveryDetails
          }
        })

        console.log("delivery");
        console.dir(delivery, { depth: null, colors: true });

        /*
        const shippingDetails = lineItemUpdatedResults.map(lineItem => {
          const product = products.find(product => {return lineItem.productKey === product.productKey});
          return ({
            "haiso_meisai_no": 12, // must be a number
            "shohin_code": product?.id,
            "shohin_name": product?.title,
            "suryo": lineItem.quantity,
            "chumon_meisai_no": lineItem.lineItemKey
          })
        })
        */

        const backupData = {
          "chumon_no": "NVP-" + purchase.purchaseKey,
          "chumon_no2": "NVP-" + purchase.purchaseKey,
          "chumon_date": formatDate(purchase.purchaseTime),
          "konyu_name": `${customer.lastName} ${customer.firstName}`,
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
          "chumon_meisai": orderDetails,
          "haiso": delivery
        }
        console.log("backupData (for order)");
        console.dir(backupData, { depth: null });
        const backupResults = await StoreBackupData("chumon_renkei_api", backupData);
        console.log("backupResults");
        console.log(backupResults);

        const backupDataJSON = JSON.stringify(backupData);
        query = "UPDATE purchase SET newPurchaseJson = ? WHERE paymentIntentId = ?;";
        try {
          await pool.query(query, [backupDataJSON, paymentIntentId]);
        } catch (error) {
          console.log("Error while updating newPurchaseJson:");
          console.dir(error, { depth: null, colors: true });
        }

      } // Only runs on "succeeded"
    } catch (error) {
      console.error('Error updating payment: ', error);
      return res.status(500).send('Error updating payment: ' + error);
    }
  }

  // Pull customer's cart
  const cartData = await GetCartDataFromCustomerKey(customerKey);
  customer.cart = { lines: cartData };

  // Pull customer's purchases
  const purchases = await GetPurchasesFromCustomerKey(customerKey);
  customer.purchases = purchases;

  // Attach customer's addresses
  // We already pulled addresses
  //const addresses = await GetAddressesFromCustomerKey(customerKey);
  customer.addresses = addresses;

  // Remove sensitive data before sending the customer object
  delete customer.password_hash;

  return res.json({customerData: customer, paymentStatus: paymentStatus});
});
//#endregion Stripe

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

  return `${year}年${month}月${day}日`;
}

app.post('/1.1/wf/update_fulfillment', async (req, res) => {
  console.log("░▒▓█ Hit 1.1/wf/update_fulfillment. Time: " + CurrentTime());
  console.log("req.body:");
  console.dir(req.body, { depth: null, colors: true });
  console.log("req.headers:");
  console.dir(req.headers, { depth: null, colors: true });
  let query, values; // For MySQL

  //#region Validate inputs
  const purchaseKey = parseInt(req.body.chumon_no.replace(/\D/g, ''));
  if(isNaN(purchaseKey)) {
    return res.status(400).send('Bad Request: Could not parse numeric purchaseKey');
  }

  let inputCount = 0;

  const purchaseDetails = req.body.chumon_meisai;
  if(purchaseDetails === null) {
    return res.status(400).send('Bad Request: null chumon_meisai (purchaseDetails)');
  }
  if(typeof purchaseDetails !== "object") {
    return res.status(400).send('Bad Request: non-object chumon_meisai (purchaseDetails)');
  }

  const shippingDetails = req.body.haiso_meisai;
  if(shippingDetails === null) {
    return res.status(400).send('Bad Request: null haiso_meisai (shippingDetails)');
  }
  if(typeof shippingDetails !== "object") {
    return res.status(400).send('Bad Request: non-object haiso_meisai (shippingDetails)');
  }
  const shippedLineItemKeys = shippingDetails.map(shippingDetail => {return parseInt(shippingDetail.haiso_meisai_no)});
  const purchasedLineItemKeys = purchaseDetails.map(purchaseDetail => {return parseInt(purchaseDetail.chumon_meisai_no)});
  const allLineItemKeys = [...shippedLineItemKeys, ...purchasedLineItemKeys];
  if(allLineItemKeys.length === 0) {
    return res.status(400).send('Bad Request: no items sent');
  }
  //#endregion


  /*
  //#region Count the number of lineItems covered by shipping status update using haiso_meisai_no
  query = `
    SELECT * FROM lineItem 
    WHERE lineItemKey IN (?)`;
  values = [allLineItemKeys];

  try {
    const [result] = await pool.query(query, values);
    if(result.length === 0) {
      const returnPayload = {
        "status": "error",
        "statusCode": 404,
        "Messages": "注文情報が見つかりませんでした (haiso_meisai_no)"
      }
    
      return res.status(404).send(returnPayload);  
    }
  } catch (error) {
    res.status(500).send('Error finding unshipped line items');
  }
  //#endregion
  */


  //#region Count the number of lineItems covered by shipping status update using haiso_meisai_no and purchaseKey
  query = `
    SELECT * FROM lineItem 
    WHERE purchaseKey = ? AND lineItemKey IN (?)`;
  values = [purchaseKey, shippedLineItemKeys];

  try {
    const [result] = await pool.query(query, values);
    if(result.length === 0) {
      const returnPayload = {
        "status": "error",
        "statusCode": 404,
        "Messages": "注文情報が見つかりませんでした (chumon_no)"
      }
    
      return res.status(404).send(returnPayload);  
    }
  } catch (error) {
    res.status(500).send('Error finding unshipped line items');
  }
  //#endregion


  //#region Actually update lineItems with "shipped" status
  query = `
    UPDATE lineItem 
    SET shippingStatus = ? 
    WHERE purchaseKey = ? AND lineItemKey IN (?) AND (shippingStatus != ? OR shippingStatus IS NULL)`;
  values = ['shipped', purchaseKey, shippedLineItemKeys, 'shipped'];

  try{
    const [result] = await pool.query(query, values);
    console.log("Query:", query);
    console.log("Values:", values);
    console.log("result:");
    console.dir(result, { depth: null, colors: true });
    if(result.affectedRows === 0) {
      const returnPayload = {
        "status": "error",
        "statusCode": 422,
        "Messages": "すでに発送した商品です"
      }
    
      return res.status(422).send(returnPayload);  
    }
  } catch (error) {
    console.error('Error updating shipping status: ', error);
    return res.status(500).send('Error updating shipping status: ' + error);
  }
  //#endregion

  const fulfillmentId = `${shippedLineItemKeys.join('-')}_${NoPunctuationDateTime()}`;

  const returnPayload = {
    "status": "success",
    "statusCode": 200,
    "response": {
      "fulfillmentId": fulfillmentId,
      "fulfillmentStatus": "success"
    }
  }
  console.log("returnPayload:");
  console.dir(returnPayload, { depth: null, colors: true });

  return res.status(200).send(returnPayload);
});




// Validates a user with either customerKey+token, or customerKey+email+password
async function ValidatePayload(payload) {

  // Check for required inputs
  if(!payload) { return {valid: false, message: "No payload"};}
  if(!payload.customerKey) { return {valid: false, message: "No customer Key"};}
  const customerKey = Number(payload.customerKey)
  if(!customerKey) { return {valid: false, message: "Malformed customer Key"};}


  // Validate with token
  if(payload.token) {
    const token = payload.token
    const hexRegex = /^[0-9a-f]{96}$/i;
    if(!hexRegex.test(token)) { return {valid: false, message: "Malformed token"};}

    query = `SELECT * FROM customer WHERE token = ? AND customerKey = ?`;
    const [results] = await pool.query(query, [token, customerKey]);
    if (results.length === 0) { return {valid: false, message: "Token not found"};}

    return {valid: true, message: "Valid token", customerKey: customerKey};
  }


  // Validate with email / password
  if(payload.email && payload.password) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(payload.email)) { return {valid: false, message: "Malformed email"};}
    const email = payload.email;

    const passwordRegex = /^[\x20-\x7E]{8,}$/;
    if(!passwordRegex.test(payload.password)) { return {valid: false, message: "Malformed password"};}
    const password = payload.password;

    let query = `SELECT * FROM customer WHERE email = ?`;
    const [results] = await pool.query(query, [email]);
    if (results.length === 0) { return {valid: false, message: "Email / Password incorrect"};}

    const [customer] = results;
    const match = await bcrypt.compare(password, customer.passwordHash);
    if (!match) { return {valid: false, message: "Email / Password incorrect"};}

    return {valid: true, message: "Valid email / password", customerKey: customerKey};
  }

  return {valid: false, message: "Validation data not found"};
}

function NoPunctuationDateTime() {
  const now = new Date();
  const formattedDateTime = (
    now.getFullYear().toString() + 
    (now.getMonth() + 1).toString().padStart(2, '0') + // +1 because getMonth() returns 0-11
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0'));
  return formattedDateTime;
}

app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    return res.status(500).send('Something broke! Time: ' + CurrentTime());
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
  //process.exit(1);
});

process.on('exit', (code) => {
  console.log(`[${new Date().toISOString()}] Process exit with code: ${code}`);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => { console.log(`Server started on ${PORT} at ${CurrentTime()}`); });
