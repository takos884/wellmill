require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();

const SHOPIFY_API_ENDPOINT = 'https://well-mill.myshopify.com/admin/api/2023-10/products.json';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const JSON_FILE_PATH = path.join(__dirname, '../products.json');

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
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(data));
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

app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    res.status(500).send('Something broke!');
});

app.listen(3001, () => {
  const current = new Date();
  const timestamp = `${current.getFullYear()}/${String(current.getMonth() + 1).padStart(2, '0')}/${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}:${String(current.getSeconds()).padStart(2, '0')}`;
  console.log(`Server started on port 3001 at ${timestamp}`);
});
