/* TechNova interactive features */
(() => {
  "use strict";

  const CART_KEY = "technova_cart_v1";
  const WISH_KEY = "technova_wishlist_v1";
  const money = value => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(Number(value) || 0);

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  };
  let cart = read(CART_KEY, []);
  let wishlist = read(WISH_KEY, []);

  const save = () => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
    updateCartCount();
  };

  function toast(message) {
    let el = document.querySelector(".tn-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "tn-toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2300);
  }

  function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll(".cart-count").forEach(el => el.textContent = count);
  }

  function addToCart(name, price) {
    const found = cart.find(item => item.name === name);
    if (found) found.qty += 1;
    else cart.push({ name, price: Number(price), qty: 1 });
    save();
    toast(`${name} added to your cart`);
  }

  function renderCart() {
    let drawer = document.querySelector(".cart-drawer");
    if (!drawer) {
      drawer = document.createElement("aside");
      drawer.className = "cart-drawer";
      drawer.setAttribute("aria-label", "Shopping cart");
      drawer.innerHTML = `
        <div class="cart-backdrop"></div>
        <section class="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-heading">
          <div class="cart-heading"><div><span class="eyebrow">YOUR SELECTION</span><h2 id="cart-heading">Shopping cart</h2></div>
          <button class="cart-close" type="button" aria-label="Close cart">×</button></div>
          <div class="cart-items"></div>
          <div class="cart-bottom"><div class="cart-total"><span>Subtotal</span><strong class="cart-subtotal">₹0</strong></div>
          <p class="cart-note">Demo checkout — no payment will be collected.</p>
          <button class="button checkout-btn" type="button">Continue to checkout ↗</button></div>
        </section>`;
      document.body.appendChild(drawer);
      drawer.querySelector(".cart-backdrop").addEventListener("click", closeCart);
      drawer.querySelector(".cart-close").addEventListener("click", closeCart);
      drawer.querySelector(".checkout-btn").addEventListener("click", () => {
        if (!cart.length) return toast("Your cart is empty");
        toast("Demo checkout ready — this project does not process payments.");
      });
    }
    const items = drawer.querySelector(".cart-items");
    items.innerHTML = "";
    if (!cart.length) {
      items.innerHTML = '<div class="cart-empty"><span>🛒</span><h3>Your cart is empty</h3><p>Add something you like from the collection.</p></div>';
    } else {
      cart.forEach((item, index) => {
        const row = document.createElement("article");
        row.className = "cart-row";
        row.innerHTML = `
          <div class="cart-item-copy"><strong></strong><span></span></div>
          <div class="cart-item-controls">
            <button type="button" data-action="minus" data-index="${index}" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button type="button" data-action="plus" data-index="${index}" aria-label="Increase quantity">+</button>
            <button type="button" class="remove-item" data-action="remove" data-index="${index}" aria-label="Remove item">Remove</button>
          </div>`;
        row.querySelector("strong").textContent = item.name;
        row.querySelector(".cart-item-copy span").textContent = money(item.price);
        items.appendChild(row);
      });
    }
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    drawer.querySelector(".cart-subtotal").textContent = money(subtotal);
    items.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index), action = btn.dataset.action;
      if (!cart[i]) return;
      if (action === "plus") cart[i].qty += 1;
      if (action === "minus") cart[i].qty -= 1;
      if (action === "remove" || cart[i].qty <= 0) cart.splice(i, 1);
      save(); renderCart();
    }));
  }

  function openCart() {
    renderCart();
    document.querySelector(".cart-drawer").classList.add("open");
    document.body.classList.add("cart-open");
  }
  function closeCart() {
    document.querySelector(".cart-drawer")?.classList.remove("open");
    document.body.classList.remove("cart-open");
  }

  document.addEventListener("click", event => {
    const add = event.target.closest(".add-to-cart");
    if (add) addToCart(add.dataset.name || "TechNova product", add.dataset.price || 0);
    const wish = event.target.closest(".wishlist-btn");
    if (wish) {
      const name = wish.dataset.name;
      wishlist = wishlist.includes(name) ? wishlist.filter(x => x !== name) : [...wishlist, name];
      localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
      updateWishlistButtons();
      toast(wishlist.includes(name) ? "Added to wishlist" : "Removed from wishlist");
    }
    if (event.target.closest(".cart-trigger")) openCart();
  });

  function updateWishlistButtons() {
    document.querySelectorAll(".wishlist-btn").forEach(btn => {
      const active = wishlist.includes(btn.dataset.name);
      btn.classList.toggle("is-active", active);
      btn.textContent = active ? "♥" : "♡";
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  // Mobile navigation
  const menuButton = document.querySelector(".menu-toggle");
  if (menuButton) {
    menuButton.addEventListener("click", () => {
      const header = menuButton.closest(".site-header");
      const open = header.classList.toggle("menu-open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      menuButton.textContent = open ? "×" : "☰";
    });
  }

  // Collection search, category filtering and sorting
  const grid = document.querySelector(".products-grid");
  const search = document.querySelector("#product-search");
  const category = document.querySelector("#category-filter");
  const sort = document.querySelector("#price-sort");
  if (grid && search && category && sort) {
    const cards = [...grid.querySelectorAll(".product-card")];
    const originalOrder = new Map(cards.map((card, i) => [card, i]));
    function filterProducts() {
      const query = search.value.trim().toLowerCase();
      const selected = category.value;
      let visible = cards.filter(card => {
        const text = card.textContent.toLowerCase();
        const label = card.querySelector(".tile-label")?.textContent.toLowerCase() || "";
        const categoryMatch = selected === "all" ||
          (selected === "mobile" && label.includes("mobile")) ||
          (selected === "computing" && label.includes("work")) ||
          (selected === "audio" && (label.includes("audio") || label.includes("listen") || label.includes("sound"))) ||
          (selected === "accessories" && (label.includes("desk") || label.includes("setup"))) ||
          (selected === "create" && label.includes("create")) ||
          (selected === "desk" && label.includes("desk")) ||
          (selected === "sound" && label.includes("sound"));
        return text.includes(query) && categoryMatch;
      });
      if (sort.value === "low-high") visible.sort((a,b) => getPrice(a)-getPrice(b));
      if (sort.value === "high-low") visible.sort((a,b) => getPrice(b)-getPrice(a));
      if (sort.value === "name") visible.sort((a,b) => getName(a).localeCompare(getName(b)));
      if (sort.value === "default") visible.sort((a,b) => originalOrder.get(a)-originalOrder.get(b));
      cards.forEach(card => card.hidden = !visible.includes(card));
      visible.forEach(card => grid.appendChild(card));
      let empty = grid.querySelector(".no-results");
      if (!visible.length) {
        if (!empty) {
          empty = document.createElement("p");
          empty.className = "no-results";
          empty.textContent = "No products match your search. Try another keyword or category.";
          grid.appendChild(empty);
        }
      } else empty?.remove();
    }
    const getPrice = card => Number(card.querySelector(".price")?.textContent.replace(/[^\d]/g, "")) || 0;
    const getName = card => card.querySelector("h3")?.textContent.trim() || "";
    [search, category, sort].forEach(el => el.addEventListener("input", filterProducts));
    [search, category, sort].forEach(el => el.addEventListener("change", filterProducts));
  }

  // Contact form validation and demo success message
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", event => {
      event.preventDefault();
      const name = contactForm.querySelector('[name="name"]');
      const email = contactForm.querySelector('[name="email"]');
      const message = contactForm.querySelector('[name="message"]');
      if (!name?.value.trim() || !email?.value.trim() || !message?.value.trim()) {
        toast("Please complete your name, email and message.");
        return;
      }
      if (!email.checkValidity()) {
        toast("Please enter a valid email address.");
        email.focus();
        return;
      }
      toast("Thanks! Your demo message has been validated.");
      contactForm.reset();
    });
  }

  // Reveal elements as they enter the viewport.
  const revealTargets = document.querySelectorAll(".section, .product-card, .promise-card, .category-card, .offer-banner, .contact-panel, .contact-form");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealTargets.forEach(el => {
      el.classList.add("reveal");
      observer.observe(el);
    });
  }

  updateCartCount();
  updateWishlistButtons();
})();
