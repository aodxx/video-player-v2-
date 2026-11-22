export const ACCOUNT_ARTWORK = Object.freeze({
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
  Yesyesn2m7: 'src/assets/accounts/yesyesn2m7.jpg'
});

export const ACCOUNT_AVATARS = Object.freeze({
  Songruhee23: 'src/assets/accounts/songruhee23-avatar.webp',
  AmySchkade: 'src/assets/accounts/amyschkade-avatar.webp'
});

export function getAccountAvatar(source) {
  return Object.hasOwn(ACCOUNT_AVATARS, source) ? ACCOUNT_AVATARS[source] : null;
}

export function getAccountArtwork(source) {
  return Object.hasOwn(ACCOUNT_ARTWORK, source) ? ACCOUNT_ARTWORK[source] : null;
}
