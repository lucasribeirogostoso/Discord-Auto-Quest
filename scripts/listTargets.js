#!/usr/bin/env node

const CDP = require('chrome-remote-interface');
const tcpPortUsed = require('tcp-port-used');

const PORT = 9223;

(async () => {
  const inUse = await tcpPortUsed.check(PORT, '127.0.0.1');
  if (!inUse) {
    console.error(
      `Port ${PORT} is not open. Discord is not running with --remote-debugging-port=${PORT}.`
    );
    process.exit(1);
  }

  const targets = await CDP.List({ port: PORT });
  if (!targets.length) {
    console.log('No DevTools targets found.');
    process.exit(0);
  }

  console.log('Targets found:');
  targets.forEach((target, idx) => {
    console.log(`\n[${idx}]`);
    console.log(`  type: ${target.type}`);
    console.log(`  url : ${target.url}`);
    console.log(`  title: ${target.title}`);
    console.log(`  id  : ${target.id}`);
  });
})().catch((error) => {
  console.error('Error listing targets:', error.message || error);
  process.exit(1);
});

