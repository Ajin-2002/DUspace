import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateZip } from './zip-processor';

test('validateZip rejects non-zip files', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zip-processor-'));
  const filePath = path.join(tempDir, 'not-a-zip.bin');
  await fs.writeFile(filePath, 'hello world');

  const result = await validateZip(filePath);

  assert.equal(result.isValid, false);
  assert.match(result.error ?? '', /Invalid ZIP file format|ZIP validation failed/);

  await fs.rm(tempDir, { recursive: true, force: true });
});

test('validateZip accepts a basic ZIP signature', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zip-processor-'));
  const filePath = path.join(tempDir, 'sample.zip');
  await fs.writeFile(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04]));

  const result = await validateZip(filePath);

  assert.equal(result.isValid, true);
  assert.equal(result.totalSize, 4);

  await fs.rm(tempDir, { recursive: true, force: true });
});
