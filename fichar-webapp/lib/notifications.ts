const slackWebhook = process.env.SLACK_WEBHOOK_URL;
const resendApiKey = process.env.RESEND_API_KEY;
const resendSender = process.env.RESEND_SENDER ?? "noreply@fichar.dev";

export async function notifySlack(message: string) {
  if (!slackWebhook) {
    console.info("[notifySlack] SLACK_WEBHOOK_URL no configurado");
    return;
  }
  await fetch(slackWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
}

export async function notifyEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    console.info("[notifyEmail] RESEND_API_KEY no configurado");
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendSender,
      to,
      subject,
      html,
    }),
  });
}
