const fs = require('fs');
const path = require('path');

const N8N_BASE_URL = 'https://josben.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYjIwM2JlNS1lMDg4LTQzZjctOGQ2NC1jYTIyZDEwNTkwYTgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0Nzc5NDE4fQ.5osBCMXSggpcicoiv1HluEkeWX2xcVFbXA7nhml7LXA';

async function importWorkflow() {
  const filePath = path.join(__dirname, 'workflows', 'category-1-msb-only.json');

  console.log('Importing Category 1 MSB Only workflow...\n');

  try {
    const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(workflowData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Successfully imported: ${workflowData.name}`);
    console.log(`   Workflow ID: ${result.id}`);
    console.log(`   Webhook URL: https://josben.app.n8n.cloud/webhook/category-1-test`);
    console.log(`\n📋 Next step: Test the workflow`);

    return result;

  } catch (error) {
    console.error(`❌ Failed to import:`);
    console.error(`   ${error.message}`);
    return null;
  }
}

importWorkflow().catch(console.error);
