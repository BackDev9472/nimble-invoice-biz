const allowedOrigins = [
  "http://localhost:3000",
  "https://project-echo-invoicing.vercel.app", //production
];

const getAllowedOrigin = (origin: string | null) => {
  if (!origin) return allowedOrigins[0]; // fallback to first allowed origin

  // Exact matches
  if (allowedOrigins.includes(origin)) return origin;

  // Vercel preview deployments pattern
  if (
    origin.match(
      /https:\/\/project-echo-invoicing-.*-walletpayteam\.vercel\.app/
    )
  ) {
    return origin;
  }

  return allowedOrigins[0];
};

export const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(origin), // or "*"
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info, Access-Control-Allow-Origin",
});

export const jsonHeaders = (origin: string | null) => ({
  ...corsHeaders(origin),
   "Content-Type": "application/json",
});
