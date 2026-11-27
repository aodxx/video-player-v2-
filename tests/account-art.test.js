import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import * as accountArt from '../src/account-art.js';
const { ACCOUNT_ARTWORK, getAccountArtwork } = accountArt;

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
  'หลุดจากเทพ 🔱🔞': 'src/assets/accounts/hludcaktheph.webp',
  'ชอบแบบนี้': 'src/assets/accounts/mariana20845787.jpg',
  Kaled46164207: 'src/assets/accounts/kaled46164207.webp',
  Charles74943343: 'src/assets/accounts/charles74943343.webp',
  porpine3344: 'src/assets/accounts/porpine3344.webp',
  Songruhee23: 'src/assets/accounts/songruhee23-cover.webp',
  AmySchkade: 'src/assets/accounts/amyschkade-avatar.webp',
  GalaGGyp: 'src/assets/accounts/galaggyp.jpg',
  Yesyesn2m7: 'src/assets/accounts/yesyesn2m7.jpg',
  Goodwork56: 'src/assets/accounts/goodwork56.jpg',
  Thephphraceaca: 'src/assets/accounts/thephphraceaca.jpg',
  Mnnnnnnnnnn20: 'src/assets/accounts/mnnnnnnnnnn20.jpg',
  'Yes‼️ไม่เลือกหน้า': 'src/assets/accounts/yes-mailuek.jpg',
  Vhcosmetic: 'src/assets/accounts/vhcosmetic.jpg',
  MJN96744: 'src/assets/accounts/mjn96744.jpg',
  LuangKhoNom: 'src/assets/accounts/luang-kho-nom.jpg',
  Cudphakyes: 'src/assets/accounts/cudphakyes.jpg'
};

test('maps configured account artwork to distinct local assets', async () => {
  assert.deepEqual(ACCOUNT_ARTWORK, expectedArtwork);
  assert.equal(new Set(Object.values(ACCOUNT_ARTWORK)).size, 31);
  for (const [source, path] of Object.entries(expectedArtwork)) {
    assert.equal(getAccountArtwork(source), path);
    await access(new URL(`../${path}`, import.meta.url));
  }
});

test('maps the two profile avatars and omits a separate avatar overlay when the avatar is the fallback artwork', async () => {
  assert.equal(typeof accountArt.getAccountAvatar, 'function');
  if (typeof accountArt.getAccountAvatar !== 'function') return;

  const expectedAvatars = {
    Songruhee23: 'src/assets/accounts/songruhee23-avatar.webp',
    AmySchkade: 'src/assets/accounts/amyschkade-avatar.webp',
    MJN96744: 'src/assets/accounts/mjn96744.jpg'
  };
  assert.deepEqual(accountArt.ACCOUNT_AVATARS, expectedAvatars);
  for (const [source, path] of Object.entries(expectedAvatars)) {
    assert.equal(accountArt.getAccountAvatar(source), path);
    await access(new URL(`../${path}`, import.meta.url));
  }
  assert.notEqual(getAccountArtwork('Songruhee23'), accountArt.getAccountAvatar('Songruhee23'));
  assert.equal(getAccountArtwork('AmySchkade'), accountArt.getAccountAvatar('AmySchkade'));
});

test('returns null for sources without account artwork', () => {
  assert.equal(getAccountArtwork('Gamemint4210'), null);
  assert.equal(getAccountArtwork('unknown-account'), null);
  assert.equal(getAccountArtwork('__proto__'), null);
  assert.equal(getAccountArtwork('constructor'), null);
  assert.equal(getAccountArtwork('toString'), null);
});
