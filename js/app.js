/* MASDELLA — демо. Без библиотек. Все кадры часов — настоящие фото магазина.
   Подача Apple: ролик первого экрана один раз, выезжающая локальная навигация, галерея «Главное»
   с плавным листанием, «Рассмотреть ближе» с пилюлями-свойствами, появление блоков при прокрутке.
   Своё поверх: текст проявляется по словам, золотая линия прогресса, лента марок, статус «открыто».
   Каждый блок запускается отдельно: ошибка в одном не ломает остальные. */
(function () {
  'use strict';

  var LAYER_FADE_MS = 400;
  var GALLERY_STEP_MS = 5700;
  var GALLERY_MOVE_MS = 1000;
  var MAX_QTY = 20;
  var CART_KEY = 'masdella-cart';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var phone = window.matchMedia('(max-width: 833px)');
  var hasIO = 'IntersectionObserver' in window;
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.error('MASDELLA:', name, e); } }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function easeInOut(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function smooth() { return reduceMotion.matches ? 'auto' : 'smooth'; }

  /* ---------- данные ---------- */
  var CATS = window.MD_CATS || [], ITEMS = window.MD_ITEMS || [];
  var SHOP = window.MD_SHOP || { wa: '79999075298', hours: '' };
  /* данные владельца проверяем при чтении: одна кривая запись не должна ронять весь сайт */
  function arr(v) { return Array.isArray(v) ? v : []; }
  CATS = arr(CATS).filter(function (c) { return c && typeof c.id === 'string' && typeof c.name === 'string'; });
  ITEMS = (Array.isArray(ITEMS) ? ITEMS : []).filter(function (it) {
    return it && typeof it.id === 'string' && typeof it.img === 'string' && typeof it.name === 'string' && typeof it.cat === 'string';
  });
  var byId = Object.create(null);
  ITEMS.forEach(function (it) {
    var pr = Number(it.price); it.price = isFinite(pr) && pr > 0 ? Math.round(pr) : 0;
    if (typeof it.line !== 'string') it.line = '';
    /* «семья» — имя до тире: по ней в окне товара показываем другие цвета той же модели */
    it.family = it.name.split(' — ')[0];
    /* тире не должно уезжать в начало строки */
    it.name = it.name.replace(/ (—|–) /g, '\u00a0$1 ');
    byId[it.id] = it;
  });
  /* кадры моделей: фото модели с сайта марки (если есть), фото магазина на чёрном, то же фото шире, третий кадр */
  safe('shots', function () {
    var SHOTS = window.MD_SHOTS || {}, NET = window.MD_NET || {};
    Object.keys(SHOTS).forEach(function (id) {
      var it = byId[id], sh = SHOTS[id];
      if (!it || !Array.isArray(sh) || typeof sh[0] !== 'string') return;
      it.views = [];
      if (NET[id]) it.views.push({ img: 'n/' + id, label: 'Фото модели' });
      it.views.push({ img: 's/' + id, label: 'Фото магазина' }, { img: 'c/' + id, label: sh[0] });
      sh.slice(1).forEach(function (v) { if (Array.isArray(v) && v[0]) it.views.push({ img: String(v[0]), label: String(v[1] || '') }); });
      it.img = it.views[0].img;
    });
    /* модели, у которых было только фото целиком: фото модели первым, фото магазина вторым */
    Object.keys(NET).forEach(function (id) {
      var it = byId[id]; if (!it || it.views) return;
      it.views = [{ img: 'n/' + id, label: 'Фото модели' }, { img: it.img, label: 'Фото магазина' }];
      it.img = 'n/' + id; it.photoOnly = false;
    });
  });
  function isStudio(it) { return /^(s|n)\//.test(it.img); }
  var catName = Object.create(null);
  CATS.forEach(function (c) { catName[c.id] = c.name; });
  function known(ids) { return arr(ids).filter(function (id) { return typeof id === 'string' && byId[id]; }); }
  var FEATURES = arr(window.MD_FEATURES).filter(function (f) { return f && Array.isArray(f.imgs) && f.imgs.length && known(f.ids).length && typeof f.label === 'string'; });
  var MODELS = known(window.MD_MODELS), CASES = known(window.MD_CASES);

  function rub(n) { return n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽'; }
  function src(it) { return 'img/' + it.img + '.webp'; }
  function isPhoto(it) { return it.img.indexOf('p/') === 0; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wa(text) { return 'https://wa.me/' + SHOP.wa + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function priceText(it) { return it && it.price ? rub(it.price) : 'Цена по запросу'; }
  /* у кейса цена за всю шкатулку с часами — пишем это прямо */
  function priceFull(it) { return priceText(it) + (it && it.price && it.cat === 'keysy' ? ' за набор' : ''); }
  /* ширина окна: на телефоне адресная строка меняет только высоту — такие «resize» пропускаем */
  function onWidthChange(fn) {
    var w = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth === w) return; w = window.innerWidth; fn(); });
  }

  /* ---------- один цикл прокрутки на все эффекты ---------- */
  var frameFns = [], ticking = false;
  function onFrame(fn) { frameFns.push(fn); }
  function tick() {
    ticking = false;
    var y = window.pageYOffset, vh = window.innerHeight;
    for (var i = 0; i < frameFns.length; i++) { try { frameFns[i](y, vh); } catch (e) { if (window.console) console.error('MASDELLA: frame', e); } }
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);

  /* ---------- появление при прокрутке: как у Apple, сразу при входе в экран ---------- */
  var io = hasIO ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { rootMargin: '0px', threshold: 0 }) : null;
  function reveal(el) { if (io && !reduceMotion.matches) io.observe(el); else el.classList.add('on'); }
  safe('reveal', function () { $$('[data-r]').forEach(reveal); });

  /* ---------- ролики, которые играют один раз и встают на последний кадр ---------- */
  safe('once', function () {
    $$('.once').forEach(function (box) {
      var v = $('video', box), last = $('.once__last img', box) || $('img', box);
      /* готовый кадр показываем, только когда он загрузился: без чёрной дыры между кадрами */
      var finished = false;
      function done() {
        if (finished) return; finished = true;
        function show() { box.classList.add('is-done'); }
        if (!last || (last.complete && last.naturalWidth)) show();
        else { last.addEventListener('load', show); last.addEventListener('error', show); }
      }
      if (!v || reduceMotion.matches) { done(); return; }
      var url = v.getAttribute('data-src') || v.getAttribute(phone.matches ? 'data-tall' : 'data-wide');
      if (!url) { done(); return; }
      var c = navigator.connection;
      if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) { done(); return; }
      var started = false, stall = null;
      function stop() { clearTimeout(stall); v.removeAttribute('src'); try { v.load(); } catch (e) {} done(); }
      v.addEventListener('playing', function () { started = true; clearTimeout(stall); });
      /* начал играть и встал на подгрузке — не держим часы посреди поворота */
      v.addEventListener('waiting', function () { if (started) { clearTimeout(stall); stall = setTimeout(stop, 1500); } });
      v.addEventListener('ended', done);
      v.addEventListener('error', done);
      function start() {
        v.preload = 'auto'; v.src = url;
        var p = v.play(); if (p && p.catch) p.catch(stop);
        /* сеть медленная — останавливаем загрузку и показываем готовый кадр */
        setTimeout(function () { if (!started) stop(); }, 3500);
      }
      if (box.getAttribute('data-once') === 'now' || !hasIO) { start(); return; }
      var o = new IntersectionObserver(function (es) {
        if (es[es.length - 1].isIntersecting) { o.disconnect(); start(); }
      }, { threshold: 0.5 });
      o.observe(box);
    });
  });

  /* ---------- цены в разметке берём из данных ---------- */
  safe('prices', function () {
    $$('[data-price-of]').forEach(function (el) { el.textContent = priceText(byId[el.getAttribute('data-price-of')]); });
    var min = ITEMS.filter(function (it) { return it.price && it.cat !== 'podarki' && it.cat !== 'keysy'; })
      .reduce(function (m, it) { return Math.min(m, it.price); }, Infinity);
    if (min < Infinity) $$('[data-min-price]').forEach(function (el) { el.textContent = rub(min); });
  });


  /* ---------- экранный диктор слышит результат действия ---------- */
  function say(t) {
    var layer = document.querySelector('.cart.is-open, .modal.is-open');
    var el = (layer && $('[data-say-in]', layer)) || $('[data-say]'); if (!el) return;
    el.textContent = ''; setTimeout(function () { el.textContent = t; }, 60);
  }

  /* ---------- корзина: хранение ---------- */
  function loadCart() {
    var raw = null, out = {};
    try { raw = JSON.parse(localStorage.getItem(CART_KEY) || '{}'); } catch (e) { raw = null; }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    Object.keys(raw).forEach(function (id) {
      var q = Number(raw[id]);
      if (byId[id] && Math.floor(q) === q && q > 0) out[id] = Math.min(q, MAX_QTY);
    });
    return out;
  }
  /* Корзина живёт в памяти страницы, хранилище — только копия. Так она не теряет позиции,
     если браузер не даёт сохранять данные (Safari с блокировкой, встроенные браузеры соцсетей). */
  var cart = loadCart();
  var how = 'Самовывоз — Шали, Кадырова, 105', city = '';
  function save() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} }
  var SENT_KEY = 'masdella-sent', sent = {};
  try { var raw = JSON.parse(localStorage.getItem(SENT_KEY) || '{}'); if (raw && typeof raw === 'object') sent = raw; } catch (e) {}
  /* часы из уже отправленного заказа, которые всё ещё лежат в корзине */
  function sentLeft() { return Object.keys(sent).filter(function (id) { return cart[id]; }); }
  function saveSent() { try { if (Object.keys(sent).length) localStorage.setItem(SENT_KEY, JSON.stringify(sent)); else localStorage.removeItem(SENT_KEY); } catch (e) {} }
  function showSent() { var el = $('[data-cart-sent]'); if (el) el.hidden = !sentLeft().length; }
  /* способ получения и город переживают перезагрузку */
  var HOW_KEY = 'masdella-how';
  function saveHow() { try { localStorage.setItem(HOW_KEY, JSON.stringify({ how: how, city: city })); } catch (e) {} }
  try { var hw = JSON.parse(localStorage.getItem(HOW_KEY) || 'null'); if (hw && typeof hw.how === 'string') { how = hw.how; city = typeof hw.city === 'string' ? hw.city : ''; } } catch (e) {}
  function ids() { return Object.keys(cart).filter(function (id) { return byId[id]; }); }
  function count() { return ids().reduce(function (s, id) { return s + cart[id]; }, 0); }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : (m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c); }

  var lastCount = null;
  function renderBag() {
    var n = count();
    $$('.bag__n').forEach(function (el) {
      el.textContent = n; el.hidden = n === 0;
      /* счётчик коротко «подпрыгивает», когда товар добавили */
      if (lastCount !== null && n > lastCount && !reduceMotion.matches) {
        el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
      }
    });
    lastCount = n;
    $$('.bag').forEach(function (b) { b.setAttribute('aria-label', n ? 'Корзина, товаров: ' + n : 'Корзина'); });
    $$('[data-add]').forEach(function (b) { b.textContent = cart[b.getAttribute('data-add')] ? 'В корзине ›' : 'В корзину'; });
  }
  function add(id) {
    if (!byId[id]) return;
    cart[id] = Math.min((cart[id] || 0) + 1, MAX_QTY);
    save(); renderBag(); renderCart();
    say('Добавлено в корзину. Товаров: ' + count());
  }

  function orderText() {
    var sum = 0, ask = 0, lines = ids().map(function (id, i) {
      var it = byId[id], q = cart[id];
      if (it.price) sum += it.price * q; else ask += 1;
      return (i + 1) + '. ' + it.name + ' × ' + q + (it.price ? ', ' + rub(it.price * q) : ', цена?');
    });
    var get = how === 'Доставка' ? 'доставка, город: ' + (city.trim() || '…') : how;
    return {
      sum: sum, ask: ask,
      text: 'Здравствуйте! Хочу заказать с сайта М78:\n' + lines.join('\n') +
        (sum ? '\nИтого' + (ask ? ' по известным ценам' : '') + ': ' + rub(sum) : '') +
        '\nПолучение: ' + get + '\nЕсть в наличии?'
    };
  }
  function updateLink() { $('[data-cart-wa]').href = wa(orderText().text); }

  var listLockedUntil = 0;
  function renderCart() {
    var list = $('[data-cart-list]'), foot = $('[data-cart-foot]'), all = ids();
    if (!all.length) {
      list.innerHTML = '<li class="cart__empty">Пока пусто.<br><a class="btn btn--gold" href="#katalog" data-go-cat>Перейти в каталог</a></li>';
      foot.hidden = true; $('[data-cart-wa]').href = wa(); $('[data-cart-sum]').textContent = ''; $('[data-cart-hint]').textContent = '';
      $('[data-cart-sent]').hidden = true;
      return;
    }
    foot.hidden = false;
    showSent();
    list.innerHTML = all.map(function (id) {
      var it = byId[id], q = cart[id];
      var minus = q === 1
        ? '<button type="button" class="del" data-dec="' + esc(id) + '" aria-label="Удалить: ' + esc(it.name) + '">Удалить</button>'
        : '<button type="button" data-dec="' + esc(id) + '" aria-label="Убрать одну: ' + esc(it.name) + '">−</button>';
      return '<li class="cart__row"><span class="th' + (isPhoto(it) || isStudio(it) ? ' is-photo' : '') + '"><img src="' + src(it) + '" alt="" loading="lazy"></span>' +
        '<div><b>' + esc(it.name) + '</b><small>' + priceFull(it) + '</small>' +
        '<div class="qty">' + minus + '<span>' + q + '</span>' +
        '<button type="button" data-inc="' + esc(id) + '" aria-label="Добавить ещё: ' + esc(it.name) + '"' + (q >= MAX_QTY ? ' disabled' : '') + '>+</button></div></div></li>';
    }).join('');
    var o = orderText();
    $('[data-cart-sum]').textContent = o.sum ? rub(o.sum) : '—';
    $('[data-cart-city]').hidden = how !== 'Доставка';
    $('[data-cart-hint]').textContent = (o.ask ? 'Без учёта ' + o.ask + ' ' + plural(o.ask, 'позиции', 'позиций', 'позиций') + ' — их цену подскажем. ' : '') +
      'Откроется WhatsApp с готовым списком — останется нажать «Отправить». Отвечаем ' + SHOP.hours + ' по Москве и подтверждаем наличие.';
    updateLink();
  }

  safe('cart', function () {
    var list = $('[data-cart-list]');
    list.addEventListener('click', function (e) {
      if (e.target.closest('[data-go-cat]')) {
        e.preventDefault(); closeLayer(cartEl);
        setTimeout(function () { $('#katalog').scrollIntoView({ behavior: smooth() }); }, LAYER_FADE_MS);
        return;
      }
      var b = e.target.closest('button'); if (!b || Date.now() < listLockedUntil) return;
      var isInc = b.hasAttribute('data-inc'), id = b.getAttribute(isInc ? 'data-inc' : 'data-dec');
      if (!byId[id]) return;
      if (isInc) cart[id] = Math.min((cart[id] || 0) + 1, MAX_QTY);
      else { cart[id] = (cart[id] || 1) - 1; if (cart[id] <= 0) { delete cart[id]; listLockedUntil = Date.now() + 350; } }
      save(); renderBag(); renderCart();
      /* фокус — на той же позиции или на «+»: второй Enter не удалит соседние часы; «+» на 20 выключен — тогда на «−» */
      var same = list.querySelector('[data-' + (isInc ? 'inc' : 'dec') + '="' + id + '"]');
      if (same && same.disabled) same = list.querySelector('[data-dec="' + id + '"]');
      (same || list.querySelector('[data-inc]') || $('[data-close-cart]')).focus();
      if (!cart[id]) say('Удалено из корзины');
    });
    $$('[data-how]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-how') === how);
      b.addEventListener('click', function () {
        how = b.getAttribute('data-how'); saveHow();
        $$('[data-how]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        renderCart();
        if (how === 'Доставка') { var c = $('[data-city]'); if (c && !c.value) c.focus(); }
      });
    });
    var cityInput = $('[data-city]'); cityInput.value = city;
    cityInput.addEventListener('input', function (e) { city = e.target.value; saveHow(); updateLink(); });
    cityInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.target.blur(); });
    /* после перехода в WhatsApp спрашиваем, отправлен ли заказ, — чтобы старые часы не попали в следующий */
    $('[data-cart-wa]').addEventListener('click', function () {
      /* снимок — сразу: iPhone может усыпить вкладку раньше любого таймера */
      sent = {}; ids().forEach(function (id) { sent[id] = cart[id]; }); saveSent();
      setTimeout(function () { showSent(); say('Часы из отправленного заказа остались в корзине. Их можно убрать'); }, 1200);
    });
    $('[data-cart-clear]').addEventListener('click', function () {
      Object.keys(sent).forEach(function (id) { if (cart[id]) { cart[id] -= sent[id]; if (cart[id] <= 0) delete cart[id]; } });
      sent = {}; saveSent(); save(); renderBag(); renderCart();
      $('[data-close-cart]').focus(); say('Отправленные часы убраны из корзины');
    });
    window.addEventListener('storage', function (e) { if (e.key === CART_KEY) { cart = loadCart(); renderBag(); renderCart(); } });
  });

  /* ---------- слои: окно товара и корзина ---------- */
  var modal = $('[data-modal]'), cartEl = $('[data-cart]'), lastFocus = null, openedAt = 0;
  var page = $$('body > header, body > nav, body > main, body > footer');
  function topLayer() { return cartEl.classList.contains('is-open') ? cartEl : (modal.classList.contains('is-open') ? modal : null); }
  /* страницу под слоем закрепляем: на iOS 15 одного overflow: hidden мало */
  var lockY = 0, locked = false;
  function lockPage() {
    if (locked) return; locked = true; lockY = window.pageYOffset;
    var st = document.body.style; st.position = 'fixed'; st.top = -lockY + 'px'; st.left = '0'; st.right = '0'; st.overflow = 'hidden';
  }
  function unlockPage() {
    if (!locked) return; locked = false;
    var st = document.body.style; st.position = st.top = st.left = st.right = st.overflow = '';
    window.scrollTo(0, lockY);
  }
  function showLayer(el, focusSel) {
    clearTimeout(el._hide);
    if (!topLayer()) lastFocus = document.activeElement;
    el.hidden = false; void el.offsetWidth; el.classList.add('is-open'); openedAt = Date.now();
    lockPage();
    page.forEach(function (p) { p.inert = true; });
    var f = $(focusSel, el); if (f) f.focus({ preventScroll: true });
    var sc = $('.sheet__scroll', el); if (sc) sc.scrollTop = 0;
  }
  function hideLayer(el) {
    if (!el.classList.contains('is-open')) return;
    if (el === modal && vtFrom && document.contains(vtFrom) && canVT() && !cartEl.classList.contains('is-open')) {
      var src = vtFrom, mi = mainImg(); vtFrom = null;
      var r = src.getBoundingClientRect();
      if (mi && r.bottom > 0 && r.top < window.innerHeight) {
        mi.style.viewTransitionName = 'md-photo'; modal.classList.add('is-vt');
        try {
          var t = document.startViewTransition(function () {
            mi.style.viewTransitionName = ''; hideNow(el); src.style.viewTransitionName = 'md-photo';
          });
          t.finished.then(fin, fin);
          return;
        } catch (e) { mi.style.viewTransitionName = ''; modal.classList.remove('is-vt'); }
      }
      function fin() { src.style.viewTransitionName = ''; modal.classList.remove('is-vt'); }
    }
    hideNow(el);
  }
  function hideNow(el) {
    if (!el.classList.contains('is-open')) return;
    el.classList.remove('is-open');
    if (el.classList.contains('is-vt')) el.hidden = true;
    else el._hide = setTimeout(function () { el.hidden = true; }, LAYER_FADE_MS);
    if (!topLayer()) {
      unlockPage();
      page.forEach(function (p) { p.inert = false; });
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
  }
  /* Системная кнопка «Назад» закрывает открытый слой */
  function openLayer(el, focusSel) {
    var wasOpen = !!topLayer();
    showLayer(el, focusSel);
    try { if (wasOpen) history.replaceState({ mdLayer: 1 }, ''); else history.pushState({ mdLayer: 1 }, ''); } catch (e) {}
  }
  /* два быстрых закрытия подряд не должны дважды нажать «Назад» и увести с сайта */
  var backPending = false, backTimer = null;
  function closeLayer(el) {
    if (!el.classList.contains('is-open') || backPending) return;
    if (history.state && history.state.mdLayer) {
      backPending = true; history.back();
      backTimer = setTimeout(function () { if (backPending) { backPending = false; hideLayer(el); } }, 800);
    } else hideLayer(el);
  }
  window.addEventListener('popstate', function (e) {
    clearTimeout(backTimer); backPending = false; var l = topLayer(); if (!l) return;
    /* жест «Назад» на iPhone анимирует сам — свою анимацию не добавляем */
    if (e.hasUAVisualTransition) { vtFrom = null; hideNow(l); } else hideLayer(l);
  });
  /* страницу перезагрузили с открытым слоем — лишняя запись «Назад» не нужна */
  try { if (history.state && history.state.mdLayer) history.replaceState(null, ''); } catch (e) {}
  function openCart() { if (cartEl.classList.contains('is-open')) return; renderCart(); openLayer(cartEl, '[data-close-cart]'); }
  function switchToCart() { renderCart(); showLayer(cartEl, '[data-close-cart]'); hideLayer(modal); }
  /* второй тап сразу после открытия не должен попасть в крестик, который лёг под палец */
  function settled() { return Date.now() - openedAt > 450; }

  safe('layers', function () {
    $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', openCart); });
    $('[data-close-cart]').addEventListener('click', function () { if (settled()) closeLayer(cartEl); });
    $('[data-close]').addEventListener('click', function () { if (settled()) closeLayer(modal); });
    [cartEl, modal].forEach(function (el) {
      el.addEventListener('click', function (e) { if (e.target === el && settled()) closeLayer(el); });
    });
    document.addEventListener('keydown', function (e) {
      var layer = topLayer(); if (!layer) return;
      if (e.key === 'Escape') { closeLayer(layer); return; }
      if (e.key !== 'Tab') return;
      var f = $$('button:not([disabled]), a[href]', layer).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (!layer.contains(document.activeElement)) { e.preventDefault(); f[0].focus(); return; }
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  });

  /* ---------- окно товара ---------- */
  /* Окно товара: главная кнопка сразу открывает WhatsApp с готовым заказом этих часов,
     корзина — вторая кнопка, для тех, кто берёт несколько. */
  var mAdd = $('[data-m-add]'), mOrder = $('[data-m-order]'), current = null;
  function addLabel(it) { return cart[it.id] ? 'В корзине · открыть' : 'Добавить в корзину'; }
  /* варианты — вся «семья» в постоянном порядке, текущий отмечен */
  function variants(it) { return ITEMS.filter(function (x) { return x.family === it.family && byId[x.id]; }).slice(0, 6); }
  var viewK = 0;
  function showView(it, k) {
    var box = $('[data-m-img]'), v = it.views[k]; viewK = k;
    var im = $('.sheet__main', box); im.src = 'img/' + v.img + '.webp';
    im.alt = it.name + (v.label ? ', ' + v.label : '');
    $('.sheet__cap', box).textContent = v.label;
    $$('[data-view-k]', modal).forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-view-k') === k); });
  }
  function fillItem(it) {
    current = it.id;
    var box = $('[data-m-img]'), views = $('[data-m-views]');
    if (it.views && it.views.length > 1) {
      box.className = 'sheet__img is-shots';
      box.innerHTML = '<img class="sheet__main" src="' + src(it) + '" alt="' + esc(it.name) + '"><span class="sheet__cap"></span>';
      views.innerHTML = it.views.map(function (v, k) {
        return '<button class="thumb" type="button" data-view-k="' + k + '" aria-label="' + esc(v.label) + '" aria-pressed="false"><img src="img/' + esc(v.img) + '.webp" alt="" loading="lazy"></button>';
      }).join('');
      views.hidden = false;
      showView(it, 0);
    } else {
      box.className = 'sheet__img' + (isPhoto(it) ? ' is-photo' : '');
      box.innerHTML = '<img src="' + src(it) + '" alt="' + esc(it.name) + '">';
      views.hidden = true; views.innerHTML = '';
    }
    $('[data-m-cat]').textContent = catName[it.cat] || '';
    $('[data-m-name]').textContent = it.name;
    $('[data-m-line]').textContent = it.line;
    $('[data-m-price]').textContent = priceFull(it);
    mAdd.textContent = addLabel(it);
    mOrder.textContent = 'Заказать в WhatsApp' + (it.price ? ' · ' + rub(it.price) : '');
    mOrder.href = wa('Здравствуйте! Хочу заказать с сайта М78: «' + it.name + '»' + (it.price ? ', ' + priceFull(it) : '') +
      '. Есть в наличии?' + (it.ask ? '\n' + it.ask : '') + '\nПолучение: самовывоз в Шали / доставка, город: …');
    var vs = variants(it), wrap = $('[data-m-vars]');
    wrap.hidden = vs.length < 2;
    $('[data-m-vlist]').innerHTML = vs.length < 2 ? '' : vs.map(function (v) {
      var on = v.id === it.id;
      return '<button class="thumb" type="button" data-var="' + esc(v.id) + '" aria-label="' + esc(v.name + ', ' + priceText(v)) + '"' +
        (on ? ' aria-current="true"' : '') + '><img src="' + src(v) + '" alt="" loading="lazy"></button>';
    }).join('');
  }
  var vtFrom = null;
  function canVT() { return !!document.startViewTransition && !reduceMotion.matches; }
  function mainImg() { return $('.sheet__main', modal) || $('[data-m-img] img', modal); }
  function openItem(id, from) {
    var it = byId[id]; if (!it) return;
    var img = from && from.querySelector && from.querySelector('img');
    function go() { fillItem(it); $('.sheet__scroll').scrollTop = 0; openLayer(modal, '[data-m-order]'); }
    if (!img || !canVT() || topLayer()) { vtFrom = null; go(); return; }
    vtFrom = img;
    img.style.viewTransitionName = 'md-photo';
    modal.classList.add('is-vt');
    try {
      var t = document.startViewTransition(function () {
        img.style.viewTransitionName = '';
        go();
        var mi = mainImg(); if (mi) mi.style.viewTransitionName = 'md-photo';
      });
      t.finished.then(done, done);
    } catch (e) { img.style.viewTransitionName = ''; done(); go(); }
    function done() { modal.classList.remove('is-vt'); var mi = mainImg(); if (mi) mi.style.viewTransitionName = ''; }
  }
  safe('modal', function () {
    mAdd.addEventListener('click', function () {
      if (!settled()) return;
      if (cart[current]) { switchToCart(); return; }
      add(current); mAdd.textContent = 'Добавлено · открыть корзину'; openedAt = Date.now();
    });
    mOrder.addEventListener('click', function (e) { if (!settled()) e.preventDefault(); });
    $('[data-m-views]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-view-k]'); if (!b || !byId[current]) return;
      showView(byId[current], +b.getAttribute('data-view-k'));
    });
    /* на телефоне кадры листаются свайпом по фото — только горизонтальным и одним пальцем,
       прокрутка окна и щипок кадр не меняют; у самого края экрана — системный жест «Назад» */
    var mImg = $('[data-m-img]'), sx = null, sy = 0, sTop = 0;
    mImg.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      if (e.touches.length !== 1 || t.clientX < 24 || t.clientX > window.innerWidth - 24) { sx = null; return; }
      sx = t.clientX; sy = t.clientY; sTop = $('.sheet__scroll').scrollTop;
    }, { passive: true });
    mImg.addEventListener('touchmove', function (e) { if (e.touches.length > 1) sx = null; }, { passive: true });
    mImg.addEventListener('touchcancel', function () { sx = null; }, { passive: true });
    mImg.addEventListener('touchend', function (e) {
      var it = byId[current]; if (sx === null || e.touches.length || !it || !it.views) return;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5 || $('.sheet__scroll').scrollTop !== sTop) return;
      showView(it, (viewK + (dx < 0 ? 1 : -1) + it.views.length) % it.views.length);
    }, { passive: true });
    $('[data-m-vlist]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-var]'); if (!b || b.hasAttribute('aria-current')) return;
      var it = byId[b.getAttribute('data-var')]; if (!it) return;
      fillItem(it); vtFrom = null;
      $('.sheet__scroll').scrollTo({ top: 0, behavior: smooth() });
      var cur = $('[data-var][aria-current]', modal); if (cur) cur.focus({ preventScroll: true });
      say(it.name + ', ' + priceFull(it));
    });
    document.addEventListener('click', function (e) {
      var o = e.target.closest('[data-open], [data-open-link]');
      if (o) { e.preventDefault(); openItem(o.getAttribute('data-open') || o.getAttribute('data-open-link'), o); return; }
      var a = e.target.closest('[data-add]');
      if (a) { var id = a.getAttribute('data-add'); if (cart[id]) openCart(); else add(id); }
    });
  });

  /* ссылки на WhatsApp с готовым текстом — номер берём из одного места */
  safe('wa-links', function () {
    $$('[data-wa-text]').forEach(function (a) { a.href = wa(a.getAttribute('data-wa-text')); });
    if (SHOP.tel) $$('[data-tel]').forEach(function (a) { a.href = 'tel:' + SHOP.tel; if (SHOP.telText) a.textContent = (a.getAttribute('data-tel-prefix') || '') + SHOP.telText; });
  });

  /* ---------- навигация: локальная полоса выезжает после первого экрана ---------- */
  safe('lnav', function () {
    var nav = $('[data-lnav]'), h1 = $('#hero-t'), bar = $('[data-progress]'), firstLight = $('main .light');
    var ul = $('#lnav-list'), btn = $('.menu-btn'), on = null, light = null;
    function setMenu(open) { ul.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open); }
    onFrame(function (y, vh) {
      var isOn = h1.getBoundingClientRect().bottom < 0;
      if (isOn !== on) {
        on = isOn; nav.classList.toggle('is-on', on);
        if (!on && ul.classList.contains('is-open')) setMenu(false);
      }
      /* над светлой частью полоса становится светлой */
      var isLight = !!firstLight && firstLight.getBoundingClientRect().top <= 26;
      if (isLight !== light) { light = isLight; nav.classList.toggle('is-light', light); }
      /* свой приём: золотая линия прогресса чтения страницы */
      var max = document.documentElement.scrollHeight - vh;
      bar.style.setProperty('--p', max > 0 ? clamp(y / max, 0, 1).toFixed(4) : '0');
    });
    nav.addEventListener('focusin', function () { nav.classList.add('is-on'); on = true; });
    btn.addEventListener('click', function () { setMenu(!ul.classList.contains('is-open')); });
    nav.addEventListener('focusout', function (e) { if (ul.classList.contains('is-open') && !nav.contains(e.relatedTarget)) setMenu(false); });
    ul.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', function (e) { if (ul.classList.contains('is-open') && !e.target.closest('.lnav')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ul.classList.contains('is-open')) { setMenu(false); btn.focus(); } });
  });

  /* ---------- свой приём: абзац «дочитывается» прокруткой, слово за словом ---------- */
  safe('fill', function () {
    var groups = $$('[data-fill]').map(function (el) {
      var words = [];
      (function split(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
          if (ch.nodeType === 1) { split(ch); return; }
          if (ch.nodeType !== 3) return;
          /* делим только по обычным пробелам: слова, склеенные &nbsp;, остаются вместе */
          var frag = document.createDocumentFragment();
          ch.nodeValue.split(/([ \t\r\n]+)/).forEach(function (part) {
            if (!part) return;
            if (/^[ \t\r\n]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part;
            frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, ch);
        });
      })(el);
      return { el: el, words: words, p: -1 };
    });
    if (!groups.length || reduceMotion.matches) return;
    var SOFT = 4;
    onFrame(function (y, vh) {
      groups.forEach(function (g) {
        var r = g.el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        /* начинаем у низа экрана, полностью проявляем, когда абзац поднялся на 65 % высоты:
           читать приходится уже чёткий текст, а не серый */
        var p = Math.round(clamp((vh * 0.92 - r.top) / (vh * 0.27), 0, 1) * 1000) / 1000;
        if (p === g.p) return;
        g.p = p;
        var n = g.words.length, f = p * (n + SOFT);
        g.words.forEach(function (w, i) { w.style.setProperty('--o', (0.45 + 0.55 * clamp((f - i) / SOFT, 0, 1)).toFixed(3)); });
      });
    });
  });

  /* ---------- свой приём: лента марок едет вместе с прокруткой ---------- */
  /* свой приём: часы поворачиваются, пока листаешь — готовая 3D-модель Rolex в закреплённом кадре.
     Золотые выноски тянутся к безелю, головке и браслету и прорисовываются вместе с подписью шага */
  safe('spin', function () {
    var sec = $('[data-spin]'); if (!sec) return;
    if (reduceMotion.matches || !window.WebGLRenderingContext || !window.ResizeObserver || !hasIO) { sec.classList.add('is-static'); return; }
    var canvas = $('.spin__canvas', sec), steps = $$('[data-spin-step]', sec), lines = $$('[data-call-line]', sec), tags = $$('[data-call-tag]', sec);
    var api = null, loading = false, k = -1;
    function load() {
      if (loading) return; loading = true;
      import('./3d/live.js').then(function (m) {
        api = m.mountSpinGlb(canvas, 'models/rolex.glb');
        api.ready.then(function () { sec.classList.add('is-live'); requestTick(); }, function (e) { if (window.console) console.error('MASDELLA: spin', e); sec.classList.add('is-static'); });
      }).catch(function (e) { if (window.console) console.error('MASDELLA: spin', e); sec.classList.add('is-static'); });
    }
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) load(); }, { rootMargin: '900px 0px' }).observe(sec);
    function callout(i, on) {
      var line = lines[i], tag = tags[i]; if (!line || !tag) return;
      line.classList.toggle('is-on', on); tag.classList.toggle('is-on', on);
      if (!on || !api) return;
      var a = api.anchor(i); if (!a) return;
      /* линия от детали к подписи; подпись всегда снаружи часов и внутри кадра */
      var w = canvas.clientWidth, h = canvas.clientHeight, tw = tag.offsetWidth, th = tag.offsetHeight, narrow = w < 600;
      var R = a.r + (narrow ? 8 : 18), run = narrow ? 12 : Math.min(48, w * 0.07);
      var roomR = w - (a.cx + R + run + tw + 12), roomL = a.cx - R - run - tw - 12;
      var side = i === 1 ? 1 : (a.x < a.cx ? -1 : 1);
      if (side > 0 && roomR < 0 && roomL > roomR) side = -1;
      if (side < 0 && roomL < 0 && roomR > roomL) side = 1;
      var ey = clamp(a.y + (a.y < a.cy ? -1 : 1) * Math.min(48, h * 0.06), 14, h - 14);
      var ex = a.cx + side * R;
      if (side * (a.x - ex) > -24) ex = a.x + side * 24;
      var tx = ex + side * run;
      line.setAttribute('d', 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + tx.toFixed(1) + ' ' + ey.toFixed(1));
      tag.style.textAlign = side < 0 ? 'right' : 'left';
      var lx = clamp(side > 0 ? tx + 8 : tx - tw - 8, 16, w - tw - 16);
      tag.style.transform = 'translate(' + Math.round(lx) + 'px,' + Math.round(ey - th / 2) + 'px)';
    }
    onFrame(function (y, vh) {
      var r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var p = clamp(-r.top / Math.max(r.height - vh, 1), 0, 1);
      if (api) api.draw(p);
      var nk = p < 0.4 ? 0 : (p < 0.75 ? 1 : 2);
      if (nk !== k) { k = nk; steps.forEach(function (st, i) { st.classList.toggle('is-on', i === k); }); }
      for (var i = 0; i < lines.length; i++) callout(i, i === k);
    });
  });

  /* свой приём: фото «на руке» раскрывается из рамки во весь экран */
  safe('scene', function () {
    var sc = $('.scene'), pic = sc && $('picture', sc); if (!pic || reduceMotion.matches) return;
    sc.classList.add('is-reveal');
    onFrame(function (y, vh) {
      var r = sc.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var p = clamp((vh - r.top) / (vh * 0.9), 0, 1);
      pic.style.setProperty('--k', (1 - easeInOut(p)).toFixed(4));
    });
  });

  safe('band', function () {
    var el = $('[data-band]'); if (!el || reduceMotion.matches) return;
    var box = el.parentNode;
    /* каждую марку — в свой span: та, что проезжает середину экрана, заливается светом, остальные остаются контуром */
    el.innerHTML = el.textContent.split('\u00b7').map(function (t) {
      var name = t.trim(); return name ? '<span class="band__w">' + esc(name) + '</span>' : '';
    }).filter(Boolean).join('\u00a0\u00b7 ') + '\u00a0\u00b7';
    var words = $$('.band__w', el);
    onFrame(function (y, vh) {
      var r = box.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      var span = Math.max(el.scrollWidth - box.clientWidth, 0);
      el.style.setProperty('--x', (-p * span * 0.75).toFixed(1) + 'px');
      var vw = box.clientWidth, mid = vw / 2;
      words.forEach(function (w) {
        var b = w.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - mid) / (vw * 0.42 + b.width / 2);
        var lit = clamp(1 - d, 0, 1); lit = lit * lit * (3 - 2 * lit);
        w.style.setProperty('--lit', lit.toFixed(3));
      });
    });
  });

  /* ---------- галерея «Главное» ---------- */
  safe('gallery', function () {
    var gal = $('[data-gal]'), track = $('[data-gal-track]'), dots = $('[data-gal-dots]'), play = $('[data-gal-play]');
    var slides = window.MD_HIGHLIGHTS || [], index = 0, timer = null, anim = null;
    var paused = reduceMotion.matches, inView = !hasIO, touching = false;
    /* html подписей — доверенный текст из data.js, только <em> и &nbsp; */
    track.innerHTML = slides.map(function (h, k) {
      var media = h.video
        ? '<video class="clip" muted playsinline preload="none" poster="video/' + esc(h.video) + '.jpg" aria-hidden="true">' +
          '<source src="video/' + esc(h.video) + '.mp4" type="video/mp4"></video>'
        : '<picture><source media="(max-width: 833px)" srcset="img/bw/' + esc(h.img) + '-tall.webp">' +
          '<img src="img/bw/' + esc(h.img) + '-wide.webp" alt="" width="1260" height="612" loading="lazy"></picture>';
      var go = h.cat ? '<a class="more" href="#katalog" data-go-tab="' + esc(h.cat) + '">Смотреть</a>' : '';
      return '<figure class="gal__item' + (h.video ? ' is-video' : '') + '" data-pos="' + esc(h.pos) + '" aria-label="Слайд ' + (k + 1) + ' из ' + slides.length + '">' +
        media + '<figcaption><span>' + h.html + go + '</span></figcaption></figure>';
    }).join('');
    dots.innerHTML = slides.map(function (h, k) { return '<button class="dot" type="button" aria-label="Слайд ' + (k + 1) + '"><i></i></button>'; }).join('');
    var items = $$('.gal__item', track), dotEls = $$('.dot', dots);
    if (!items.length) return;
    function videoOf(k) { return items[k] && items[k].querySelector('video'); }
    function stepMs(k) {
      var v = videoOf(k);
      return v && v.duration && isFinite(v.duration) ? Math.min(Math.max(v.duration * 1000, 3000), 9000) : GALLERY_STEP_MS;
    }
    function posOf(k) { return items[k].offsetLeft - items[0].offsetLeft; }
    function running() { return !paused && inView && !touching && !document.hidden; }
    function restartDot() {
      dotEls.forEach(function (d) { d.removeAttribute('aria-current'); });
      var d = dotEls[index]; if (!d) return;
      dots.style.setProperty('--dur', stepMs(index) + 'ms');
      void d.offsetWidth; d.setAttribute('aria-current', 'true');
    }
    function syncVideos(run) {
      items.forEach(function (it, k) {
        var v = videoOf(k); if (!v) return;
        if (k === index && run) {
          if (v.preload !== 'auto') v.preload = 'auto';
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else { v.pause(); if (k !== index) v.currentTime = 0; }
      });
    }
    function arm(restart) {
      clearTimeout(timer);
      var run = running();
      gal.classList.toggle('is-stopped', !run);
      syncVideos(run);
      /* по Tab попадаем только в ссылку видимого слайда */
      items.forEach(function (it, k) { var a = it.querySelector('a'); if (a) a.tabIndex = k === index ? 0 : -1; });
      if (restart) restartDot();
      if (run) timer = setTimeout(function () { go(index + 1); }, stepMs(index));
    }
    function stopAnim() {
      if (!anim) return;
      cancelAnimationFrame(anim); anim = null; track.style.scrollSnapType = '';
    }
    /* листание как у Apple: секунда, мягкий разгон и торможение */
    function glide(x) {
      x = clamp(x, 0, track.scrollWidth - track.clientWidth);
      stopAnim();
      var from = track.scrollLeft;
      if (reduceMotion.matches || Math.abs(x - from) < 1) { track.scrollLeft = x; return; }
      track.style.scrollSnapType = 'none';
      var t0 = null;
      anim = requestAnimationFrame(function step(t) {
        if (t0 === null) t0 = t;
        var k = clamp((t - t0) / GALLERY_MOVE_MS, 0, 1);
        track.scrollLeft = from + (x - from) * easeInOut(k);
        if (k < 1) anim = requestAnimationFrame(step);
        else { anim = null; track.style.scrollSnapType = ''; }
      });
    }
    function go(n) {
      index = (n + items.length) % items.length;
      userMoved = false;
      glide(posOf(index));
      arm(true);
    }
    function setPaused(p) {
      paused = p; touching = false;
      play.innerHTML = '<svg><use href="#i-' + (p ? 'play' : 'pause') + '"/></svg>';
      play.setAttribute('aria-label', p ? 'Листать автоматически' : 'Пауза');
      arm(true);
    }
    items.forEach(function (it, k) {
      var v = videoOf(k); if (!v) return;
      v.addEventListener('loadedmetadata', function () { if (k === index) arm(true); });
    });
    dots.addEventListener('click', function (e) { var d = e.target.closest('.dot'); if (d) { touching = false; go(dotEls.indexOf(d)); } });
    play.addEventListener('click', function () { setPaused(!paused); });
    /* Остановка только когда человек сам листает галерею. Колесо мыши вниз-вверх над галереей —
       это прокрутка страницы, её не считаем; клик мышью тоже не листает. */
    var userMoved = false, finger = false, wheelHold = false, lastScroll = 0, wheelT = null;
    function hold() { stopAnim(); userMoved = true; touching = true; clearTimeout(timer); gal.classList.add('is-stopped'); }
    function settle() {
      var x = track.scrollLeft, best = 0;
      items.forEach(function (it, k) { if (Math.abs(posOf(k) - x) < Math.abs(posOf(best) - x)) best = k; });
      index = best; userMoved = false; touching = false; wheelHold = false; arm(true);
    }
    track.addEventListener('touchstart', function () { stopAnim(); finger = true; }, { passive: true });
    track.addEventListener('pointerdown', function (e) { if (e.pointerType === 'pen') { stopAnim(); finger = true; } }, { passive: true });
    function lift() {
      finger = false;
      /* лента ещё доезжает по инерции — пересчитаем в конце прокрутки; не ехала — просто продолжаем */
      setTimeout(function () {
        if (anim || finger) return;
        if (userMoved && Date.now() - lastScroll > 150) settle();
        /* тап посреди автолистания остановил ленту между слайдами — доводим к текущему */
        else if (!userMoved && Math.abs(track.scrollLeft - posOf(index)) > 2) glide(posOf(index));
      }, 220);
    }
    track.addEventListener('touchend', lift, { passive: true });
    track.addEventListener('touchcancel', lift, { passive: true });
    track.addEventListener('pointerup', function (e) { if (e.pointerType === 'pen') lift(); }, { passive: true });
    /* колесо мыши вверх-вниз — это прокрутка страницы; листаем только горизонтальным жестом тачпада */
    track.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      wheelHold = true; hold();
      clearTimeout(wheelT);
      /* на крайнем слайде лента не едет — без этого галерея осталась бы на стопе */
      wheelT = setTimeout(function () { if (!anim && Date.now() - lastScroll > 300) settle(); }, 450);
    }, { passive: true });
    var scrollEnd;
    track.addEventListener('scroll', function () {
      if (anim) return;
      lastScroll = Date.now();
      if ((finger || wheelHold) && !userMoved) hold();
      clearTimeout(scrollEnd);
      scrollEnd = setTimeout(function () { if (userMoved && !finger) settle(); }, 160);
    }, { passive: true });
    /* стоп при фокусе — только с клавиатуры; клик мышью по «Смотреть ›» галерею не замораживает */
    gal.addEventListener('focusin', function (e) {
      var t = e.target; var kb = false; try { kb = t.matches(':focus-visible'); } catch (er) { kb = true; }
      if (kb) { touching = true; arm(false); }
    });
    gal.addEventListener('focusout', function (e) { if (gal.contains(e.relatedTarget)) return; touching = false; arm(true); });
    if (hasIO) new IntersectionObserver(function (es) { inView = es[es.length - 1].isIntersecting; arm(true); }, { threshold: 0.4 }).observe(gal);
    document.addEventListener('visibilitychange', function () { arm(!document.hidden); });
    onWidthChange(function () { stopAnim(); track.scrollLeft = posOf(index); });
    setPaused(paused);
  });

  /* ---------- «Рассмотреть ближе»: 3D-ракурсы и пилюли-свойства ---------- */
  safe('viewer', function () {
    var view = $('[data-view]'), list = $('[data-view-list]'), stage = $('[data-view-stage]');
    var nav = $('[data-view-nav]'), closeBtn = $('[data-view-close]'), txt = $('[data-view-txt]');
    var F = FEATURES; if (!F.length) return;
    var open = -1, color = 0, layers = Object.create(null), shown = null;
    var CARD_W = 352;

    function linkId() { var f = open >= 0 ? F[open] : F[0]; return f.ids.length > 1 ? (f.ids[color] || f.ids[0]) : f.ids[0]; }
    function body(f) {
      var sw = '';
      if (f.swatches && f.swatches.length > 1) {
        sw = '<div class="sws" role="group" aria-label="Модель">' + f.swatches.map(function (c, j) {
          return '<button class="sw" type="button" data-sw="' + j + '" style="--c:' + esc(c) + '" aria-label="' + esc((f.names || [])[j] || ('Цвет ' + (j + 1))) + '" aria-pressed="false"></button>';
        }).join('') + '<span data-sw-name></span></div>';
      }
      return '<b>' + esc(f.label) + '.</b> ' + esc(f.text) + sw + '<a class="more" href="#" data-open-link="' + esc(f.ids[0]) + '">Цена и заказ</a>';
    }
    list.innerHTML = F.map(function (f, k) {
      return '<div class="vi" data-k="' + k + '">' +
        '<div class="vi__hwrap"><div><button class="vi__head" type="button" aria-expanded="false" data-k="' + k + '">' + esc(f.label) + '</button></div></div>' +
        '<div class="vi__wrap"><div><div class="vi__in">' + body(f) + '</div></div></div></div>';
    }).join('');
    var vis = $$('.vi', list);
    stage.setAttribute('role', 'img');

    function imgName() {
      var f = open >= 0 ? F[open] : F[0];
      return f.imgs.length > 1 ? (f.imgs[color] || f.imgs[0]) : f.imgs[0];
    }
    function layer(name) {
      if (!layers[name]) {
        var w = document.createElement('div'); w.className = 'view__img'; w.setAttribute('aria-hidden', 'true');
        var im = new Image(); im.alt = ''; im.decoding = 'async'; im.width = 1500; im.height = 1000;
        im.src = 'img/r/' + name + '.webp';
        w.appendChild(im); stage.appendChild(w); layers[name] = w;
      }
      return layers[name];
    }
    function showImg() {
      var el = layer(imgName()), im = el.firstChild;
      var f = open >= 0 ? F[open] : F[0], names = F[0].names || [];
      stage.setAttribute('aria-label', 'Cartier Santos' + (f.imgs.length > 1 && names[color] ? ', ' + names[color].toLowerCase() + ' циферблат' : '') + (open > 0 ? ': ' + f.label.toLowerCase() : ''));
      if (shown === el) return;
      if (shown) shown.classList.remove('is-on');
      shown = el;
      function on() { if (shown === el) requestAnimationFrame(function () { el.classList.add('is-on'); }); }
      if (im.complete && im.naturalWidth) on(); else { im.onload = on; im.onerror = on; }
    }
    function syncColor() {
      var f = F[0], names = f.names || [];
      $$('[data-sw]', view).forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-sw') === color); });
      var it = byId[f.ids[color]] || byId[f.ids[0]];
      $$('[data-sw-name]', view).forEach(function (s) { s.textContent = (names[color] || '') + ' · ' + priceText(it); });
      var id = linkId();
      $$('.more[data-open-link]', view).forEach(function (a) { a.setAttribute('data-open-link', id); });
    }
    /* ширина пилюли — по тексту, открытая карточка — 352 px; меняется плавно */
    function widths() {
      vis.forEach(function (v, k) {
        if (phone.matches) { v.style.width = ''; return; }
        if (!v._w) { var h = $('.vi__head', v); h.style.width = 'max-content'; v._w = Math.ceil(h.getBoundingClientRect().width) + 1; h.style.width = ''; }
        v.style.width = (k === open ? Math.min(CARD_W, list.clientWidth || CARD_W) : v._w) + 'px';
      });
    }
    function setOpen(k, focus) {
      open = k;
      var any = open >= 0;
      vis.forEach(function (v, j) {
        var on = j === open, h = $('.vi__head', v);
        v.classList.toggle('is-open', on);
        h.setAttribute('aria-expanded', on);
        h.tabIndex = on && !phone.matches ? -1 : 0;
        /* у свёрнутой пилюли кнопки цвета и ссылка невидимы — Tab их пропускает */
        $('.vi__wrap', v).inert = !on || phone.matches;
      });
      nav.hidden = !any; closeBtn.hidden = !any;
      view.classList.toggle('is-open', any);
      txt.innerHTML = any ? body(F[open]) : '';
      syncColor(); widths(); showImg();
      if (!focus) return;
      if (any && !phone.matches) { var a = $('.vi.is-open .sw, .vi.is-open .more', list); if (a) a.focus({ preventScroll: true }); }
      if (any && phone.matches) { var p = vis[open]; if (p && list.scrollWidth > list.clientWidth) list.scrollTo({ left: p.offsetLeft - (list.clientWidth - p.offsetWidth) / 2, behavior: smooth() }); }
    }

    list.addEventListener('click', function (e) {
      var h = e.target.closest('.vi__head'); if (!h) return;
      var k = +h.getAttribute('data-k');
      setOpen(open === k ? -1 : k, true);
    });
    view.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sw]'); if (!b) return;
      color = +b.getAttribute('data-sw'); syncColor(); showImg();
    });
    /* «Покрутить в 3D»: живая модель вместо кадра, тянуть пальцем или мышью, стрелками с клавиатуры */
    var b3d = $('[data-view-3d]', view), dragHint = $('[data-view-drag]', view), live = null, liveCanvas = null, loading3d = false;
    function setLive(on) {
      b3d.setAttribute('aria-pressed', on); $('span', b3d).textContent = on ? 'Закрыть 3D' : 'Покрутить в\u00a03D';
      view.classList.toggle('is-live', on); dragHint.hidden = !on;
      if (!on) { if (live) live.destroy(); live = null; if (liveCanvas) liveCanvas.remove(); liveCanvas = null; return; }
      if (loading3d) return; loading3d = true;
      liveCanvas = document.createElement('canvas'); liveCanvas.className = 'view__live'; liveCanvas.tabIndex = 0;
      liveCanvas.setAttribute('role', 'img'); liveCanvas.setAttribute('aria-label', '3D-модель Rolex Day-Date. Тяните или нажимайте стрелки, чтобы повернуть');
      stage.appendChild(liveCanvas);
      import('./3d/live.js').then(function (m) {
        loading3d = false;
        if (!view.classList.contains('is-live')) { if (liveCanvas) liveCanvas.remove(); return; }
        live = m.mountDragGlb(liveCanvas, 'models/rolex.glb'); liveCanvas.focus({ preventScroll: true });
        /* модель весит несколько мегабайт — пока грузится, так и пишем */
        dragHint.textContent = 'Загружаем 3D…';
        live.ready.then(function () { dragHint.textContent = 'Тяните, чтобы повернуть'; setTimeout(function () { dragHint.hidden = true; }, 3500); },
          function (e) { if (window.console) console.error('MASDELLA: glb', e); setLive(false); });
      }).catch(function (e) { loading3d = false; if (window.console) console.error('MASDELLA: 3d', e); setLive(false); });
    }
    if (b3d && window.WebGLRenderingContext && window.ResizeObserver) b3d.addEventListener('click', function () { setLive(!view.classList.contains('is-live')); });
    else if (b3d) b3d.hidden = true;
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-step]'); if (!b) return;
      setOpen((open + +b.getAttribute('data-step') + F.length) % F.length, false);
      say(F[open].label);
    });
    closeBtn.addEventListener('click', function () {
      var was = open; setOpen(-1, false);
      var h = vis[was] && $('.vi__head', vis[was]); if (h) h.focus({ preventScroll: true });
    });
    view.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open >= 0) closeBtn.click(); });

    list.classList.add('is-static');
    setOpen(-1, false);
    requestAnimationFrame(function () { requestAnimationFrame(function () { list.classList.remove('is-static'); }); });
    function remeasure() { vis.forEach(function (v) { v._w = 0; }); setOpen(open, false); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    if (phone.addEventListener) phone.addEventListener('change', remeasure);
    var rt; onWidthChange(function () { clearTimeout(rt); rt = setTimeout(remeasure, 150); });
  });

  /* ---------- счётчики цифр ---------- */
  safe('count', function () {
    var els = $$('[data-count]');
    function run(el) {
      var to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null, dur = 1400;
      function fmt(n) { return Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ') + suf; }
      if (reduceMotion.matches) { el.textContent = fmt(to); return; }
      function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1); el.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    }
    if (!hasIO) { els.forEach(run); return; }
    var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } }); }, { threshold: 0.6 });
    els.forEach(function (el) { cio.observe(el); });
  });

  /* ---------- ленты карточек ---------- */
  safe('rails', function () {
    var models = $('[data-rail="models"]');
    if (models) models.innerHTML = MODELS.map(function (id) {
      var it = byId[id];
      return '<button class="rcard rcard--model' + (isStudio(it) ? ' is-studio' : '') + '" type="button" data-open="' + esc(id) + '"><span class="rcard__img"><img src="' + src(it) + '" alt="' + esc(it.name) + '" loading="lazy"></span>' +
        '<span class="rcard__t"><b>' + esc(it.name) + '.</b> ' + esc(it.line) + ' <span class="pr">' + priceText(it) + '</span></span></button>';
    }).join('');
    var cases = $('[data-rail="cases"]');
    if (cases) cases.innerHTML = CASES.map(function (id) {
      var it = byId[id];
      return '<button class="rcard" type="button" data-open="' + esc(id) + '"><span class="rcard__img"><img src="' + src(it) + '" alt="' + esc(it.name) + '" width="720" height="900" loading="lazy"></span>' +
        '<span class="rcard__t"><b>' + esc(it.name) + '.</b> ' + esc(it.line) + ' <span class="pr">' + priceFull(it) + '</span></span></button>';
    }).join('');
    var clients = $('[data-rail="clients"]');
    if (clients) clients.innerHTML = (window.MD_CLIENTS || []).map(function (img) {
      return '<figure class="rcard rcard--shot"><span class="rcard__img"><img src="img/k/' + esc(img) + '.webp" alt="Часы М78 на руке клиента, кадр из сторис" width="600" height="750" loading="lazy"></span></figure>';
    }).join('');
    $$('[data-rail-nav]').forEach(function (nav) {
      var rail = $('[data-rail="' + nav.getAttribute('data-rail-nav') + '"]'), btns = $$('button', nav);
      if (!rail) return;
      function update() {
        btns[0].disabled = rail.scrollLeft < 8;
        btns[1].disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
        nav.hidden = btns[0].disabled && btns[1].disabled;
      }
      nav.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var first = rail.firstElementChild, gap = parseFloat(getComputedStyle(rail).columnGap) || 20;
        var step = first ? first.getBoundingClientRect().width + gap : 300;
        rail.scrollBy({ left: step * +b.getAttribute('data-dir'), behavior: smooth() });
      });
      rail.addEventListener('scroll', update, { passive: true });
      onWidthChange(update);
      window.addEventListener('load', update);
      update();
    });
  });

  /* ---------- каталог ---------- */
  safe('catalog', function () {
    var tabs = $('[data-tabs]'), grid = $('[data-grid]'), active = 'all';
    tabs.innerHTML = CATS.map(function (c) { return '<button class="tab" type="button" data-cat="' + esc(c.id) + '" aria-pressed="' + (c.id === active) + '">' + esc(c.name) + '</button>'; }).join('');
    function card(it, k) {
      return '<button class="item" type="button" data-open="' + esc(it.id) + '" data-r style="--i:' + (k % 4) + '">' +
        '<span class="item__img' + (isPhoto(it) ? ' is-photo' : (isStudio(it) ? ' is-studio' : '')) + '"><img src="' + src(it) + '" alt="" loading="lazy">' +
        (it.badge ? '<span class="badge">' + esc(it.badge) + '</span>' : '') + '</span>' +
        '<span class="item__b"><span class="item__n">' + esc(it.name) + '</span><span class="item__l">' + esc(it.line) + '</span>' +
        '<span class="item__f"><span class="item__p">' + priceFull(it) + '</span><span class="item__go">Купить</span></span></span></button>';
    }
    var expanded = false;
    var moreBtn = document.createElement('button');
    moreBtn.type = 'button'; moreBtn.className = 'btn btn--line grid-more';
    grid.parentNode.insertBefore(moreBtn, grid.nextSibling);
    /* «Все»: часы разных марок вперемешку (Santos, Hublot, Rolex, Reward…), чтобы одна модель
       не шла пять раз подряд; кейсы и подарки — в конце */
    function mixed() {
      var groups = [], rest = [], tail = [];
      CATS.forEach(function (c) {
        if (c.id === 'all') return;
        var g = ITEMS.filter(function (it) { return it.cat === c.id && byId[it.id]; });
        if (c.id === 'keysy' || c.id === 'podarki') { tail = tail.concat(g); return; }
        groups.push(g.filter(function (it) { return !it.photoOnly; }));
        rest = rest.concat(g.filter(function (it) { return it.photoOnly; }));
      });
      var out = [];
      for (var i = 0; groups.some(function (g) { return g.length > i; }); i++) {
        groups.forEach(function (g) { if (g[i]) out.push(g[i]); });
      }
      return out.concat(rest, tail);
    }
    function render(instant) {
      var list = active === 'all' ? mixed() : ITEMS.filter(function (it) { return it.cat === active; });
      var cut = phone.matches && !expanded && list.length > 8;
      grid.innerHTML = (cut ? list.slice(0, 8) : list).map(card).join('');
      moreBtn.hidden = !cut;
      moreBtn.textContent = 'Показать все ' + list.length;
      $$('[data-r]', grid).forEach(function (el) { if (instant) el.classList.add('on'); else reveal(el); });
    }
    moreBtn.addEventListener('click', function () { expanded = true; render(true); });
    /* поворот телефона: если гость уже видел весь список, не сворачиваем его до 8 карточек */
    if (phone.addEventListener) phone.addEventListener('change', function () { if (grid.children.length > 8) expanded = true; render(true); });
    function setTab(cat) {
      var b = $('[data-cat="' + cat + '"]', tabs); if (!b) return;
      active = cat; expanded = false;
      $$('.tab', tabs).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      /* вкладка видна в полосе вкладок, страница при этом не прыгает */
      tabs.scrollLeft = Math.max(0, b.offsetLeft - (tabs.clientWidth - b.offsetWidth) / 2);
      render(true);
    }
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]'); if (!b) return;
      setTab(b.getAttribute('data-cat'));
      if (grid.getBoundingClientRect().top < 60) grid.scrollIntoView({ block: 'start' });
    });
    /* «Смотреть ›» на слайдах галереи ведёт в нужную вкладку каталога */
    document.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go-tab]'); if (!g) return;
      e.preventDefault(); g.blur(); setTab(g.getAttribute('data-go-tab'));
      $('#katalog').scrollIntoView({ behavior: smooth() });
    });
    render(false);
  });

  /* ---------- свой приём: «Сейчас открыто» по времени Шали (МСК) ---------- */
  safe('open-now', function () {
    var el = $('[data-open-now]'); if (!el || SHOP.open == null || SHOP.close == null) return;
    function hh(n) { return (n < 10 ? '0' : '') + n + ':00'; }
    function update() {
      var d = new Date(), t = ((d.getUTCHours() + 3) % 24) + d.getUTCMinutes() / 60;
      var isOpen = t >= SHOP.open && t < SHOP.close;
      el.textContent = isOpen ? 'Сейчас открыто · до ' + hh(SHOP.close) + ' по Москве'
        : 'Сейчас закрыто · откроемся ' + (t < SHOP.open ? 'сегодня' : 'завтра') + ' в ' + hh(SHOP.open) + ' по Москве';
      el.classList.toggle('is-open', isOpen);
      el.hidden = false;
    }
    update(); setInterval(update, 60000);
  });

  safe('start', function () { renderBag(); renderCart(); tick(); });
  window.addEventListener('load', requestTick);
  window.MD_READY = true;
})();
