import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const fromEmail = Deno.env.get("FROM_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendTeamInviteEmailRequest {
  recipientEmail: string;
  recipientName: string;
  role: string;
  inviteToken: string;
  inviterName: string;
  companyName?: string;
}

const roleDescriptions: Record<string, string[]> = {
  "Admin/Owner": [
    "Create & edit invoices",
    "Disable and re-enable invoice sharing link",
    "View financials",
    "Manage team & billing",
    "Full access to all features"
  ],
  "Billing": [
    "Create & edit invoices",
    "Disable and re-enable invoice sharing link",
    "View financials",
    "Manage billing settings"
  ],
  "Viewer": [
    "View reports",
    "Read-only access to invoices"
  ]
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      role,
      inviteToken,
      inviterName,
      companyName = "Project Echo"
    }: SendTeamInviteEmailRequest = await req.json();

    const inviteLink = `${Deno.env.get("APP_URL") || "http://localhost:3000"}/accept-invite/${inviteToken}`;
    const permissions = roleDescriptions[role] || [];
    const permissionsHtml = permissions.map(p => `<li style="margin-bottom: 8px;">✓ ${p}</li>`).join('');

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: `You've been invited to join ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 30px;">Team Invitation</h1>
          <p style="margin-bottom: 20px;">Hi ${recipientName},</p>
          <p style="margin-bottom: 30px;">
            <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> 
            as a <strong>${role}</strong>.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Role: ${role}</h3>
            <p style="margin-bottom: 10px;">As a ${role}, you will have access to:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${permissionsHtml}
            </ul>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${inviteLink}" 
               style="background-color: #4CAF50; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This invitation will expire in 7 days.
          </p>
          
          <p style="margin-top: 20px;">
            If you have any questions, please contact the person who invited you.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            This is an automated message. If you did not expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-team-invite-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

