const fetch = require('node-fetch');

async function testFlow() {
  const registerQuery = `mutation {
    register(
      name: "Test Provider 2",
      email: "testprovider_${Date.now()}@test.com",
      password: "password123",
      role: PROVIDER,
      providerDetails: {
        businessName: "Test Business",
        description: "Test Desc",
        category: "TestCategory",
        address: "123 Test St",
        phone: "1234567890",
        coordinates: [0, 0]
      }
    ) {
      accessToken
    }
  }`;

  const regRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: registerQuery })
  });
  const regData = await regRes.json();
  const token = regData.data.register.accessToken;

  const planQuery = `mutation {
    selectSubscriptionPlan(plan: "MONTHLY") {
      id
      subscriptionStatus
    }
  }`;

  await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ query: planQuery })
  });

  const paymentQuery = `mutation {
    processPayment(method: "card") {
      id
      subscriptionStatus
    }
  }`;

  console.log('Processing payment...');
  const payRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ query: paymentQuery })
  });
  const payData = await payRes.json();
  console.log('Result:', JSON.stringify(payData, null, 2));
}

testFlow().catch(console.error);
