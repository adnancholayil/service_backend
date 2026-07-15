const fetch = require('node-fetch');
async function test() {
  const query = `mutation {
    selectSubscriptionPlan(plan: "TRIAL") {
      id
    }
  }`;
  try {
    const res = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    console.log(JSON.stringify(data));
  } catch(e) {
    console.error(e);
  }
}
test();
