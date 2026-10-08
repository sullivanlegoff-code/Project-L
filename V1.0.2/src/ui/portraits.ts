import type {SpeciesId} from '../config/balance';
export const COATS: Record<SpeciesId, {body: string; patch: string}> = {
  paille: {body: '#ead4aa', patch: '#dcc08c'}, neige: {body: '#fffaf0', patch: '#e4eeee'},
  terre: {body: '#80604d', patch: '#a88766'}, brumelin: {body: '#ead4aa', patch: '#f8ffff'}, mottelin: {body: '#ead4aa', patch: '#876348'},
};
export function portrait(species?: SpeciesId): string {
  const c = species ? COATS[species] : {body: '#b6c3b1', patch: '#b6c3b1'};
  return `<svg viewBox="0 0 120 110" aria-hidden="true"><ellipse cx="61" cy="94" rx="38" ry="7" fill="#587454" opacity=".13"/><ellipse cx="59" cy="71" rx="34" ry="26" fill="${c.body}"/><ellipse cx="43" cy="33" rx="10" ry="27" transform="rotate(-13 43 33)" fill="${c.body}"/><ellipse cx="71" cy="31" rx="10" ry="27" transform="rotate(12 71 31)" fill="${c.body}"/><ellipse cx="43" cy="30" rx="4" ry="17" fill="#dab5ac"/><ellipse cx="71" cy="28" rx="4" ry="17" fill="#dab5ac"/><circle cx="60" cy="58" r="26" fill="${c.body}"/><ellipse cx="76" cy="68" rx="12" ry="15" fill="${c.patch}"/><circle cx="91" cy="76" r="9" fill="${c.body}"/>${species ? '<circle cx="49" cy="55" r="3" fill="#3f3731"/><circle cx="68" cy="55" r="3" fill="#3f3731"/><path d="M55 66 L62 66 L59 70 Z" fill="#c78688"/>' : '<text x="60" y="75" font-size="33" text-anchor="middle" fill="#52624e">?</text>'}${species === 'brumelin' ? '<path d="M84 31v16m-8-8h16m-14-6 12 12m0-12L78 45" stroke="#fff" stroke-width="3"/>' : species === 'mottelin' ? '<path d="M83 31q15-13 11 1q-3 8-11 6" fill="#8f9d63"/>' : ''}</svg>`;
}
