const express = require('express');
const cors = require('cors');
const { PrimusZKTLS } = require('@primuslabs/zktls-js-sdk');
const { createWalletClient, http, parseAbi, parseUnits, getAddress } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');

const app = express();
const port = 9000;

// Hardcoded payment API key for /api/payment/complete
const PAYMENT_API_SECRET = '445d36245a17c97c1398b45a002ae7f78c131e62f96a6638941cc83ae0678d69';

// USDC on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const USDC_DECIMALS = 6;
const PAY_AMOUNT_USDC = 2;
const MERCHANT_ADDRESS = '0xf14eeF4ecfDEb52122f0B991C33428927F30B052';

const erc20Abi = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
]);

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

// Pay merchant: send USDC from wallet A to address B (viem), then call payment complete API
app.post('/pay-merchant', async (req, res) => {
  const { reference } = req.body || {};
  const privateKey = process.env.WALLET_PRIVATE_KEY;

  if (!privateKey) {
    return res.status(500).json({ error: 'WALLET_PRIVATE_KEY not configured' });
  }

  try {
    const account = privateKeyToAccount(
      privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
    );
    const walletClient = createWalletClient({
      chain: baseSepolia,
      transport: process.env.RPC_URL ? http(process.env.RPC_URL) : http(),
      account,
    });

    const amountWei = parseUnits(String(PAY_AMOUNT_USDC), USDC_DECIMALS);
    const toAddress = getAddress(MERCHANT_ADDRESS);

    const hash = await walletClient.writeContract({
      address: getAddress(USDC_ADDRESS),
      abi: erc20Abi,
      functionName: 'transfer',
      args: [toAddress, amountWei],
    });

    const ref = reference || `DUR-${Date.now().toString(36).toUpperCase()}-${hash.slice(2, 8)}`;
    const response = await fetch('https://durian-pay.vercel.app/api/payment/complete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYMENT_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: ref,
        tx_hash: hash,
        payer_wallet: account.address,
      }),
    });
    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      return res.status(502).json({
        error: 'Payment complete API error',
        tx_hash: hash,
        paymentCompleteResponse: data,
      });
    }

    res.json({
      success: true,
      tx_hash: hash,
      reference: ref,
      payer_wallet: account.address,
      paymentComplete: data,
    });
  } catch (err) {
    console.error('pay-merchant error', err);
    res.status(500).json({ error: err.message || 'Pay merchant failed' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://0.0.0.0:${port}`);
});
