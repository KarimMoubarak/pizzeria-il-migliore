// script.js

// ── EU ALLERGENS LOOKUP (Reg. EU 1169/2001 Annex II) ──────────
const EU_ALLERGENS = {
  1:  "Cereali contenenti glutine e prodotti derivati (grano, segale, orzo, avena, farro, kamut)",
  2:  "Crostacei e prodotti a base di crostacei",
  3:  "Uova e prodotti a base di uova",
  4:  "Pesce e prodotti a base di pesce",
  5:  "Arachidi e prodotti a base di arachidi",
  6:  "Soia e prodotti a base di soia",
  7:  "Latte e prodotti a base di latte",
  8:  "Frutta a guscio e loro prodotti (mandorle, nocciole, noci, noci di acagiù, di pecan, del Brasile, pistacchi, noci macadamia)",
  9:  "Sedano e prodotti a base di sedano",
  10: "Senape e prodotti a base di senape",
  11: "Semi di sesamo e prodotti a base di sesamo",
  12: "Solfiti in concentrazioni superiori a 10 mg/kg",
  13: "Lupini e prodotti a base di lupini",
  14: "Molluschi e prodotti a base di molluschi"
};

// ── STARFIELD & SHOOTING STARS ────────────────────────────
for (let i = 0; i < 150; i++) {
  const star = document.createElement('div');
  star.className = 'star';
  star.style.top  = `${Math.random() * 100}vh`;
  star.style.left = `${Math.random() * 100}vw`;
  document.body.appendChild(star);
}

function createShootingStar() {
  const s = document.createElement('div');
  s.className = 'shooting-star';
  s.style.top  = `${Math.random() * 50}vh`;
  s.style.left = `${Math.random() * 100}vw`;
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1000);
}

setInterval(createShootingStar, 20000);

// ── ALLERGEN OVERLAY LOGIC ────────────────────────────────
function hideAllergenOverlay() {
  document.querySelectorAll('.allergen-overlay-card').forEach(el => el.remove());
}

function showAllergenOverlay(_, triggerElem) {
  hideAllergenOverlay();

  // description from data-desc, fallback to generic message
  const desc = triggerElem.dataset.desc
    || 'Nessun allergene o, se ne hai uno, non aggiungerlo';

  const card = document.createElement('div');
  card.className = 'allergen-overlay-card';
  card.textContent = desc;
  card.style.position = 'absolute';
  card.style.zIndex   = '10000';

  const rect = triggerElem.getBoundingClientRect();
  card.style.top  = `${rect.bottom + window.scrollY + 6}px`;
  card.style.left = `${rect.left   + window.scrollX}px`;

  // keep overlay open when clicked inside
  card.addEventListener('click', e => e.stopPropagation());
  document.body.appendChild(card);
}

function bindAllergenNumbers() {
  // remove old listeners
  document.querySelectorAll('.allergen-number').forEach(el => {
    const clone = el.cloneNode(true);
    el.replaceWith(clone);
  });

  // attach new click
  document.querySelectorAll('.allergen-number').forEach(elem => {
    elem.addEventListener('click', evt => {
      evt.stopPropagation();
      showAllergenOverlay(null, evt.currentTarget);
    });
  });
}

// clicking anywhere else closes the overlay
document.addEventListener('click', hideAllergenOverlay);

