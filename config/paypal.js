import paypal from '@paypal/checkout-server-sdk';

// Creating an environment
let clientId = process.env.PAYPAL_CLIENT_ID;
let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

let environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
let client = new paypal.core.PayPalHttpClient(environment);

export default client;