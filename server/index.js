const express = require('express');
const cors = require('cors');
const { PrimusZKTLS } = require('@primuslabs/zktls-js-sdk');

const app = express();
const port = 9000;

app.use(cors());
app.use(express.json());

// Payment API (e.g. for external calls, DB, etc.)
app.get('/api/payment', (req, res) => {
  res.json({
    id: 'pay_9x7k2m4n1q',
    status: 'succeeded',
    date: new Date().toISOString(),
    amount: 49.99,
    currency: 'USD',
    customer: {
      id: 'cus_a1b2c3d4',
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
    },
    merchant: {
      id: 'merchant_wakame_001',
      name: 'Wakame',
      category: 'Retail',
    },
    description: 'Payment for order #2847',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date().toISOString(),
  });
});

// Sign attestation request (Primus zkTLS)
app.get('/primus/sign', async (req, res) => {
  const appId = "0x5c4b35a78081b25c779575b75c5224aa921771b3";
  const appSecret = "0x2f7356c6b2a653916ca2e9d7798246891781def86376614bf8d4df08155e4399";

  // Create a PrimusZKTLS object.
  const primusZKTLS = new PrimusZKTLS();

  // Set appId and appSecret through the initialization function.
  await primusZKTLS.init(appId, appSecret);

  // Sign the attestation request.
  console.log("signParams=", req.query.signParams);
  const signResult = await primusZKTLS.sign(req.query.signParams);
  console.log("signResult=", signResult);

  // Return signed result.
  res.json({ signResult });
});

app.listen(port, () => {
  console.log(`Server is running at http://0.0.0.0:${port}`);
});
