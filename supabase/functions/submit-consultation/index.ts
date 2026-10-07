import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "https://thaibao123ab.github.io,http://127.0.0.1:4173,http://localhost:4173")
  .split(",")
  .map((value) => value.trim());

function corsHeaders(origin: string | null) {
  const allowed = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" }
  });
}

function cleanText(value: unknown, max: number) {
  return String(value ?? "").trim().replace(/[<>]/g, "").slice(0, max);
}

async function notifyZaloStaff(lead: { name: string; phone: string; market: string; message: string }) {
  const accessToken = Deno.env.get("ZALO_OA_ACCESS_TOKEN");
  const staffUserId = Deno.env.get("ZALO_STAFF_USER_ID");
  if (!accessToken || !staffUserId) return { sent: false, error: "Zalo OA chưa cấu hình" };

  const text = [
    "🔔 ĐĂNG KÝ TƯ VẤN MỚI - TRAENCO HUẾ",
    `Họ tên: ${lead.name}`,
    `Điện thoại: ${lead.phone}`,
    `Quan tâm: ${lead.market}`,
    `Lời nhắn: ${lead.message || "Không có"}`,
    "Mở trang quản trị để cập nhật trạng thái."
  ].join("\n");

  const response = await fetch("https://openapi.zalo.me/v3.0/oa/message/cs", {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: accessToken },
    body: JSON.stringify({ recipient: { user_id: staffUserId }, message: { text } })
  });
  const result = await response.json();
  if (!response.ok || result.error !== 0) {
    return { sent: false, error: result.message || `Zalo HTTP ${response.status}` };
  }
  return { sent: true, error: null };
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return json(origin, { error: "Phương thức không hợp lệ" }, 405);
  if (origin && !allowedOrigins.includes(origin)) return json(origin, { error: "Nguồn gửi không được phép" }, 403);

  try {
    const payload = await request.json();
    const name = cleanText(payload.name, 100);
    const phone = cleanText(payload.phone, 20).replace(/[ .-]/g, "");
    const market = cleanText(payload.market, 100);
    const message = cleanText(payload.message, 1500);
    const pageUrl = cleanText(payload.pageUrl, 500);
    const startedAt = Number(payload.formStartedAt || 0);

    if (!payload.consent) return json(origin, { error: "Cần đồng ý cho phép liên hệ tư vấn" }, 400);
    if (name.length < 2 || !/^0\d{9}$/.test(phone) || market.length < 2) {
      return json(origin, { error: "Thông tin đăng ký chưa hợp lệ" }, 400);
    }
    if (!startedAt || Date.now() - startedAt < 1500) return json(origin, { error: "Yêu cầu gửi quá nhanh" }, 429);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: recent } = await supabase
      .from("consultation_requests")
      .select("id")
      .eq("phone", phone)
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(1);
    if (recent?.length) return json(origin, { saved: true, duplicate: true, zaloSent: false });

    const { data: lead, error } = await supabase
      .from("consultation_requests")
      .insert({ name, phone, market, message, page_url: pageUrl, consent: true })
      .select("id")
      .single();
    if (error) throw error;

    const zalo = await notifyZaloStaff({ name, phone, market, message });
    await supabase
      .from("consultation_requests")
      .update({ zalo_notified: zalo.sent, zalo_error: zalo.error })
      .eq("id", lead.id);

    return json(origin, { saved: true, zaloSent: zalo.sent });
  } catch (error) {
    console.error(error);
    return json(origin, { error: "Hệ thống chưa thể nhận đăng ký. Vui lòng thử lại." }, 500);
  }
});
