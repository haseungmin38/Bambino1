// ============================================================
// 밤비노 쇼핑몰 데이터: 다음 주 데이터베이스 테이블로 옮기기 쉽도록 상단에 분리
// ============================================================
const products = [
  { id: 1, name: "맥캘란 12년 더블 캐스크", category: "싱글몰트", price: 129000, stock: 18, image: "img/products/product-1.webp", description: "부드러운 바닐라와 은은한 과일 향이 조화로운 싱글몰트 스타일의 예시 상품입니다." },
  { id: 2, name: "글렌피딕 15년", category: "싱글몰트", price: 189000, stock: 12, image: "img/products/product-2.webp", description: "풍부한 과일 향과 따뜻한 스파이스 노트를 표현한 예시 상품입니다." },
  { id: 3, name: "발베니 14년 캐리비안", category: "싱글몰트", price: 179000, stock: 9, image: "img/products/product-3.webp", description: "달콤한 토피와 부드러운 오크 풍미를 테마로 한 예시 상품입니다." },
  { id: 4, name: "조니워커 블랙 라벨", category: "블렌디드", price: 69000, stock: 25, image: "img/products/product-4.webp", description: "균형 잡힌 스모키함과 과일 향을 테마로 한 블렌디드 예시 상품입니다." },
  { id: 5, name: "시바스 리갈 12년", category: "블렌디드", price: 59000, stock: 30, image: "img/products/product-5.webp", description: "부드럽고 둥근 풍미를 표현한 블렌디드 예시 상품입니다." },
  { id: 6, name: "메이커스 마크", category: "버번", price: 49000, stock: 22, image: "img/products/product-6.webp", description: "바닐라와 캐러멜을 연상시키는 버번 스타일의 예시 상품입니다." },
  { id: 7, name: "버팔로 트레이스", category: "버번", price: 45000, stock: 16, image: "img/products/product-7.webp", description: "달콤한 오크와 스파이스를 테마로 한 버번 예시 상품입니다." },
  { id: 8, name: "제임슨 스탠다드", category: "아이리시", price: 39000, stock: 28, image: "img/products/product-8.webp", description: "가볍고 부드러운 곡물 향을 표현한 아이리시 스타일 예시 상품입니다." }
];

const memberTiers = [
  { level: 1, name: "브론즈", rate: 0.01, minPoints: 0, description: "기본 적립" },
  { level: 2, name: "실버", rate: 0.03, minPoints: 10000, description: "조금 더 쌓이는 포인트" },
  { level: 3, name: "골드", rate: 0.05, minPoints: 50000, description: "풍성한 포인트 혜택" },
  { level: 4, name: "플래티넘", rate: 0.07, minPoints: 100000, description: "최대 7% 적립" }
];

// 데모 데이터 저장소. 실제 서비스에서는 서버 인증/DB로 교체해야 합니다.
const STORAGE = { members: "bambino_members", current: "bambino_current", cart: "bambino_cart", orders: "bambino_orders" };
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let members = read(STORAGE.members, []);
let currentUserId = read(STORAGE.current, null);
let cart = read(STORAGE.cart, []);
let activeCategory = "전체";
let searchTerm = "";
let slideIndex = 0;
let slideTimer = null;

