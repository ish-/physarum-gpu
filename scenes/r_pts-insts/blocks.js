import { $, $$, createEl, Arr, rand, px, map, debounce } from '/lib/utils';
import './BlockList.pcss';

export const MAX_BLOCKS = 10;

const { innerWidth: W, innerHeight: H,
  document,
  IntersectionObserver,
  Map,
} = window;
const $root = document.body;

let LOREM = `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?`;
LOREM += '\n\n' + LOREM + '\n\n' + LOREM;

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

blocks.needRead = true;
blocks.active = true;
blocks.setActive = (bool) => $cont.style.display = (blocks.active = bool) ? '' : 'none';
blocks.setBlur = (v) => {
  $cont.classList.toggle('--blur', v);
  $cont.style.setProperty('--blur', px(v));
};

const p = 20;
const $cont = createEl({ className: 'BlockList' },
  Arr(30).map((_, i) => {
    const top = i * 600 + rand.int(-150, 150);
    const left = Math.max(p, W / 4 + rand.int(-W / 3, W / 3));
    const width = rand.int(100, W - left - p);
    const height = rand.int(30, H);

    const $block = createEl({
      className: 'Block',
      style: map({ top, left, width, height }, px),
    }, [
      createEl({ textContent: LOREM.substr(rand.int(0, 15)) }),
    ]);

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
  blocks.needRead = true;
});

export const initBlockDim = [-9999,-9999,0,0];