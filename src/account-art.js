export const ACCOUNT_ARTWORK = Object.freeze({
  SoMay: 'src/assets/accounts/so-may.webp',
  Rewaida: 'src/assets/accounts/rewaida.webp',
  'Rabbit Rayong': 'src/assets/accounts/rabbit-rayong.webp',
  Subhash: 'src/assets/accounts/subhash.webp',
  Lietongheng: 'src/assets/accounts/lietongheng.webp',
  NNNKII88: 'src/assets/accounts/nnnkii88.webp',
  Deepak: 'src/assets/accounts/deepak.webp',
  'Thanh Do': 'src/assets/accounts/thanh-do.webp',
  Ginan: 'src/assets/accounts/ginan.webp'
});

export function getAccountArtwork(source) {
  return ACCOUNT_ARTWORK[source] || null;
}
