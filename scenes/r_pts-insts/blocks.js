import { $, $$, createEl, Arr, rand, px, map } from '/lib/utils';
import './BlockList.pcss';

const { innerWidth: W, innerHeight: H,
  document,
  IntersectionObserver,
} = window;


const $doc = document.documentElement;
const $root = document.body;


const blocks = [];
const observer = new IntersectionObserver(onObserve, {});
function onObserve (entries) {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      const i = blocks.indexOf(entry.target);
      if (~i) blocks.splice(i, 1);
      return;
    }

    blocks.push(entry.target);
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

export default blocks;