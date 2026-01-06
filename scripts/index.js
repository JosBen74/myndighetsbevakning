#!/usr/bin/env node
require('dotenv').config();
const readline = require('readline');
const { buildWorkflowFromText } = require('./src/generator');
const n8n = require('./src/n8n_client');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const doExport = args.includes('export');

  const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout,
    terminal: true
  });

  function question(q) {
    return new Promise((res) => {
      rl.question(q, (a) => {
        res(a);
      });
    });
  }

  let freeText = await question('Skriv ditt fritext-behov (på svenska går bra): ');
  rl.close();
  
  // Fallback if empty
  if (!freeText || !freeText.trim()) {
    freeText = 'Skapa ett workflow som hämtar och loggar data';
  }

  console.log('Genererar workflow från text...');
  const { workflow, path: outPath } = await buildWorkflowFromText(freeText);
  console.log(`Sparade genererat workflow till: ${outPath}`);

  if (doExport) {
    console.log('Försöker exportera workflow till n8n Cloud...');
    const res = await n8n.exportWorkflow(workflow);
    console.log('Export-resultat:', res);

    if (res && res.data && (res.data.id || res.data.workflowId)) {
      const workflowId = res.data.id || res.data.workflowId;
      console.log('Triggerar workflow:', workflowId);
      const run = await n8n.triggerWorkflow(workflowId, { demo: true });
      console.log('Trigger-resultat:', run);
    } else if (res.simulated) {
      console.log('Export simulerad. Triggerar lokalt simulerad körning...');
      const run = await n8n.triggerWorkflow('simulated-1', { demo: true });
      console.log('Simulerat resultat:', run);
    } else {
      console.log('Kunde inte avgöra workflow-id från export-respons. Se full respons ovan.');
    }
  } else {
    console.log('Export hoppad — kör i lokal mock-läge. Kör `npm run export` för att försöka mot n8n Cloud.');
  }
}

main().catch((err) => {
  console.error('Fel:', err && err.stack ? err.stack : err);
  process.exit(1);
});
