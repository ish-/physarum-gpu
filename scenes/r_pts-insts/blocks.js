import { $, $$, createEl, Arr, rand, px, map, debounce } from '/lib/utils';
import './BlockList.pcss';

const { innerWidth: W, innerHeight: H,
  document,
  IntersectionObserver,
  Map,
} = window;
const $root = document.body;

// export const blocks = new Map();
export const blocks = new Set();
const observer = new IntersectionObserver(onObserve, {});
function onObserve (entries) {
  entries.forEach(entry => {
    const { target: $el } = entry;
    if (!entry.isIntersecting)
      return blocks.delete($el);

    blocks.add($el);
  });
}

const p = 20;
const $cont = createEl({ className: 'BlockList' },
  Arr(30).map((_, i) => {
    const top = i * 600 + rand.int(-150, 150);
    const left = Math.max(p, W / 4 + rand.int(-W / 3, W / 3));
    const width = rand.int(30, W - left - p);
    const height = rand.int(30, H);

    const $block = createEl({
      className: 'Block',
      style: map({ top, left, width, height }, px),
    });

    observer.observe($block);
    return $block;
  }),
);

$root.append($cont);

export let scroll = $cont.scrollTop;
$cont.addEventListener('scroll', e => {
  const { scrollTop } = $cont;
  const delta = scrollTop - scroll;
  scroll = scrollTop;
});

export const initBlockDim = [-9999,-9999,0,0];