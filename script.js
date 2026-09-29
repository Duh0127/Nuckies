const products = [
  { id:'nutella', name:'Tradicional com Nutella', price:17.90, image:'assets/cookie-nutella.jpg', tag:'Clássico Nuckies', categories:['chocolate','cremoso'], description:'Massa tradicional amanteigada, com gotas de chocolate nobre e recheio generoso de Nutella.' },
  { id:'mms', name:'M&M’s', price:16.90, image:'assets/cookie-mms.jpg', tag:'Colorido & crocante', categories:['chocolate'], description:'Massa tradicional amanteigada, com gotas de chocolate nobre e muito M&M’s.' },
  { id:'redvelvet', name:'Red Velvet + Ninho', price:21.90, image:'assets/spotlight-redvelvet.jpg', tag:'Cream cheese', categories:['cremoso','especial'], description:'Massa amanteigada avermelhada, gotas de chocolate branco, toque de raspas de limão e brigadeiro de Ninho com cream cheese.' },
  { id:'ovomaltine', name:'Ovomaltine Rock’s', price:21.90, image:'assets/cookie-ovomaltine.jpg', tag:'50% cacau', categories:['chocolate','especial'], description:'Massa amanteigada com 50% cacau, gotas de chocolate e muito Ovomaltine Rock’s. Intenso, chocolatudo e crocante.' },
  { id:'caramelo', name:'Caramelo Salgado Crispy', price:21.90, image:'assets/cookie-caramelo.jpg', tag:'Sweet & salty', categories:['cremoso','especial'], description:'Massa tradicional, chocolate nobre, caramelo salgado cremoso, crispy caramelizado e um toque de flor de sal.' },
  { id:'ninhonutella', name:'Ninho com Nutella', price:21.90, image:'assets/cookie-ninhonutella.jpg', tag:'Duplo creme', categories:['chocolate','cremoso'], description:'Massa tradicional amanteigada, gotas de chocolate nobre, recheio generoso de Nutella e finalização com Ninho.' },
  { id:'kitkat', name:'Kit Kat', price:23.90, image:'assets/cookie-kitkat.jpg', tag:'Crocância máxima', categories:['chocolate','especial'], description:'Massa amanteigada, gotas de chocolate nobre, muito recheio de Kit Kat e pedaço de Kit Kat na finalização.' },
  { id:'blackoreo', name:'Black Oreo', price:23.90, image:'assets/cookie-blackoreo.jpg', tag:'Dark cookie', categories:['chocolate','cremoso','especial'], description:'Massa com 100% cacau, gotas de chocolate branco e creme de Oreo para uma mordida intensa, cremosa e marcante.' },
  { id:'kinder', name:'Kinder Bueno', price:24.90, image:'assets/cookie-kinder.jpg', tag:'Signature', categories:['chocolate','cremoso','especial'], description:'Massa tradicional, gotas de chocolate nobre blend, creme Bueno e finalização com biscoito Kinder.' },
  { id:'smores', name:'S’mores', price:24.90, image:'assets/cookie-smores.jpg', tag:'American mood', categories:['chocolate','cremoso','especial'], description:'Massa amanteigada, chocolate nobre blend e recheio de marshmallow com chocolate.' },
  { id:'pistache', name:'Pistache', price:26.00, image:'assets/spotlight-pistache.jpg', tag:'Premium', categories:['cremoso','especial'], description:'Massa amanteigada, muitas gotas de chocolate branco, creme de pistache e lascas de pistache torradas.' },
  { id:'ferrero', name:'Ferrero Rocher', price:26.00, image:'assets/experience-ferrero.jpg', tag:'Luxury bite', categories:['chocolate','cremoso','especial'], description:'Massa com 50% cacau, chocolate blend, avelãs trituradas, recheio de Nutella e bombom Ferrero Rocher.' },
  { id:'biscoff', name:'Biscoff', price:26.00, image:'assets/cookie-biscoff.jpg', tag:'Canela & Lotus', categories:['cremoso','especial'], description:'Massa amanteigada com toque de canela, chocolate branco, recheio de Biscoff e finalização com biscoito Lótus.' }
];

const brl = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });
const WHATSAPP_NUMBER = '5511992233266';
const state = { filter:'all', search:'', cart:new Map(), modalProduct:null, modalQuantity:1 };