const $ = (selector) => document.querySelector(selector);
const money = (value) => new Intl.NumberFormat("ko-KR").format(value) + "원";
const getUser = () => members.find((member) => member.id === currentUserId) || null;
const getTier = (user) => memberTiers.slice().reverse().find((tier) => user && user.totalSpent >= tier.minPoints) || memberTiers[0];
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2300);
}
function updateHeader() {
  $("#cartCount").textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  const user = getUser();
  document.querySelectorAll('[data-view="mypage"]').forEach((el) => el.textContent = user ? "마이페이지" : "마이페이지");
  const login = document.querySelector('[data-view="login"]');
  if (login) login.textContent = user ? "로그아웃" : "로그인";
}
function renderTiers() {
  $("#tierCards").innerHTML = memberTiers.map(tier => `<div class="tier-card"><strong>${tier.name}</strong><span>${Math.round(tier.rate*100)}% 포인트 적립</span><small>${tier.description}</small></div>`).join("");
}
function renderProducts() {
  const filtered = products.filter(product =>
    (activeCategory === "전체" || product.category === activeCategory) &&
    (product.name.toLowerCase().includes(searchTerm) || product.category.toLowerCase().includes(searchTerm))
  );
  $("#productGrid").innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="product-image" data-detail="${product.id}" tabindex="0" role="button" aria-label="${escapeHTML(product.name)} 상세 보기"><img src="${product.image}" alt="${escapeHTML(product.name)} 상품 그림" loading="lazy"></div>
      <div class="product-info"><span class="product-category">${product.category}</span><h3>${escapeHTML(product.name)}</h3>
        <div class="product-bottom"><span class="price">${money(product.price)}</span><button class="add-cart" data-add="${product.id}" aria-label="${escapeHTML(product.name)} 장바구니 담기">＋</button></div>
      </div>
    </article>`).join("");
  $("#resultCount").textContent = `${filtered.length}개 상품`;
  $("#emptyState").classList.toggle("hidden", filtered.length !== 0);
}
function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll(".filter-chip").forEach(button => button.classList.toggle("active", button.dataset.category === category));
  renderProducts();
}
function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const found = cart.find(item => item.productId === id);
  if (found) {
    if (found.qty >= product.stock) return toast("재고 수량을 초과할 수 없습니다.");
    found.qty += 1;
  } else cart.push({ productId: id, qty: 1 });
  write(STORAGE.cart, cart); updateHeader(); toast("장바구니에 담았습니다.");
}
function showModal(content) {
  $("#modalContent").innerHTML = content;
  $("#modalBackdrop").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  $("#modalBackdrop").classList.add("hidden");
  document.body.style.overflow = "";
}
function openDetail(id) {
  const p = products.find(item => item.id === id); if (!p) return;
  showModal(`<h2>${escapeHTML(p.name)}</h2><div class="detail-view"><img src="${p.image}" alt="${escapeHTML(p.name)}"><div><span class="product-category">${p.category}</span><p>${escapeHTML(p.description)}</p><div class="price">${money(p.price)}</div><p>재고: ${p.stock}개</p><button class="solid-btn" data-add="${p.id}">장바구니 담기</button></div></div><p class="form-hint">수업용 예시 상품이며 실제 판매·배송하지 않습니다.</p>`);
}
function openSignup() {
  showModal(`<h2 id="modalTitle">밤비노 회원가입</h2><form class="form-stack" id="signupForm">
    <label>이름<input name="name" required maxlength="20" autocomplete="name" placeholder="이름"></label>
    <label>이메일<input name="email" type="email" required autocomplete="email" placeholder="name@example.com"></label>
    <label>비밀번호<input name="password" type="password" required minlength="4" autocomplete="new-password" placeholder="4자 이상"></label>
    <p class="form-hint">가입 즉시 3,000P가 지급됩니다. 데모에서는 비밀번호가 브라우저에 저장되므로 실제 비밀번호를 사용하지 마세요.</p>
    <button class="solid-btn">3,000P 받고 가입하기</button></form><p class="modal-switch">이미 회원이신가요? <button data-view="login">로그인</button></p>`);
}
function openLogin() {
  showModal(`<h2 id="modalTitle">로그인</h2><form class="form-stack" id="loginForm">
    <label>이메일<input name="email" type="email" required autocomplete="email"></label>
    <label>비밀번호<input name="password" type="password" required autocomplete="current-password"></label>
    <button class="solid-btn">로그인</button></form><p class="modal-switch">아직 회원이 아니신가요? <button data-view="signup">회원가입</button></p>`);
}
function openCart() {
  const rows = cart.map(item => {
    const p = products.find(product => product.id === item.productId); if (!p) return "";
    return `<div class="cart-item"><img src="${p.image}" alt=""><div><strong>${escapeHTML(p.name)}</strong><small>${money(p.price)}</small><div class="qty-control"><button data-qty="${p.id}" data-delta="-1" aria-label="수량 줄이기">−</button><span>${item.qty}</span><button data-qty="${p.id}" data-delta="1" aria-label="수량 늘리기">＋</button><button class="remove-btn" data-remove="${p.id}">삭제</button></div></div><b>${money(p.price*item.qty)}</b></div>`;
  }).join("");
  const total = cart.reduce((sum,item) => { const p=products.find(x=>x.id===item.productId); return sum+(p?p.price*item.qty:0); },0);
  showModal(`<h2 id="modalTitle">장바구니</h2>${rows ? `<div class="cart-list">${rows}</div><div class="cart-total"><span>상품 합계</span><span>${money(total)}</span></div><button class="solid-btn" style="width:100%" data-view="checkout">체험 결제 진행하기</button>` : `<p class="form-hint">장바구니가 비어 있습니다. 마음에 드는 상품을 담아보세요.</p><button class="solid-btn" data-view="shop">상품 둘러보기</button>`}<p class="form-hint">실제 결제는 진행되지 않습니다.</p>`);
}
function updateQty(id, delta) {
  const item = cart.find(x=>x.productId===id), product = products.find(x=>x.id===id);
  if (!item || !product) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x=>x.productId!==id);
  else if (item.qty > product.stock) { item.qty = product.stock; toast("재고 수량까지만 담을 수 있습니다."); }
  write(STORAGE.cart,cart); updateHeader(); openCart();
}
function removeCart(id) { cart=cart.filter(x=>x.productId!==id); write(STORAGE.cart,cart); updateHeader(); openCart(); }
function openCheckout() {
  const user = getUser();
  if (!user) { toast("체험 주문을 하려면 먼저 로그인해 주세요."); return openLogin(); }
  if (!cart.length) return openCart();
  const total = cart.reduce((sum,item)=>{const p=products.find(x=>x.id===item.productId);return sum+(p?p.price*item.qty:0);},0);
  showModal(`<h2 id="modalTitle">체험 주문 확인</h2><div class="mypage-stat"><small>주문 예정 금액</small><strong>${money(total)}</strong></div><p class="form-hint">이 화면은 수업용 체험 결제입니다. 카드 정보나 실제 결제는 받지 않습니다.</p><form class="form-stack" id="checkoutForm"><label>주문 메모 (선택)<input name="memo" maxlength="60" placeholder="주문 관련 메모"></label><button class="solid-btn">체험 주문 확정하기</button></form>`);
}
function openMypage() {
  const user=getUser();
  if (!user) { toast("로그인 후 이용할 수 있습니다."); return openLogin(); }
  const tier=getTier(user), orders=read(STORAGE.orders,[]).filter(order=>order.memberId===user.id);
  showModal(`<h2 id="modalTitle">마이페이지</h2><p><strong>${escapeHTML(user.name)}</strong>님, 반갑습니다.</p><div class="mypage-grid"><div class="mypage-stat"><small>회원 등급</small><strong>${tier.name}</strong></div><div class="mypage-stat"><small>보유 포인트</small><strong>${user.points.toLocaleString("ko-KR")}P</strong></div><div class="mypage-stat"><small>누적 구매액</small><strong>${money(user.totalSpent)}</strong></div><div class="mypage-stat"><small>적립률</small><strong>${Math.round(tier.rate*100)}%</strong></div></div><h3>주문 내역</h3>${orders.length ? orders.slice().reverse().map(order=>`<div class="order-row"><strong>${order.orderNo} · ${money(order.total)}</strong><span>${new Date(order.createdAt).toLocaleString("ko-KR")} · 체험 주문 완료 · ${order.items.length}개 상품</span></div>`).join("") : `<p class="form-hint">아직 주문 내역이 없습니다.</p>`}<button class="solid-btn" style="margin-top:18px" data-view="logout">로그아웃</button>`);
}
function completeCheckout(memo) {
  const user=getUser(); if(!user || !cart.length) return;
  const items=cart.map(item=>{const p=products.find(x=>x.id===item.productId);return {productId:item.productId,name:p.name,price:p.price,qty:item.qty};});
  const total=items.reduce((sum,item)=>sum+item.price*item.qty,0);
  const tier=getTier(user), earned=Math.floor(total*tier.rate);
  const orders=read(STORAGE.orders,[]);
  const order={orderNo:"BM"+Date.now().toString().slice(-8),memberId:user.id,items,total,earned,memo,createdAt:new Date().toISOString(),status:"체험 주문 완료"};
  orders.push(order); write(STORAGE.orders,orders);
  user.points+=earned; user.totalSpent+=total; members=members.map(m=>m.id===user.id?user:m); write(STORAGE.members,members);
  cart=[]; write(STORAGE.cart,cart); updateHeader(); closeModal();
  toast(`체험 주문 완료! ${earned.toLocaleString("ko-KR")}P 적립되었습니다.`);
}
function signup(form) {
  const data=new FormData(form), email=String(data.get("email")).trim().toLowerCase();
  if(members.some(member=>member.email===email)) return toast("이미 가입된 이메일입니다.");
  const member={id:"M"+Date.now(),name:String(data.get("name")).trim(),email,password:String(data.get("password")),points:3000,totalSpent:0,createdAt:new Date().toISOString()};
  members.push(member); write(STORAGE.members,members); currentUserId=member.id; write(STORAGE.current,currentUserId); updateHeader(); closeModal(); toast("가입 완료! 3,000P를 지급했습니다.");
}
function login(form) {
  const data=new FormData(form), email=String(data.get("email")).trim().toLowerCase(), password=String(data.get("password"));
  const member=members.find(m=>m.email===email && m.password===password);
  if(!member) return toast("이메일 또는 비밀번호를 확인해 주세요.");
  currentUserId=member.id; write(STORAGE.current,currentUserId); updateHeader(); closeModal(); toast(`${member.name}님, 환영합니다.`);
}
function logout() { currentUserId=null; write(STORAGE.current,null); updateHeader(); closeModal(); toast("로그아웃했습니다."); }

function setSlide(index) {
  const slides=[...document.querySelectorAll(".hero-slide")];
  slideIndex=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>slide.classList.toggle("active",i===slideIndex));
  [...$("#slideDots").children].forEach((dot,i)=>dot.classList.toggle("active",i===slideIndex));
}
function startSlider() {
  const dots=$("#slideDots");
  dots.innerHTML=[...document.querySelectorAll(".hero-slide")].map((_,i)=>`<button aria-label="${i+1}번 슬라이드" data-slide="${i}"></button>`).join("");
  setSlide(0); slideTimer=setInterval(()=>setSlide(slideIndex+1),6000);
}
function resetSlider() { clearInterval(slideTimer); slideTimer=setInterval(()=>setSlide(slideIndex+1),6000); }

document.addEventListener("click",event=>{
  const target=event.target.closest("button,a,[data-detail]");
  if(!target) return;
  if(target.dataset.view){
    event.preventDefault(); const view=target.dataset.view;
    if(view==="signup") openSignup(); else if(view==="login") openLogin(); else if(view==="cart") openCart(); else if(view==="mypage") openMypage(); else if(view==="checkout") openCheckout(); else if(view==="logout") logout(); else if(view==="shop"){closeModal();$("#products").scrollIntoView({behavior:"smooth"});}
  }
  if(target.dataset.add) addToCart(Number(target.dataset.add));
  if(target.dataset.detail) openDetail(Number(target.dataset.detail));
  if(target.dataset.category) setCategory(target.dataset.category);
  if(target.dataset.categoryLink){setCategory(target.dataset.categoryLink);$("#products").scrollIntoView({behavior:"smooth"});}
  if(target.dataset.qty) updateQty(Number(target.dataset.qty),Number(target.dataset.delta));
  if(target.dataset.remove) removeCart(Number(target.dataset.remove));
  if(target.dataset.slide){setSlide(Number(target.dataset.slide));resetSlider();}
});
document.addEventListener("submit",event=>{
  if(event.target.id==="searchForm"){event.preventDefault();searchTerm=$("#searchInput").value.trim().toLowerCase();renderProducts();$("#products").scrollIntoView({behavior:"smooth"});}
  if(event.target.id==="signupForm"){event.preventDefault();signup(event.target);}
  if(event.target.id==="loginForm"){event.preventDefault();login(event.target);}
  if(event.target.id==="checkoutForm"){event.preventDefault();completeCheckout(new FormData(event.target).get("memo"));}
});
$("#modalClose").addEventListener("click",closeModal);
$("#modalBackdrop").addEventListener("click",event=>{if(event.target.id==="modalBackdrop")closeModal();});
$("#prevSlide").addEventListener("click",()=>{setSlide(slideIndex-1);resetSlider();});
$("#nextSlide").addEventListener("click",()=>{setSlide(slideIndex+1);resetSlider();});
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("menu-open"));
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeModal();if(event.key==="Enter"&&event.target.matches("[data-detail]"))openDetail(Number(event.target.dataset.detail));});

renderProducts(); renderTiers(); updateHeader(); startSlider();
