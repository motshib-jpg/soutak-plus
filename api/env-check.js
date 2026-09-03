export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.status(200).json({
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_PUBLISHABLE_KEY: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY),
    REWARDED_AD_UNIT_PATH: Boolean(process.env.REWARDED_AD_UNIT_PATH)
  });
}