const menuGrid = document.querySelector('#menuGrid');
const emptyState = document.querySelector('#emptyState');
const searchInput = document.querySelector('#searchInput');
const filterChips = document.querySelector('#filterChips');
const spotlightGrid = document.querySelector('#spotlightGrid');
const modal = document.querySelector('#productModal');
const cartDrawer = document.querySelector('#cartDrawer');
const cartPanel = cartDrawer.querySelector('.cart-panel');
const cartItems = document.querySelector('#cartItems');
const cartEmpty = document.querySelector('#cartEmpty');
const cartCount = document.querySelector('#cartCount');
const cartTotal = document.querySelector('#cartTotal');
const toast = document.querySelector('#toast');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function productCard(product) {
  return `
    <article class="product-card flavor-${product.id} reveal" data-id="${product.id}" tabindex="0" aria-label="${product.name}, ${brl.format(product.price)}. Pressione Enter para ver detalhes.">
      <div class="product-image-wrap">
        <span class="product-badge">${product.tag}</span>
        <img class="product-image" src="${product.image}" alt="Cookie ${product.name} aberto, mostrando a massa e o recheio" loading="lazy" decoding="async" />
      </div>
      <div class="product-content">
        <div class="product-topline">
          <h3>${product.name}</h3>
          <strong class="product-price">${brl.format(product.price)}</strong>
        </div>
        <p class="product-description">${product.description}</p>
        <div class="product-actions">
          <button class="card-link" type="button" data-action="details">Ver detalhes</button>
          <button class="card-add" type="button" data-action="add">+ Adicionar</button>
        </div>
      </div>
    </article>`;
}

function renderProducts() {
  const term = state.search.toLocaleLowerCase('pt-BR');
  const filtered = products.filter(p => {
    const matchesFilter = state.filter === 'all' || p.categories.includes(state.filter);
    const haystack = `${p.name} ${p.description} ${p.tag}`.toLocaleLowerCase('pt-BR');
    return matchesFilter && haystack.includes(term);
  });
  menuGrid.innerHTML = filtered.map(productCard).join('');
  menuGrid.classList.toggle('is-filtered', state.filter !== 'all' || Boolean(state.search));
  emptyState.hidden = filtered.length > 0;
  observeReveals();
}

function renderSpotlights() {
  const images = {
    nutella:'assets/hero-cookie.jpg',
    pistache:'assets/spotlight-pistache.jpg',
    redvelvet:'assets/spotlight-redvelvet.jpg'
  };
  spotlightGrid.innerHTML = ['nutella', 'pistache', 'redvelvet'].map((id, index) => {
    const product = products.find(item => item.id === id);
    return `<button class="spotlight-card flavor-${id} reveal" type="button" data-id="${id}" aria-label="Ver detalhes de ${product.name}, ${brl.format(product.price)}">
      <span class="spotlight-number">0${index + 1}</span>
      <img src="${images[id]}" alt="" loading="lazy" />
      <span class="spotlight-info"><span><small>${product.tag} · ${brl.format(product.price)}</small><strong>${product.name}</strong></span><span class="spotlight-arrow" aria-hidden="true">↗</span></span>
    </button>`;
  }).join('');
}

function openModal(product) {
  state.modalProduct = product;
  state.modalQuantity = 1;
  document.querySelector('#modalQuantity').textContent = '1';
  document.querySelector('#modalMinus').disabled = true;
  document.querySelector('.product-modal-media').className = `product-modal-media flavor-${product.id}`;
  document.querySelector('#modalImage').src = product.image;
  document.querySelector('#modalImage').alt = `Cookie ${product.name} aberto, mostrando a massa e o recheio`;
  document.querySelector('#modalTag').textContent = product.tag;
  document.querySelector('#modalName').textContent = product.name;
  document.querySelector('#modalDescription').textContent = product.description;
  document.querySelector('#modalPrice').textContent = brl.format(product.price);
  modal.showModal();
}

function addToCart(product, amount = 1, button) {
  state.cart.set(product.id, Math.max(0, (state.cart.get(product.id) || 0) + amount));
  if (state.cart.get(product.id) === 0) state.cart.delete(product.id);
  renderCart();
  showToast(`${product.name} ${amount > 0 ? 'adicionado ao' : 'removido do'} pedido`);
  if (amount > 0 && button) showAddEffect(product, button);
}

function showAddEffect(product, button) {
  button.dataset.originalLabel ||= button.textContent;
  button.textContent = '✓ Adicionado';
  button.classList.add('is-added');
  clearTimeout(button.feedbackTimer);
  button.feedbackTimer = setTimeout(() => {
    button.textContent = button.dataset.originalLabel;
    button.classList.remove('is-added');
  }, 1100);

  if (reducedMotion.matches) return;
  const cookie = document.createElement('img');
  cookie.className = 'add-cookie-fx';
  cookie.src = product.image;
  cookie.alt = '';
  cookie.setAttribute('aria-hidden', 'true');
  button.append(cookie);
  cookie.addEventListener('animationend', () => cookie.remove(), { once:true });
  cartCount.animate([
    { transform:'scale(1)' },
    { transform:'scale(1.28) rotateY(22deg)', offset:.45 },
    { transform:'scale(1)' }
  ], { duration:520, easing:'ease-out' });
}

