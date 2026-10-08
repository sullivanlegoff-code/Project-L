import type {SpeciesId} from '../config/balance';
export interface Coat {
  body: string; patch: string;
  lop?: boolean; wings?: boolean; flame?: boolean; metal?: boolean; glasses?: boolean; plumage?: boolean; frost?: boolean;
}
export const COATS: Record<SpeciesId, Coat> = {
  paille: {body: '#ead4aa', patch: '#dcc08c'}, neige: {body: '#fffaf0', patch: '#e4eeee'},
  terre: {body: '#80604d', patch: '#a88766'}, brumelin: {body: '#ead4aa', patch: '#f8ffff'}, mottelin: {body: '#ead4aa', patch: '#876348'},
  feu: {body: '#efb47d', patch: '#e98d71', flame: true},
  'belier-gris': {body: '#aeb5c1', patch: '#dce1e6', lop: true, metal: true},
  volant: {body: '#d1d2ee', patch: '#f9f4e2', wings: true},
  lunettes: {body: '#d5c6ab', patch: '#b2b9c8', glasses: true},
  perroquet: {body: '#99cbb8', patch: '#f0bc76', wings: true, plumage: true},
  'feu-glace': {body: '#efb47d', patch: '#a0d4e7', flame: true, frost: true},
};
export function portrait(species?: SpeciesId): string {
  const c: Coat = species ? COATS[species] : {body: '#b6c3b1', patch: '#b6c3b1'};
  const wings = c.wings ? `<g fill="${c.plumage ? '#86b9d0' : '#fff9ee'}" stroke="#8b9cb4" stroke-width="2"><path d="M35 69Q9 69 5 47Q16 37 29 50L42 68Z"/><path d="M82 65Q106 36 116 47Q115 68 91 77Z"/><path d="M15 48l14 16m74-15L88 65" fill="none"/></g>` : '';
  const ears = c.lop ? `<ellipse cx="31" cy="54" rx="11" ry="27" transform="rotate(18 31 54)" fill="${c.body}"/><ellipse cx="88" cy="54" rx="11" ry="27" transform="rotate(-18 88 54)" fill="${c.body}"/>` : `<ellipse cx="43" cy="33" rx="10" ry="27" transform="rotate(-13 43 33)" fill="${c.body}"/><ellipse cx="71" cy="31" rx="10" ry="27" transform="rotate(12 71 31)" fill="${c.frost ? c.patch : c.body}"/><ellipse cx="43" cy="30" rx="4" ry="17" fill="#dab5ac"/><ellipse cx="71" cy="28" rx="4" ry="17" fill="#dab5ac"/>`;
  return `<svg viewBox="0 0 120 110" aria-hidden="true"><ellipse cx="61" cy="94" rx="38" ry="7" fill="#587454" opacity=".13"/>${wings}<ellipse cx="59" cy="71" rx="34" ry="26" fill="${c.body}"/>${ears}<circle cx="60" cy="58" r="26" fill="${c.body}"/><ellipse cx="76" cy="68" rx="12" ry="15" fill="${c.patch}"/><circle cx="91" cy="76" r="9" fill="${c.body}"/>${species ? '<circle cx="49" cy="55" r="3" fill="#3f3731"/><circle cx="68" cy="55" r="3" fill="#3f3731"/><path d="M55 66 L62 66 L59 70 Z" fill="#c78688"/>' : '<text x="60" y="75" font-size="33" text-anchor="middle" fill="#52624e">?</text>'}${species === 'brumelin' ? '<path d="M84 31v16m-8-8h16m-14-6 12 12m0-12L78 45" stroke="#fff" stroke-width="3"/>' : species === 'mottelin' ? '<path d="M83 31q15-13 11 1q-3 8-11 6" fill="#8f9d63"/>' : ''}${c.flame ? '<path d="M58 48Q40 43 54 27Q52 36 59 35Q64 29 63 23Q78 42 58 48Z" fill="#da8469"/><path d="M58 44Q51 41 59 34Q66 43 58 44" fill="#ffe1a3"/>' : ''}${c.glasses ? '<g stroke="#555b70" stroke-width="3.5" fill="none"><circle cx="49" cy="55" r="10"/><circle cx="70" cy="55" r="10"/><path d="M59 54h2M39 51l-7-4m48 4 7-4"/></g>' : ''}${c.metal ? '<path d="m79 73 7-7 7 7-7 7Z" fill="#eef3f8" stroke="#6e7a91" stroke-width="2"/>' : ''}${c.plumage ? '<path d="M55 40Q42 25 48 22Q60 22 63 40" fill="#edc87d"/><path d="M62 40Q60 22 67 23Q74 31 68 42" fill="#d98e81"/>' : ''}${c.frost ? '<path d="M82 27v19m-9-9h18m-16-7 14 14m0-14L75 44" stroke="#eafdff" stroke-width="3"/>' : ''}</svg>`;
}
