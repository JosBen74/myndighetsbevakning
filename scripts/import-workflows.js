const fs = require('fs');
const path = require('path');

const N8N_BASE_URL = 'https://josben.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYjIwM2JlNS1lMDg4LTQzZjctOGQ2NC1jYTIyZDEwNTkwYTgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY0Nzc5NDE4fQ.5osBCMXSggpcicoiv1HluEkeWX2xcVFbXA7nhml7LXA';

const workflows = [
  'orchestrator-workflow.json',
  'synthesis-two-stage-workflow.json',
  'category-1-sektorsansvariga-mini.json',
  'category-2-regeringen-placeholder.json',
  'category-3-international-placeholder.json'
];

async function importWorkflow(workflowFile) {
  const filePath = path.join(__dirname, 'workflows', workflowFile);

  console.log(`\nImporting ${workflowFile}...`);

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
    return result;

  } catch (error) {
    console.error(`❌ Failed to import ${workflowFile}:`);
    console.error(`   ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('n8n Workflow Import Script');
  console.log('='.repeat(60));
  console.log(`Base URL: ${N8N_BASE_URL}`);
  console.log(`Total workflows to import: ${workflows.length}`);

  const results = [];

  for (const workflow of workflows) {
    const result = await importWorkflow(workflow);
    results.push({ workflow, success: result !== null, result });

    // Wait a bit between imports to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Import Summary');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}/${workflows.length}`);
  console.log(`❌ Failed: ${failed}/${workflows.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some workflows failed to import.');
    console.log('This may be because:');
    console.log('  1. API key is expired or invalid');
    console.log('  2. Workflows with same name already exist');
    console.log('  3. Network/connectivity issues');
    console.log('\n📖 Please see MANUAL-IMPORT-INSTRUCTIONS.md for manual import steps.');
  } else {
    console.log('\n🎉 All workflows imported successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Configure Gmail credentials in Synthesis workflow');
    console.log('  2. Activate all workflows');
    console.log('  3. Test the system');
    console.log('\n📖 See FAS-1-IMPLEMENTATIONSGUIDE.md for details.');
  }
}

main().catch(console.error);