// ── INGREDIENTS DATA & STATE ──────────────────────────────
const ingredientsData = [
  ['Latticini','Brie',7,2], ['Latticini','Grana',7,2],
  ['Latticini','Mozzarella',7,2], ['Latticini','Mozzarelladibufala',7,2],
  ['Latticini','Panna',7,1], ['Latticini','Ricotta',7,2],
  ['Latticini','Scamorza',7,2], ['Pesceecrostacei','Acciughe',4,1],
  ['Pesceecrostacei','Fruttidimare',14,1], ['Pesceecrostacei','Gamberetti',2,1],
  ['Pesceecrostacei','Salmone',4,1], ['Salumiecarnifresche','Bresaola',null,1],
  ['Salumiecarnifresche','Kebab',null,1], ['Salumiecarnifresche','Pancetta',null,1],
  ['Salumiecarnifresche','Prosciuttocotto',null,1], ['Salumiecarnifresche','Prosciuttocrudo',null,1],
  ['Salumiecarnifresche','Salamepiccante',null,1], ['Salumiecarnifresche','Salsiccia',null,1],
  ['Salumiecarnifresche','Speck',null,1], ['Salumiecarnifresche','Wurstel',null,1],
  ['Verdureeortaggi','Carciofi',null,1], ['Verdureeortaggi','Cipolla',null,1],
  ['Verdureeortaggi','Insalataverde',null,1], ['Verdureeortaggi','Melanzane',null,1],
  ['Verdureeortaggi','Olive',null,1], ['Verdureeortaggi','Patatine',null,1],
  ['Verdureeortaggi','Peperoni',null,1], ['Verdureeortaggi','Pomodoro',null,0],
  ['Verdureeortaggi','Pomodorini',null,1], ['Verdureeortaggi','Radicchio',null,1],
  ['Verdureeortaggi','Rucola',null,1], ['Verdureeortaggi','Spinaci',null,1],
  ['Verdureeortaggi','Zucchine',null,1], ['Funghi','Funghi',null,1],
  ['Funghi','Funghiporcini',null,2], ['Condimentiespezie','Aglio',null,1],
  ['Condimentiespezie','Origano',null,1], ['Condimentiespezie','Peperoncino',null,1],
  ['Salseedressing','Salsa piccante',null,0], ['Salseedressing','Salsa bianca',7,0],
  ['Uova','Uovo',3,2]
];

const priceMap    = {};
const allergenMap = {};
ingredientsData.forEach(([_, name, allerg, price]) => {
  priceMap[name]    = price;
  allergenMap[name] = allerg;
});

const FREE_THRESHOLD   = 2;
const FREE_EXTRA_PRICE = 1;
let basePrice   = 0;
let totalPrice  = 0;
const baselineCounts = {};
const currentCounts  = {};

function cssSafe(str) {
  return str.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-_]/g, '');
}

function parsePrice(txt) {
  return parseFloat(
    txt.replace('€','')
       .replace(/\./g,'')
       .replace(',','.')
       .trim()
  );
}

const isDrinksPage = window.location.pathname.endsWith('drinks.html');

// ── INITIALIZE ON MENU PAGE ───────────────────────────────
if (!isDrinksPage) {
  const SKIP_TITLES = new Set(['Patatine Fritte', 'Nutella']);

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.menu-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent.trim();

      // skip cards whose title is in our set
      if (SKIP_TITLES.has(title)) {
        card.style.cursor = 'default';
        return;
      }

      card.style.cursor = 'pointer';
      card.addEventListener('click', cardClickHandler);
    });

    enhanceAllergenParagraphs();
    bindAllergenNumbers();
  });
}

// ── CARD CLICK HANDLER ────────────────────────────────────
function cardClickHandler(evt) {
  evt.stopPropagation();
  onPizzaCardClick(evt);
}

// ── CUSTOMIZER LOGIC ───────────────────────────────────────
function onPizzaCardClick(evt) {
  const cardElem = evt.currentTarget;
  basePrice      = parsePrice(cardElem.querySelector('.price').textContent);
  totalPrice     = basePrice;

  const ingLine = Array.from(cardElem.querySelectorAll('p'))
    .map(p => p.textContent)
    .find(txt => !/allerg/i.test(txt));

  buildBaseline(ingLine);
  initState();
  showCustomizer(cardElem.querySelector('h3').textContent);
}

function buildBaseline(csv) {
  Object.keys(priceMap).forEach(n => baselineCounts[n] = 0);
  csv.split(',')
    .map(s => s.trim().toLowerCase())
    .forEach(tok => {
      const key = Object.keys(priceMap)
        .find(n => n.toLowerCase() === tok);
      if (key) baselineCounts[key]++;
    });
}

function initState() {
  Object.keys(priceMap).forEach(n => {
    currentCounts[n] = baselineCounts[n] || 0;
  });
}

