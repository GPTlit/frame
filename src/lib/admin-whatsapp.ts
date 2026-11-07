export const ADMIN_PHONE_RAW = "+212 618-721281";
export const ADMIN_WHATSAPP_NUMBER = "212618721281";

export function createApprovalWhatsAppUrl(params: {
  username?: string | null | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  userId?: string | null | undefined;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const adminApprovalLink = `${origin}/admin?tab=members&approve=${encodeURIComponent(params.userId || "")}`;

  const message = `*FRAME Mauritania — Member Sign-In / Approval Request*

👤 *Username:* @${params.username || "member"}
📱 *Phone:* ${params.phone || "Not specified"}
✉️ *Email:* ${params.email || "Not specified"}
🆔 *User ID:* ${params.userId || "—"}

📝 *Message:*
Hello Admin, I have just signed in to FRAME Mauritania and am requesting membership approval and access.

🔗 *Direct Admin Approval Link:*
${adminApprovalLink}

_Please click the link above to review and approve or deny access in the control room._`;

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function notifyAdminOnSignIn(params: {
  username?: string | null;
  phone?: string | null;
  email?: string | null;
  userId?: string | null;
}) {
  const url = createApprovalWhatsAppUrl(params);
  if (typeof window !== "undefined") {
    // Attempt popup / new tab
    const win = window.open(url, "_blank");
    if (!win) {
      // If blocked by popup blocker, location fallback
      console.warn("WhatsApp window blocked by popup blocker, user can click manual button");
    }
  }
  return url;
}
