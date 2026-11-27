/**
 * 본문의 각주 번호 옆에 각주 내용을 메모 상자로 띄운다.
 *
 * - 마우스: 번호에 올리면 띄우고, 메모 위로 옮겨도 유지한다. 클릭하면 원래처럼 각주로 이동한다.
 * - 키보드: 번호에 포커스가 가면 띄우고 Esc로 닫는다.
 * - 터치 화면(hover: none): 번호를 누르면 이동하지 않고 띄우며, 바깥을 누르거나 스크롤하면 닫는다.
 *
 * 각주에 그림과 링크가 있으면 그대로 복사해 보여 준다.
 */

const GAP = 8; // 번호와 메모 사이 간격(px)
const EDGE = 12; // 화면 가장자리와 메모 사이 최소 간격(px)
const HIDE_DELAY = 150; // 번호에서 메모로 커서를 옮길 시간(ms)
// 터치로 누르면 focus가 먼저 메모를 띄우고 바로 click이 온다. 그 click이 메모를 닫지 않게 하는 시간(ms).
const TAP_GRACE = 400;

export function initFootnotePopover() {
  const refs = document.querySelectorAll('.content sup a.footnote');
  if (refs.length === 0) {
    return;
  }

  const touchOnly = matchMedia('(hover: none)');
  const box = document.createElement('div');
  box.id = 'footnote-popover';
  box.className = 'footnote-popover';
  box.setAttribute('role', 'tooltip');
  box.hidden = true;
  document.body.append(box);

  let current = null;
  let hideTimer;
  let shownAt = 0;
  let skipFocus = false; // Esc로 닫고 번호로 포커스를 돌릴 때 다시 띄우지 않으려고 둔다.

  // 상단 메뉴바와 글 제목 막대(ToC 바)는 화면 위에 고정되어 있어 그 아래까지만 쓴다.
  const headerBottom = () =>
    Math.max(
      0,
      ...['topbar-wrapper', 'toc-bar']
        .map((id) => document.getElementById(id))
        .filter((el) => el && el.offsetParent !== null)
        .map((el) => el.getBoundingClientRect().bottom)
    );

  const place = () => {
    if (!current) return;

    box.style.maxHeight = '';
    const ref = current.getBoundingClientRect();
    const { width, height } = box.getBoundingClientRect();
    const maxLeft = document.documentElement.clientWidth - width - EDGE;
    const left = Math.max(EDGE, Math.min(ref.left + ref.width / 2 - width / 2, maxLeft));

    // 아래에 들어가면 아래, 아니면 위. 둘 다 모자라면 넓은 쪽에 두고 높이를 줄여 안에서 스크롤한다.
    const below = window.innerHeight - ref.bottom - GAP - EDGE;
    const above = ref.top - headerBottom() - GAP - EDGE;
    const goAbove = height > below && (height <= above || above > below);
    const room = goAbove ? above : below;
    if (height > room) box.style.maxHeight = `${Math.max(room, 80)}px`;
    const finalHeight = box.getBoundingClientRect().height;
    const top = goAbove ? ref.top - finalHeight - GAP : ref.bottom + GAP;

    box.style.left = `${left + window.scrollX}px`;
    box.style.top = `${top + window.scrollY}px`;
  };

  const hide = () => {
    clearTimeout(hideTimer);
    box.hidden = true;
    current?.removeAttribute('aria-describedby');
    current = null;
  };

  const hideSoon = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, HIDE_DELAY);
  };

  const show = (ref) => {
    clearTimeout(hideTimer);
    if (current === ref) return;

    const note = document.getElementById(decodeURIComponent(ref.hash.slice(1)));
    if (!note) return;

    const clone = note.cloneNode(true);
    clone.querySelectorAll('a.reversefootnote').forEach((a) => a.remove());
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));

    // 복사한 그림 링크에는 GLightbox가 붙어 있지 않으므로 원래 각주의 링크를 대신 누른다.
    const originals = note.querySelectorAll('a.popup');
    clone.querySelectorAll('a.popup').forEach((a, i) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        hide();
        originals[i]?.click();
      });
    });

    clone.querySelectorAll('img').forEach((img) => {
      img.addEventListener('load', place, { once: true });
    });

    box.replaceChildren(...clone.childNodes);
    box.hidden = false;
    shownAt = performance.now();
    current?.removeAttribute('aria-describedby');
    current = ref;
    ref.setAttribute('aria-describedby', box.id);
    place();
  };

  refs.forEach((ref) => {
    ref.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') show(ref);
    });
    ref.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') hideSoon();
    });
    ref.addEventListener('focus', () => {
      if (skipFocus) {
        skipFocus = false;
        return;
      }
      show(ref);
    });
    ref.addEventListener('blur', hideSoon);
    ref.addEventListener('click', (e) => {
      if (!touchOnly.matches) return;
      e.preventDefault();
      if (current === ref) {
        if (performance.now() - shownAt > TAP_GRACE) hide();
      } else {
        show(ref);
      }
    });
  });

  box.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  box.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') hideSoon();
  });
  box.addEventListener('focusin', () => clearTimeout(hideTimer));
  box.addEventListener('focusout', hideSoon);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) {
      const ref = current;
      const focusInBox = box.contains(document.activeElement);
      hide();
      if (focusInBox) {
        skipFocus = true;
        ref.focus({ preventScroll: true });
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (current && !box.contains(e.target) && !current.contains(e.target)) {
      hide();
    }
  });

  window.addEventListener('resize', place);
  window.addEventListener(
    'scroll',
    () => {
      if (touchOnly.matches) hide();
    },
    { passive: true }
  );
}
