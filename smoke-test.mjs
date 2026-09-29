import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = mkdtempSync(join(tmpdir(), 'nuckies-smoke-'));
const browser = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`
], { stdio:['ignore', 'ignore', 'pipe'] });

try {
  const debugUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome não iniciou')), 10000);
    browser.once('error', reject);
    browser.stderr.on('data', chunk => {
      const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const { host } = new URL(debugUrl);
  const pages = await fetch(`http://${host}/json/list`).then(response => response.json());
  const socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once:true });
    socket.addEventListener('error', reject, { once:true });
  });

  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    callback(message);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const current = ++id;
    pending.set(current, message => message.error ? reject(new Error(message.error.message)) : resolve(message.result));
    socket.send(JSON.stringify({ id:current, method, params }));
  });

  await send('Page.enable');
  const loaded = new Promise(resolve => {
    const onMessage = ({ data }) => {
      if (JSON.parse(data).method === 'Page.loadEventFired') {
        socket.removeEventListener('message', onMessage);
        resolve();
      }
    };
    socket.addEventListener('message', onMessage);
  });
  await send('Page.navigate', { url:pathToFileURL(resolve('index.html')).href });
  await loaded;
  await send('Emulation.setDeviceMetricsOverride', { width:1440, height:900, deviceScaleFactor:1, mobile:false });
  const result = await send('Runtime.evaluate', { returnByValue:true, expression:`(() => {
    const productCount = document.querySelectorAll('.product-card').length;
    const spotlightCount = document.querySelectorAll('.spotlight-card').length;
    const card = document.querySelector('.product-card');
    card.classList.add('visible');
    card.style.transition = 'none';
    const wrap = card.querySelector('.product-image-wrap');
    const rect = wrap.getBoundingClientRect();
    const depth = getComputedStyle(wrap).perspective;
    wrap.dispatchEvent(new PointerEvent('pointermove', { bubbles:true, pointerType:'mouse', clientX:rect.left + rect.width * .75, clientY:rect.top + rect.height * .25 }));
    const tilt = wrap.querySelector('.product-image').style.getPropertyValue('--tilt-y');
    document.querySelector('#finishOrder').click();
    const emptyOrderNotice = document.querySelector('#toast').textContent;
    const button = card.querySelector('.card-add');
    button.click();
    const cardCookie = !!button.querySelector('.add-cookie-fx');
    const cardLabel = button.textContent.trim();
    card.querySelector('[data-action="details"]').click();
    document.querySelector('#modalPlus').click();
    document.querySelector('#modalPlus').click();
    const modalQuantity = document.querySelector('#modalQuantity').textContent;
    document.querySelector('#modalAdd').click();
    const modalCookie = !!document.querySelector('#modalAdd .add-cookie-fx');
    const addedCount = document.querySelector('#cartCount').textContent;
    document.querySelector('#cartOpen').click();
    document.querySelector('[data-cart-action="minus"]').click();
    const summary = orderSummary();
    state.cart.set('pistache', 1);
    const multipleSummary = orderSummary();
    state.cart.delete('pistache');
    const orderUrl = orderLink(WHATSAPP_NUMBER, summary);
    const originalOpen = window.open;
    let openedTab;
    window.open = (...args) => { openedTab = args; };
    document.querySelector('#finishOrder').click();
    window.open = originalOpen;
    const remaining = document.querySelector('#cartCount').textContent;
    const toast = document.querySelector('#toast').textContent;
    setCartOpen(false);
    document.querySelector('#productModal').close();
    document.querySelector('[data-filter="chocolate"]').click();
    const chocolateCount = document.querySelectorAll('.product-card').length;
    document.querySelector('#searchInput').value = 'Pistache';
    document.querySelector('#searchInput').dispatchEvent(new Event('input', { bubbles:true }));
    const emptySearch = document.querySelectorAll('.product-card').length;
    document.querySelector('[data-filter="all"]').click();
    const foundSearch = document.querySelectorAll('.product-card').length;
    document.querySelector('#searchInput').value = '';
    document.querySelector('#searchInput').dispatchEvent(new Event('input', { bubbles:true }));
    return { productCount, spotlightCount, tilt, cardTilt:card.style.getPropertyValue('--tilt-y'), depth, cardCookie, cardLabel, modalCookie, modalQuantity, addedCount, remaining, emptyOrderNotice, summary, multipleSummary, orderUrl, openedTab, toast, chocolateCount, emptySearch, foundSearch, restored:document.querySelectorAll('.product-card').length };
  })()` });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  const check = result.result.value;
  assert.equal(check.productCount, 13);
  assert.equal(check.spotlightCount, 3);
  assert.notEqual(check.tilt, '');
  assert.equal(check.cardTilt, '');
  assert.equal(check.depth, '900px');
  assert.equal(check.cardCookie, true);
  assert.equal(check.cardLabel, '✓ Adicionado');
  assert.equal(check.modalCookie, true);
  assert.equal(check.modalQuantity, '3');
  assert.equal(check.addedCount, '4');
  assert.equal(check.remaining, '3');
  assert.match(check.emptyOrderNotice, /Adicione pelo menos um cookie/);
  assert.match(check.summary, /🍪 \*NUCKIES \| NOVO PEDIDO\*/);
  assert.match(check.summary, /• \*Tradicional com Nutella\*\n  3 un\. × R\$\s17,90 = \*R\$\s53,70\*/);
  assert.match(check.summary, /\*RESUMO\*\n3 cookies\n\*Total dos cookies: R\$\s53,70\*/);
  assert.match(check.multipleSummary, /• \*Pistache\*\n  1 un\. × R\$\s26,00 = \*R\$\s26,00\*/);
  assert.match(check.multipleSummary, /\*RESUMO\*\n4 cookies\n\*Total dos cookies: R\$\s79,70\*/);
  assert.equal(new URL(check.orderUrl).pathname, '/5511992233266');
  assert.equal(new URL(check.orderUrl).searchParams.get('text'), check.summary);
  assert.match(check.toast, /removido do pedido/);
  assert.deepEqual(check.openedTab, [check.orderUrl, '_blank', 'noopener,noreferrer']);
  assert.ok(check.chocolateCount > 0 && check.chocolateCount < 13);
  assert.equal(check.emptySearch, 0);
  assert.equal(check.foundSearch, 1);
  assert.equal(check.restored, 13);
  const photos = await send('Runtime.evaluate', { awaitPromise:true, returnByValue:true, expression:`Promise.all([...document.querySelectorAll('.product-image')].map(async img => {
    img.loading = 'eager';
    try { await img.decode(); return { src:img.getAttribute('src'), loaded:img.naturalWidth > 0 }; }
    catch { return { src:img.getAttribute('src'), loaded:false }; }
  }))` });
  assert.equal(new Set(photos.result.value.map(photo => photo.src)).size, 13);
  assert.ok(photos.result.value.every(photo => photo.loaded), 'foto de sabor não carregou');
  for (const width of [320, 360, 390, 600, 768, 800, 801, 1024, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height:900, deviceScaleFactor:1, mobile:width < 800 });
    const layout = await send('Runtime.evaluate', { returnByValue:true, expression:`(() => ({
      viewport:innerWidth, page:document.documentElement.scrollWidth,
      clipped:[...document.querySelectorAll('h1,h2,h3,.hero-meta,.product-topline')]
        .filter(el => el.scrollWidth > el.clientWidth + 1)
        .map(el => el.closest('.product-card')?.dataset.id || el.className || el.tagName)
    }))()` });
    assert.ok(layout.result.value.page <= layout.result.value.viewport + 1, 'overflow horizontal em ' + width + 'px: ' + JSON.stringify(layout.result.value));
    assert.deepEqual(layout.result.value.clipped, [], 'texto cortado em ' + width + 'px');
  }
  await send('Emulation.setDeviceMetricsOverride', { width:320, height:568, deviceScaleFactor:1, mobile:true });
  const mobile = await send('Runtime.evaluate', { returnByValue:true, expression:`(() => {
    const toggle = document.querySelector('#menuToggle');
    toggle.click();
    const menuOpen = toggle.getAttribute('aria-expanded') === 'true' && getComputedStyle(document.querySelector('#mainNav')).visibility === 'visible';
    document.querySelector('#mainNav a[href="#sabores"]').click();
    const menuClosed = toggle.getAttribute('aria-expanded') === 'false';
    const clippedProducts = [];
    for (const product of products) {
      openModal(product);
      const title = document.querySelector('#modalName');
      if (title.scrollWidth > title.clientWidth + 1) clippedProducts.push(product.id);
      modal.close();
    }
    openModal(products[0]);
    const dialogFits = modal.getBoundingClientRect().height <= innerHeight;
    modal.scrollTop = modal.scrollHeight;
    const close = modal.querySelector('.modal-close').getBoundingClientRect();
    const closeVisible = close.top >= 0 && close.bottom <= innerHeight;
    modal.close();
    document.querySelector('#cartOpen').click();
    const panelFits = cartPanel.getBoundingClientRect().width <= innerWidth;
    const touchTarget = cartPanel.querySelector('.qty button').getBoundingClientRect().height;
    setCartOpen(false);
    return { menuOpen, menuClosed, clippedProducts, dialogFits, closeVisible, panelFits, touchTarget };
  })()` });
  assert.deepEqual(mobile.result.value, { menuOpen:true, menuClosed:true, clippedProducts:[], dialogFits:true, closeVisible:true, panelFits:true, touchTarget:44 });
  assert.equal(readFileSync('favicon.ico').readUInt16LE(2), 1);
  for (const path of ['assets/favicon-32.png','assets/apple-touch-icon.png','assets/icon-192.png','assets/icon-512.png']) {
    assert.equal(readFileSync(path).subarray(0,8).toString('hex'), '89504e470d0a1a0a');
  }
  console.log('OK: catálogo, busca, filtros, modal, carrinho, WhatsApp e responsividade');
  socket.close();
} finally {
  browser.kill();
  try { rmSync(profile, { recursive:true, force:true }); } catch {}
}
