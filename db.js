// 밤비노 Supabase 연결 설정
// 브라우저에 공개해도 되는 Publishable key만 사용합니다.
const SUPABASE_URL = "https://mkcdewwhxkkfczvopxhv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_zD5dtbHPdsb49NJZQx2-UA_3duM6DFT";

// Supabase 클라이언트
const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// 다른 스크립트에서도 사용할 수 있도록 전역 객체에도 연결합니다.
window.db = db;

// 페이지가 열릴 때 shop_products 상품 수를 확인합니다.
(async function checkSupabaseConnection() {
  const { count, error } = await db
    .from("shop_products")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error(error.message);
    return;
  }

  console.log(`연결 성공: 상품 ${count ?? 0}개`);
})();
