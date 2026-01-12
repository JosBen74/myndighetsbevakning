const fs = require('fs');
const path = require('path');

const N8N_BASE_URL = 'https://josben.app.n8n.cloud';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYjIwM2JlNS1lMDg4LTQzZjctOGQ2NC1jYTIyZDEwNTkwYTgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0Nzc5NDE4fQ.5osBCMXSggpcicoiv1HluEkeWX2xcVFbXA7nhml7LXA';

const workflowsDir = path.join(__dirname, '..', 'workflows');

const workflowsToUpdate = [
  'citat-via-gmail.json',
  'myndighetsbevakning-curated-gmail.json'
];

async function getExistingWorkflows() {
  const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY }
  });
  if (!response.ok) throw new Error(`Failed to fetch workflows: ${response.status}`);
  return (await response.json()).data || [];
}

async function updateOrCreateWorkflow(filePath, existingWorkflows) {
  const fileName = path.basename(filePath);
  console.log(`\nProcessing ${fileName}...`);

  const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const workflowName = workflowData.name;

  // Find existing workflow by name
  const existing = existingWorkflows.find(w => w.name === workflowName);

  if (existing) {
    // Update existing workflow
    console.log(`  Found existing workflow (ID: ${existing.id}), updating...`);

    // Remove read-only fields before update
    const updateData = { ...workflowData };
    delete updateData.active;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${existing.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update failed: ${response.status} - ${errorText}`);
    }

    console.log(`  Updated: ${workflowName}`);
    return { action: 'updated', id: existing.id };

  } else {
    // Create new workflow
    console.log(`  Workflow not found, creating new...`);

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
      throw new Error(`Create failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`  Created: ${workflowName} (ID: ${result.id})`);
    return { action: 'created', id: result.id };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Updating Corrected Workflows');
  console.log('='.repeat(60));

  try {
    console.log('\nFetching existing workflows from n8n...');
    const existingWorkflows = await getExistingWorkflows();
    console.log(`Found ${existingWorkflows.length} existing workflows`);

    for (const fileName of workflowsToUpdate) {
      const filePath = path.join(workflowsDir, fileName);

      if (!fs.existsSync(filePath)) {
        console.log(`\nSkipping ${fileName} - file not found`);
        continue;
      }

      try {
        await updateOrCreateWorkflow(filePath, existingWorkflows);
      } catch (error) {
        console.error(`  Error: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('Done!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