function renderCart() {
  const entries = [...state.cart.entries()];
  const totalItems = entries.reduce((sum, [,qty]) => sum + qty, 0);
  const total = entries.reduce((sum, [id,qty]) => sum + products.find(p => p.id === id).price * qty, 0);
  cartCount.textContent = totalItems;
  document.querySelector('#cartOpen').setAttribute('aria-label', `Abrir pedido, ${totalItems} ${totalItems === 1 ? 'cookie' : 'cookies'}`);
  cartTotal.textContent = brl.format(total);
  cartEmpty.style.display = entries.length ? 'none' : 'flex';
  cartItems.innerHTML = entries.map(([id, qty]) => {
    const p = products.find(item => item.id === id);
    return `<article class="cart-item" data-id="${id}">
      <img src="${p.image}" alt="" />
      <div><strong>${p.name}</strong><small>${brl.format(p.price)} cada</small></div>
      <div class="qty">
        <button type="button" data-cart-action="minus" aria-label="Remover uma unidade de ${p.name}">−</button>
        <b>${qty}</b>
        <button type="button" data-cart-action="plus" aria-label="Adicionar uma unidade de ${p.name}">+</button>
      </div>
    </article>`;
  }).join('');
}

function setCartOpen(open) {
  if (open) setCartOpen.returnFocus = document.activeElement;
  cartDrawer.classList.toggle('open', open);
  cartDrawer.setAttribute('aria-hidden', String(!open));
  cartPanel.inert = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) document.querySelector('#cartClose').focus();
  else setCartOpen.returnFocus?.focus();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function orderSummary() {
  if (!state.cart.size) return '';
  const lines = ['🍪 *NUCKIES | NOVO PEDIDO*', '', 'Olá! Gostaria de fazer este pedido:', '', '*ITENS DO PEDIDO*', '────────────────────'];
  let total = 0;
  let totalItems = 0;
  for (const [id, qty] of state.cart) {
    const p = products.find(item => item.id === id);
    const sub = p.price * qty;
    total += sub;
    totalItems += qty;
    lines.push(`• *${p.name}*`, `  ${qty} un. × ${brl.format(p.price)} = *${brl.format(sub)}*`, '');
  }
  lines.push('────────────────────', '*RESUMO*', `${totalItems} ${totalItems === 1 ? 'cookie' : 'cookies'}`, `*Total dos cookies: ${brl.format(total)}*`, '', 'Podem confirmar a disponibilidade e informar as opções de entrega ou retirada?');
  return lines.join('\n');
}

function orderLink(number, summary) {
  return `https://wa.me/${number}?text=${encodeURIComponent(summary)}`;
}

function finishOrder() {
  const summary = orderSummary();
  if (!summary) return showToast('Adicione pelo menos um cookie ao pedido.');
  if (!WHATSAPP_NUMBER) return showToast('WhatsApp da loja ainda não configurado.');
  window.open(orderLink(WHATSAPP_NUMBER, summary), '_blank', 'noopener,noreferrer');
}

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  });
}, { threshold:.1, rootMargin:'0px 0px 30px 0px' });
function observeReveals() {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    if (reducedMotion.matches) el.classList.add('visible');
    else revealObserver.observe(el);
  });
}

filterChips.addEventListener('click', e => {
  const button = e.target.closest('[data-filter]');
  if (!button) return;
  state.filter = button.dataset.filter;
  filterChips.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === button));
  renderProducts();
});

searchInput.addEventListener('input', e => { state.search = e.target.value.trim(); renderProducts(); });

menuGrid.addEventListener('click', e => {
  const card = e.target.closest('.product-card');
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!card || !action) return;
  const product = products.find(p => p.id === card.dataset.id);
  if (action === 'details') openModal(product);
  if (action === 'add') addToCart(product, 1, e.target.closest('[data-action="add"]'));
});

menuGrid.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const card = e.target.closest('.product-card');
    if (card && e.target === card) openModal(products.find(p => p.id === card.dataset.id));
  }
});
spotlightGrid.addEventListener('click', e => {
  const card = e.target.closest('[data-id]');
  if (card) openModal(products.find(product => product.id === card.dataset.id));
});

