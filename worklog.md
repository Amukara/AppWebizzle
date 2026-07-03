---
Task ID: 2
Agent: main
Task: Implement OTP phone verification for vendor & rider portal login

Work Log:
- Added OtpCode model to Prisma schema (phone, code, purpose, verified, expiresAt)
- Created src/lib/sms.ts — Africa's Talking integration with dev-mode fallback (logs code to console, returns in API response)
- Created src/lib/portal-auth.ts — HMAC-signed portal session tokens (mirrors admin auth pattern)
- Created /api/otp/send — generates 6-digit code, rate-limits (3/5min), sends SMS, returns devCode in dev mode
- Created /api/otp/verify — validates code, marks verified, issues 8hr session token
- Created src/components/brand/ui/otp-login-gate.tsx — shared 2-step OTP login component with InputOTP
- Replaced vendor-portal.tsx old LoginGate (vendor ID input) with OtpLoginGate (phone + OTP)
- Replaced rider-portal.tsx old login form (phone input, no auth) with OtpLoginGate (phone + OTP)
- Updated /api/portal/vendor to support phone-based lookup (for OTP-authenticated access)
- Updated /api/portal/rider GET to pre-fill name/plate from seeded rider pool on creation
- Modified VendorSignupPage and RiderSignupPage to trigger OTP after registration and show "Continue to portal" button
- Updated page.tsx to pass onNavigate to signup pages

Stage Summary:
- Full OTP flow tested E2E: send OTP → verify → portal lookup works
- Rider portal correctly pre-fills name/plate from seeded data
- Dev mode shows OTP code in UI for testing without real SMS
- For production: set AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME in .env.local