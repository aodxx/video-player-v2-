import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { ACCOUNT_ARTWORK, getAccountArtwork } from '../src/account-art.js';

const expectedArtwork = {
  SoMay: 'src/assets/accounts/so-may.webp',
  Rewaida: 'src/assets/accounts/rewaida.webp',
  'Rabbit Rayong': 'src/assets/accounts/rabbit-rayong.webp',
  Subhash: 'src/assets/accounts/subhash.webp',
  Lietongheng: 'src/assets/accounts/lietongheng.webp',
  NNNKII88: 'src/assets/accounts/nnnkii88.webp',
  Deepak: 'src/assets/accounts/deepak.webp',
  'Thanh Do': 'src/assets/accounts/thanh-do.webp',
  Ginan: 'src/assets/accounts/ginan.webp',
  Reno16Promax1: 'src/assets/accounts/reno16promax1.jpg',
  Dedprajamsoy: 'src/assets/accounts/dedprajamsoy.jpg',
  'Ana Lopez': 'src/assets/accounts/ana-lopez.webp',
  'Jean Lajemo': 'src/assets/accounts/jean-lajemo.webp',
  'ลับเด็ด 18+': 'src/assets/accounts/joupze.jpg',
  'หลุดจากเทพ 🔱🔞': 'src/assets/accounts/hludcaktheph.webp'
};

test('maps every video account to a distinct local artwork asset', async () => {
  assert.deepEqual(ACCOUNT_ARTWORK, expectedArtwork);
  assert.equal(new Set(Object.values(ACCOUNT_ARTWORK)).size, 15);
  for (const [source, path] of Object.entries(expectedArtwork)) {
    assert.equal(getAccountArtwork(source), path);
    await access(new URL(`../${path}`, import.meta.url));
  }
});

test('returns null for sources without account artwork', () => {
  assert.equal(getAccountArtwork('unknown-account'), null);
  assert.equal(getAccountArtwork('__proto__'), null);
  assert.equal(getAccountArtwork('constructor'), null);
  assert.equal(getAccountArtwork('toString'), null);
});