document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => modal.close()));
modal.addEventListener('click', e => {
  const rect = modal.getBoundingClientRect();
  const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inside) modal.close();
});
document.querySelector('#modalMinus').addEventListener('click', () => {
  state.modalQuantity = Math.max(1, state.modalQuantity - 1);
  document.querySelector('#modalQuantity').textContent = state.modalQuantity;
  document.querySelector('#modalMinus').disabled = state.modalQuantity === 1;
});
document.querySelector('#modalPlus').addEventListener('click', () => {
  state.modalQuantity += 1;
  document.querySelector('#modalQuantity').textContent = state.modalQuantity;
  document.querySelector('#modalMinus').disabled = false;
});
document.querySelector('#modalAdd').addEventListener('click', e => {
  if (state.modalProduct) addToCart(state.modalProduct, state.modalQuantity, e.currentTarget);
});

document.querySelector('#cartOpen').addEventListener('click', () => setCartOpen(true));
document.querySelector('#openOrderFromSection').addEventListener('click', () => setCartOpen(true));
document.querySelector('#cartClose').addEventListener('click', () => setCartOpen(false));
document.querySelector('#cartBackdrop').addEventListener('click', () => setCartOpen(false));
document.querySelector('#finishOrder').addEventListener('click', finishOrder);
cartDrawer.addEventListener('keydown', e => {
  if (e.key === 'Escape') setCartOpen(false);
  if (e.key !== 'Tab') return;
  const focusable = [...cartPanel.querySelectorAll('button:not([disabled])')];
  if (e.shiftKey && document.activeElement === focusable[0]) {
    e.preventDefault(); focusable.at(-1).focus();
  } else if (!e.shiftKey && document.activeElement === focusable.at(-1)) {
    e.preventDefault(); focusable[0].focus();
  }
});

cartItems.addEventListener('click', e => {
  const item = e.target.closest('.cart-item');
  const action = e.target.closest('[data-cart-action]')?.dataset.cartAction;
  if (!item || !action) return;
  const product = products.find(p => p.id === item.dataset.id);
  addToCart(product, action === 'plus' ? 1 : -1);
});

document.querySelector('#surpriseMe').addEventListener('click', () => {
  const product = products[Math.floor(Math.random() * products.length)];
  openModal(product);
});

const stack = document.querySelector('#cookieStack');
const heroArt = document.querySelector('.hero-art');
heroArt.addEventListener('pointermove', e => {
  if (reducedMotion.matches || e.pointerType !== 'mouse') return;
  const r = heroArt.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - .5;
  const y = (e.clientY - r.top) / r.height - .5;
  stack.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 10}deg)`;
  heroArt.style.setProperty('--pointer-x', `${x * 18}px`);
  heroArt.style.setProperty('--pointer-y', `${y * 16}px`);
});
heroArt.addEventListener('pointerleave', () => {
  stack.style.transform = '';
  heroArt.style.removeProperty('--pointer-x');
  heroArt.style.removeProperty('--pointer-y');
});

menuGrid.addEventListener('pointermove', e => {
  if (reducedMotion.matches || e.pointerType !== 'mouse') return;
  const wrap = e.target.closest('.product-image-wrap');
  if (!wrap) return;
  const r = wrap.getBoundingClientRect();
  const image = wrap.querySelector('.product-image');
  image.style.setProperty('--tilt-x', `${((r.top + r.height / 2 - e.clientY) / r.height) * 7}px`);
  image.style.setProperty('--tilt-y', `${((e.clientX - r.left - r.width / 2) / r.width) * 7}px`);
});
menuGrid.addEventListener('pointerout', e => {
  const wrap = e.target.closest('.product-image-wrap');
  if (wrap && !wrap.contains(e.relatedTarget)) {
    const image = wrap.querySelector('.product-image');
    image.style.removeProperty('--tilt-x');
    image.style.removeProperty('--tilt-y');
  }
});

const experienceVisual = document.querySelector('#experienceVisual');
const experienceCookie = experienceVisual.querySelector('.experience-cookie');
experienceVisual.addEventListener('pointermove', e => {
  if (reducedMotion.matches || e.pointerType !== 'mouse') return;
  const r = experienceVisual.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - .5;
  const y = (e.clientY - r.top) / r.height - .5;
  experienceCookie.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 12}deg)`;
});
experienceVisual.addEventListener('pointerleave', () => { experienceCookie.style.transform = ''; });

renderSpotlights();
renderProducts();
renderCart();
observeReveals();

const header = document.querySelector('.topbar');
const manifesto = document.querySelector('.manifesto');
let scrollFrame = 0;
function updateScrollScene() {
  header.classList.toggle('scrolled', window.scrollY > 40);
  if (!reducedMotion.matches) {
    const rect = manifesto.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight) {
      manifesto.style.setProperty('--manifesto-shift', `${Math.round((innerHeight - rect.top) * -.055)}px`);
    }
  }
  scrollFrame = 0;
}
window.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollScene);
}, { passive:true });
updateScrollScene();