function showCustomizer(pizzaName) {
  // lock background scroll
  document.body.style.overflowY = 'hidden';
  document.getElementById('builder')?.remove();
  document.getElementById('fixed-price')?.remove();

  // overlay & builder card
  const overlay = document.createElement('div');
  overlay.id = 'builder';
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  const card = document.createElement('div');
  card.className = 'builder-card';
  overlay.appendChild(card);

  // exit button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close';
  closeBtn.textContent = '×';
  card.appendChild(closeBtn);
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    document.getElementById('fixed-price')?.remove();
    document.body.style.overflowY = 'auto';
  });

  // title
  const h1 = document.createElement('h1');
  h1.textContent = pizzaName;
  card.appendChild(h1);

  // ingredients grid
  const grid = document.createElement('section');
  grid.className = 'items-grid';
  card.appendChild(grid);

  ingredientsData.forEach(([_, name]) => {
    const ic = document.createElement('div');
    ic.className = 'menu-card';

    const title = document.createElement('h3');
    title.textContent = name;
    ic.appendChild(title);

    const qc = document.createElement('div');
    qc.className = 'quantity-controls';

    const btnRem = document.createElement('button');
    btnRem.textContent = '−';
    btnRem.onclick = () => {
      removeIngredient(name);
      renderCustomizer();
    };

    const spanQty = document.createElement('span');
    spanQty.className = 'quantity-display';
    spanQty.id = `qty-${cssSafe(name)}`;
    spanQty.textContent = currentCounts[name];

    const btnAdd = document.createElement('button');
    btnAdd.textContent = '+';
    btnAdd.onclick = () => {
      addIngredient(name);
      renderCustomizer();
    };

    qc.append(btnRem, spanQty, btnAdd);
    ic.appendChild(qc);

    // allergen paragraph – initial text
    const aP = document.createElement('p');
    aP.className = 'allergens';
    aP.textContent = 'Allergeni: ' +
      (allergenMap[name] != null ? allergenMap[name] : '–');
    ic.appendChild(aP);

    // price line
    const prP = document.createElement('p');
    prP.className = 'price';
    prP.textContent = priceMap[name] > 0
      ? `+€${priceMap[name]}`
      : `gratis fino a ${FREE_THRESHOLD}, poi +€${FREE_EXTRA_PRICE}`;
    ic.appendChild(prP);

    grid.appendChild(ic);
  });

  // total price bar
  const fixedBar = document.createElement('div');
  fixedBar.id = 'fixed-price';
  fixedBar.innerHTML = `
    Prezzo totale: €<span id="total-price">${totalPrice.toFixed(2)}</span>
  `;
  document.body.appendChild(fixedBar);

  // augment allergens & bind clicks
  enhanceAllergenParagraphs();
  bindAllergenNumbers();
}

function addIngredient(name) {
  currentCounts[name]++;
  const unitPrice = priceMap[name] > 0 ? priceMap[name] : FREE_EXTRA_PRICE;
  const freeUnits = priceMap[name] > 0 ? baselineCounts[name] : FREE_THRESHOLD;
  if (currentCounts[name] > freeUnits) totalPrice += unitPrice;
}

function removeIngredient(name) {
  if (currentCounts[name] === 0) return;
  const unitPrice = priceMap[name] > 0 ? priceMap[name] : FREE_EXTRA_PRICE;
  const freeUnits = priceMap[name] > 0 ? baselineCounts[name] : FREE_THRESHOLD;
  if (currentCounts[name] > freeUnits) totalPrice -= unitPrice;
  currentCounts[name]--;
}

function renderCustomizer() {
  Object.keys(priceMap).forEach(name => {
    document.getElementById(`qty-${cssSafe(name)}`)
      .textContent = currentCounts[name];
  });
  document.getElementById('total-price')
    .textContent = totalPrice.toFixed(2);
}

// ── ENHANCE ALLERGEN PARAGRAPHS ───────────────────────────
function enhanceAllergenParagraphs() {
  document.querySelectorAll('.allergens').forEach(p => {
    // strip existing text and any prior disclaimer
    const raw = p.textContent.replace(/Allergeni:/i, '').replace(/–.*/, '').trim();
    const nums = raw.split(',').map(n => n.trim()).filter(n => n && n !== '–');

    let html;
    if (nums.length) {
      html = nums.map(n => {
        const detail = EU_ALLERGENS[n];
        const desc   = detail
          ? `${n}. ${detail}`
          : 'Nessun allergene o, se ne hai uno, non aggiungerlo';
        return `<span class="allergen-number" data-desc="${desc}">${n}</span>`;
      }).join(', ');
    } else {
      // no allergen code present
      const desc = 'Nessun allergene o, se ne hai uno, non aggiungerlo';
      html = `<span class="allergen-number" data-desc="${desc}">–</span>`;
    }

    p.innerHTML = `Allergeni: ${html}`;
  });
}