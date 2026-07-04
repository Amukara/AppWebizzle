"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/* ================================================================
   SHARED LAYOUT
   ================================================================ */
function LegalLayout({
  title,
  lastUpdated,
  children,
  onBack,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </Button>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
      </div>
      <div className="space-y-5 text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-2 scroll-mt-20">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 pl-2 border-l-2 border-brand/20">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-foreground/85">{children}</p>;
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1 text-sm text-foreground/85">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/* ================================================================
   PRIVACY POLICY
   ================================================================ */
export function PrivacyPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="4 July 2026"
      onBack={() => onNavigate("home")}
    >
      <Section title="Introduction">
        <P>
          WeBizzle (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the webizzle.co.ke
          platform and mobile applications (collectively, the &quot;Platform&quot;). We are committed
          to protecting your personal data and your right to privacy. This Privacy Policy explains
          how we collect, use, disclose, store and protect your information when you use our
          Platform, place orders, register as a vendor or rider, or otherwise interact with us.
        </P>
        <P>
          WeBizzle is registered in Kenya and complies with the Data Protection Act, 2019 and the
          Kenya Information and Communications (Amendment) Act, 2013. By using our Platform, you
          consent to the practices described in this policy. If you do not agree, please do not
          use the Platform.
        </P>
      </Section>

      <Section title="Information We Collect">
        <SubSection title="Information you provide directly">
          <Bullets
            items={[
              "Account details: full name, phone number, email address, and profile photo when you register as a customer, vendor, or rider.",
              "Order information: delivery address, GPS location coordinates, customer name, phone number, and order items.",
              "Payment information: M-Pesa phone number used for transactions. We do not collect or store your M-Pesa PIN.",
              "Vendor verification documents: trade licence, municipal permit, KPLC token receipt, and shop logo uploaded during vendor registration.",
              "Rider verification data: full name, phone number, bike registration number, stage number, location area, and selfie photo for identity verification.",
              "Communication data: messages sent through our in-app chat, support requests, and WhatsApp correspondence.",
              "Referral information: referral codes you create or use, and referral activity.",
              "Receipt submissions: photos of purchase receipts you upload for token rewards.",
            ]}
          />
        </SubSection>
        <SubSection title="Information collected automatically">
          <Bullets
            items={[
              "Device information: device type, operating system, browser type, screen resolution, and unique device identifiers.",
              "Usage data: pages visited, features used, click patterns, session duration, and time spent on the Platform.",
              "Location data: GPS coordinates collected when you use the delivery address picker or live order tracking.",
              "Log data: IP address, access times, referring URLs, and error logs.",
            ]}
          />
        </SubSection>
        <SubSection title="Information from third parties">
          <Bullets
            items={[
              "M-Pesa payment confirmation from Safaricom via STK push and callback APIs.",
              "Delivery status updates from riders and vendors through the Platform.",
              "SMS delivery reports from Africa&apos;s Talking or our communications provider.",
            ]}
          />
        </SubSection>
      </Section>

      <Section title="How We Use Your Information">
        <P>We process your personal data for the following purposes:</P>
        <Bullets
          items={[
            "To provide, operate, maintain and improve our Platform and services.",
            "To process and fulfil your orders, including matching you with vendors and riders.",
            "To facilitate M-Pesa payments and provide order confirmations.",
            "To verify the identity of vendors and riders during registration and onboarding.",
            "To communicate with you about orders, deliveries, promotions, and platform updates via SMS, in-app notifications, or WhatsApp.",
            "To provide live order tracking and delivery ETA updates.",
            "To detect, prevent and address fraud, disputes, and security issues.",
            "To generate anonymised price intelligence, market analytics, and savings reports.",
            "To administer referral programmes, receipt token rewards, and boost campaigns.",
            "To comply with Kenyan law, including tax obligations and regulatory requirements.",
            "To respond to your support requests and resolve complaints.",
          ]}
        />
      </Section>

      <Section title="Data Sharing and Disclosure">
        <P>We do not sell your personal data. We may share your information with:</P>
        <Bullets
          items={[
            "Vendors: your delivery name, phone number, and order details necessary to fulfil your order.",
            "Riders: your delivery address (or GPS coordinates), phone number, and order details for delivery purposes.",
            "Payment processors: Safaricom/M-Pesa for payment facilitation.",
            "SMS providers: Africa&apos;s Talking for delivering OTP codes and order notifications.",
            "Law enforcement: when required by Kenyan law, court order, or regulatory authority.",
            "Professional advisors: lawyers, auditors, and accountants bound by confidentiality obligations.",
          ]}
        />
      </Section>

      <Section title="Data Storage and Security">
        <P>
          Your data is stored on secure servers and protected using industry-standard encryption
          (TLS in transit, AES at rest). Our database is hosted in a controlled-access environment.
          We implement access controls, audit logging, and regular security reviews. However, no
          method of electronic transmission or storage is 100% secure, and we cannot guarantee
          absolute security.
        </P>
        <P>
          We retain your personal data for as long as your account is active or as needed to provide
          services. Order records are retained for a minimum of 7 years for tax and compliance
          purposes. Rider verification selfies and vendor documents are retained for the duration
          of the vendor/rider relationship and for 3 years thereafter.
        </P>
      </Section>

      <Section title="Your Rights Under the Data Protection Act">
        <P>Under Kenyan law, you have the right to:</P>
        <Bullets
          items={[
            "Access: request a copy of the personal data we hold about you.",
            "Rectification: request correction of inaccurate or incomplete data.",
            "Erasure: request deletion of your personal data, subject to legal retention obligations.",
            "Restriction: request that we limit how we process your data.",
            "Data portability: request your data in a structured, machine-readable format.",
            "Object: object to processing based on legitimate interests or direct marketing.",
            "Withdraw consent: withdraw your consent at any time where processing is based on consent.",
          ]}
        />
        <P>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:privacy@webizzle.co.ke" className="text-brand hover:underline">
            privacy@webizzle.co.ke
          </a>{" "}
          or WhatsApp us at{" "}
          <a href="https://wa.me/254731371521" className="text-brand hover:underline" target="_blank" rel="noreferrer">
            0731 371 521
          </a>
          . We will respond within 21 days as required by law.
        </P>
      </Section>

      <Section title="Cookies and Tracking">
        <P>
          We use essential cookies and local storage to maintain your session, shopping cart, and
          preferences. We do not use advertising cookies. We may use analytics tools to understand
          Platform usage in aggregate. You can control cookie settings through your browser.
        </P>
      </Section>

      <Section title="Children's Privacy">
        <P>
          Our Platform is not directed at persons under 18 years of age. We do not knowingly
          collect personal data from children. If we discover that a child has provided us with
          personal data, we will delete it promptly.
        </P>
      </Section>

      <Section title="Changes to This Policy">
        <P>
          We may update this Privacy Policy from time to time. Material changes will be notified
          via in-app notification or SMS at least 30 days before taking effect. Your continued use
          of the Platform after changes become effective constitutes acceptance of the revised policy.
        </P>
      </Section>

      <Section title="Contact Us">
        <P>
          For any privacy-related questions or complaints, contact our Data Protection Officer:
        </P>
        <Card className="p-4 text-sm space-y-1">
          <p className="font-semibold">WeBizzle Data Protection Officer</p>
          <p>Email: <a href="mailto:privacy@webizzle.co.ke" className="text-brand hover:underline">privacy@webizzle.co.ke</a></p>
          <p>WhatsApp: <a href="https://wa.me/254731371521" className="text-brand hover:underline" target="_blank" rel="noreferrer">0731 371 521</a></p>
          <p>Address: Webuye, Westlands, Nairobi, Kenya</p>
        </Card>
      </Section>
    </LegalLayout>
  );
}

/* ================================================================
   TERMS AND CONDITIONS
   ================================================================ */
export function TermsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <LegalLayout
      title="Terms &amp; Conditions"
      lastUpdated="4 July 2026"
      onBack={() => onNavigate("home")}
    >
      <Section title="Introduction">
        <P>
          These General Terms and Conditions (&quot;Terms&quot;) govern your use of the WeBizzle
          platform accessible at webizzle.co.ke and our mobile applications (collectively, the
          &quot;Platform&quot;). WeBizzle is a neighbourhood e-commerce marketplace that connects
          customers with local vendors (dukas, Mama Mbogas, pharmacies, bakeries, hardware stores,
          butcheries, electronics shops, and agrovets) and delivery riders in Kenya.
        </P>
        <P>
          By accessing or using the Platform, you agree to be bound by these Terms. If you do not
          agree, please do not use the Platform. These Terms apply to customers, vendors, riders,
          and any other users of the Platform.
        </P>
      </Section>

      <Section title="Registration and Account">
        <P>
          To place orders, you may use the Platform as a guest or register an account. To register
          as a vendor or rider, you must provide accurate and complete information including your
          full name, phone number, and any verification documents we require.
        </P>
        <Bullets
          items={[
            "You must be at least 18 years old to register as a vendor or rider.",
            "You must provide a valid Kenyan phone number for M-Pesa transactions and OTP verification.",
            "You are responsible for maintaining the confidentiality of your account credentials.",
            "You must immediately notify us of any unauthorised use of your account.",
            "We reserve the right to suspend or terminate accounts that violate these Terms.",
            "Vendor and rider accounts require approval through our verification process.",
          ]}
        />
      </Section>

      <Section title="Terms and Conditions of Sale">
        <SubSection title="Product listings and pricing">
          <P>
            All product prices are listed in Kenyan Shillings (KES) and are set by individual
            vendors. WeBizzle displays prices for comparison purposes and does not set or guarantee
            prices. Vendors may update prices at any time. The price applicable to your order is
            the price displayed at the time of checkout.
          </P>
          <P>
            Our Smart Basket feature compares prices across multiple vendors and recommends the
            cheapest single-vendor option. Price comparisons are based on data available at the
            time of search and may not reflect real-time changes.
          </P>
        </SubSection>
        <SubSection title="Order placement">
          <P>
            When you place an order, you are making an offer to purchase from the selected vendor.
            An order is confirmed when the vendor accepts it. We reserve the right to cancel
            orders that appear to be fraudulent, erroneous, or that violate these Terms.
          </P>
        </SubSection>
        <SubSection title="Delivery">
          <Bullets
            items={[
              "Delivery times are estimates (typically 15–35 minutes) and are not guaranteed.",
              "Delivery is available within our listed coverage areas (currently Webuye, Westlands, and Wendani).",
              "Delivery fees are set by vendors and displayed before checkout.",
              "The customer is responsible for providing an accurate delivery address or GPS location.",
              "If the rider cannot reach you at the provided location after 2 attempts, the order may be returned to the vendor.",
            ]}
          />
        </SubSection>
        <SubSection title="Product availability">
          <P>
            All products are subject to availability. If a vendor cannot fulfil an item in your
            order, they will notify you before dispatch. You may accept a substitution, remove the
            item, or cancel the entire order.
          </P>
        </SubSection>
      </Section>

      <Section title="Returns and Refunds">
        <P>
          Returns and refunds are governed by the following policy, in compliance with the
          Consumer Protection Act, 2012:
        </P>
        <Bullets
          items={[
            "Perishable goods (fresh produce, baked goods) cannot be returned once delivered due to food safety regulations.",
            "Non-perishable items may be returned within 24 hours of delivery if they are defective, damaged, or not as described.",
            "To request a return or refund, contact us via WhatsApp within 2 hours of delivery and provide your M-Pesa code as proof of purchase.",
            "Refunds are processed via M-Pesa to the phone number used for the original payment within 48 hours of approval.",
            "Delivery fees are non-refundable except where the vendor is at fault (wrong item, damaged goods).",
            "If a vendor fails to deliver an order without valid reason, a full refund (including delivery fee) will be issued.",
            "Disputes between customers and vendors will be reviewed by our support team, whose decision is final.",
          ]}
        />
      </Section>

      <Section title="Payments">
        <P>
          All payments on the Platform are processed via M-Pesa (Safaricom). By using our Platform,
          you acknowledge and agree that:
        </P>
        <Bullets
          items={[
            "Payment is initiated through the M-Pesa STK push on your registered phone number.",
            "You must enter your M-Pesa PIN on your own device. WeBizzle never collects, stores, or has access to your M-Pesa PIN.",
            "An order is only confirmed upon successful M-Pesa payment. WeBizzle does not offer credit or pay-later services.",
            "The M-Pesa confirmation code (Lipa Na M-Pesa Online) serves as your proof of payment.",
            "Platform fees (3% on orders above KES 300) and rider levies (10% of delivery fee) are deducted automatically from vendor and rider payouts respectively.",
            "Vendors receive their payout (subtotal minus platform fee) instantly via M-Pesa upon order completion.",
            "Riders receive their payout (delivery fee minus rider levy) weekly via M-Pesa.",
          ]}
        />
      </Section>

      <Section title="Store Credit">
        <P>
          WeBizzle may issue store credit or token rewards through the following programmes:
        </P>
        <Bullets
          items={[
            "Receipt token rewards: 10 tokens per approved receipt submission. Tokens may be redeemed for discounts on future orders.",
            "Referral rewards: earn KES credit when your referral code is used by new customers who place qualifying orders.",
            "Promotional credits: store credit issued through special promotions, which may have expiry dates and usage conditions.",
            "Store credit is non-transferable, has no cash value, and cannot be exchanged for cash.",
            "Unused store credit expires 12 months from the date of issue unless otherwise stated.",
          ]}
        />
      </Section>

      <Section title="Promotions">
        <P>
          WeBizzle and its vendors may run promotional campaigns from time to time. The following
          terms apply:
        </P>
        <Bullets
          items={[
            "Promotions are subject to availability and may be modified or withdrawn at any time without prior notice.",
            "Each promotion has specific terms, including eligibility criteria, validity period, and any minimum spend requirements.",
            "Promotions cannot be combined unless explicitly stated.",
            "Promotional discounts apply to the product price only and not to delivery fees unless stated.",
            "WeBizzle reserves the right to void orders that abuse promotional offers.",
            "Boost campaigns (paid vendor promotions) are subject to the Boost Campaign Terms available on request.",
          ]}
        />
      </Section>

      <Section title="Rules About Your Content">
        <P>
          &quot;Your Content&quot; means any text, images, logos, documents, reviews, or other
          materials you submit to the Platform, including:
        </P>
        <Bullets
          items={[
            "Vendor shop names, logos, product listings, and descriptions.",
            "Verification documents (trade licences, permits, KPLC receipts).",
            "Rider selfies and identification documents.",
            "Customer reviews, ratings, and feedback.",
            "Receipt photos submitted for token rewards.",
            "Chat messages sent through our in-app support or vendor/rider communication features.",
          ]}
        />
        <P>You must not upload content that:</P>
        <Bullets
          items={[
            "Is false, misleading, deceptive, or fraudulent.",
            "Infringes any third-party intellectual property rights.",
            "Is defamatory, obscene, offensive, hateful, or discriminatory.",
            "Contains viruses, malware, or any harmful code.",
            "Violates any applicable Kenyan law or regulation.",
            "Impersonates any person or entity.",
          ]}
        />
      </Section>

      <Section title="Our Rights to Use Your Content">
        <P>
          By submitting content to the Platform, you grant WeBizzle a non-exclusive, royalty-free,
          worldwide, transferable licence to use, reproduce, modify, adapt, publish, translate,
          distribute, and display your content for the following purposes:
        </P>
        <Bullets
          items={[
            "Displaying your content on the Platform (e.g. vendor shop profiles, product listings, rider profiles).",
            "Using vendor logos and shop names in marketing materials, social media, and promotional content with vendor consent.",
            "Anonymising and using order and pricing data for market analytics, price intelligence, and savings calculations.",
            "Improving our Platform, algorithms, and recommendation systems.",
            "Complying with legal obligations and responding to lawful requests from authorities.",
          ]}
        />
        <P>
          Rider selfie photos are used solely for identity verification during registration and
          are not shared publicly or used for marketing without explicit consent.
        </P>
      </Section>

      <Section title="Use of Website and Mobile Applications">
        <P>You agree to use the Platform only for lawful purposes and in accordance with these Terms. You must not:</P>
        <Bullets
          items={[
            "Use the Platform in any way that violates any applicable local, national, or international law or regulation.",
            "Attempt to gain unauthorised access to any part of the Platform, other accounts, computer systems, or networks connected to the Platform.",
            "Interfere with or disrupt the Platform or servers or networks connected to the Platform.",
            "Use automated means (bots, scrapers, crawlers) to access or collect data from the Platform without our written permission.",
            "Introduce any viruses, trojans, worms, logic bombs, or other malicious material.",
            "Attempt to manipulate prices, ratings, reviews, or any Platform algorithms.",
            "Create multiple accounts for fraudulent purposes.",
            "Reverse-engineer, decompile, or disassemble any part of the Platform.",
            "Use the Platform to solicit business from vendors or riders outside of the Platform.",
          ]}
        />
      </Section>

      <Section title="Copyright and Trademarks">
        <P>
          All content on the Platform, including but not limited to text, graphics, logos, icons,
          images, audio clips, software, and their compilation (the &quot;Content&quot;) is the
          property of WeBizzle or its content suppliers and is protected by Kenyan and international
          copyright, trademark, and other intellectual property laws.
        </P>
        <Bullets
          items={[
            "The WeBizzle name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of WeBizzle.",
            "You may not use, reproduce, modify, or distribute any Content without our prior written consent.",
            "Vendor and rider content remains the property of the respective vendor or rider. By submitting content, you grant us the licence described in the \"Our Rights to Use Your Content\" section above.",
            "Unauthorised use of the Platform or its Content may violate copyright, trademark, and other laws.",
          ]}
        />
      </Section>

      <Section title="Data Privacy">
        <P>
          Your use of the Platform is also governed by our{" "}
          <button
            type="button"
            className="text-brand hover:underline font-medium"
            onClick={() => onNavigate("privacy")}
          >
            Privacy Policy
          </button>
          , which is incorporated into these Terms by reference. By using the Platform, you
          consent to the collection and use of your information as described in the Privacy Policy.
        </P>
      </Section>

      <Section title="Due Diligence and Audit Rights">
        <P>
          WeBizzle and its authorised representatives reserve the right to conduct audits and due
          diligence checks on vendors and riders, including but not limited to:
        </P>
        <Bullets
          items={[
            "Verifying the accuracy of vendor registration documents and licences.",
            "Confirming rider identity documents and bike registration details.",
            "Reviewing order and transaction records for compliance and fraud prevention.",
            "Requesting additional documentation or information as reasonably required.",
            "Conducting on-site visits to vendor premises with prior notice.",
          ]}
        />
        <P>
          Vendors and riders must cooperate fully with any audit or due diligence request.
          Failure to cooperate may result in account suspension or termination.
        </P>
      </Section>

      <Section title="WeBizzle's Role as a Marketplace">
        <P>
          WeBizzle is an online marketplace that connects customers with independent third-party
          vendors and riders. It is important to understand:
        </P>
        <Bullets
          items={[
            "WeBizzle is not a party to the sale contract between you and the vendor. The vendor is solely responsible for the quality, safety, and legality of the products they sell.",
            "WeBizzle does not endorse, guarantee, or assume responsibility for any product listed on the Platform or any vendor's ability to fulfil orders.",
            "Riders are independent contractors, not employees of WeBizzle. WeBizzle is not responsible for the actions or omissions of riders during delivery.",
            "Product descriptions, images, and prices are provided by vendors and WeBizzle does not verify the accuracy of all such information.",
            "WeBizzle facilitates the transaction and delivery process but does not take title to or ownership of any products.",
          ]}
        />
      </Section>

      <Section title="Limitations and Exclusions of Liability">
        <P>
          To the maximum extent permitted by Kenyan law:
        </P>
        <Bullets
          items={[
            "The Platform is provided on an \"as is\" and \"as available\" basis. We make no representations or warranties of any kind, whether express or implied, regarding the Platform's operation, accuracy, reliability, or availability.",
            "WeBizzle shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from or related to your use of the Platform.",
            "WeBizzle's total liability for any claims arising from or related to these Terms or the Platform shall not exceed the total fees you have paid to WeBizzle in the 12 months preceding the claim.",
            "WeBizzle is not liable for any loss or damage arising from: (a) vendor products that are defective, misrepresented, or cause injury; (b) delivery delays or failures caused by riders or circumstances beyond our control; (c) M-Pesa transaction failures; (d) unauthorised access to your account due to your failure to protect your credentials.",
            "Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded or limited by Kenyan law.",
          ]}
        />
      </Section>

      <Section title="Indemnification">
        <P>
          You agree to indemnify, defend, and hold harmless WeBizzle, its directors, employees,
          agents, and affiliates from and against any and all claims, damages, losses, liabilities,
          costs, and expenses (including reasonable legal fees) arising from or related to:
        </P>
        <Bullets
          items={[
            "Your breach of these Terms.",
            "Your violation of any applicable law or regulation.",
            "Your use of the Platform in a manner not authorised by these Terms.",
            "Content you submit, post, or transmit through the Platform.",
            "Any dispute between you and a vendor, rider, or another user of the Platform.",
            "Any product sold by a vendor that causes harm, injury, or damage.",
            "Any actions or omissions by a rider during delivery of your order.",
          ]}
        />
      </Section>

      <Section title="Breaches of These General Terms and Conditions">
        <P>
          We reserve the right to take action if we reasonably believe you have breached these
          Terms. Actions we may take include:
        </P>
        <Bullets
          items={[
            "Issuing a warning.",
            "Temporarily suspending your account.",
            "Permanently terminating your account.",
            "Removing or disabling access to your content.",
            "Refusing to process current or future orders.",
            "Reporting the breach to relevant authorities where required by law.",
          ]}
        />
        <P>
          Serious breaches (including fraud, impersonation, sale of counterfeit or illegal goods,
          and harassment) will result in immediate permanent termination and may be reported to
          law enforcement.
        </P>
      </Section>

      <Section title="Entire Agreement">
        <P>
          These Terms, together with the{" "}
          <button
            type="button"
            className="text-brand hover:underline font-medium"
            onClick={() => onNavigate("privacy")}
          >
            Privacy Policy
          </button>
          , constitute the entire agreement between you and WeBizzle regarding the use of the
          Platform. They supersede all prior or contemporaneous communications, representations,
          or agreements, whether oral or written.
        </P>
      </Section>

      <Section title="Hierarchy">
        <P>
          In the event of any conflict between these Terms and any other agreement, policy, or
          notice relating to the Platform, the following hierarchy shall apply (from highest to
          lowest authority):
        </P>
        <Bullets
          items={[
            "Kenyan statutory law (Data Protection Act, Consumer Protection Act, etc.).",
            "These General Terms and Conditions.",
            "Platform-specific policies (Privacy Policy, Refund Policy, Vendor Agreement, Rider Agreement).",
            "Any communications or notices issued by WeBizzle.",
          ]}
        />
      </Section>

      <Section title="Variation">
        <P>
          WeBizzle may revise these Terms at any time. Material changes will be communicated to
          users via in-app notification or SMS at least 30 days before the revised Terms take
          effect. Non-material changes may be made without prior notice. Your continued use of
          the Platform after changes take effect constitutes acceptance of the revised Terms.
        </P>
      </Section>

      <Section title="No Waiver">
        <P>
          The failure of WeBizzle to exercise or enforce any right or provision of these Terms
          shall not constitute a waiver of such right or provision. Any waiver of any provision
          of these Terms will be effective only if in writing and signed by WeBizzle.
        </P>
      </Section>

      <Section title="Severability">
        <P>
          If any provision of these Terms is held to be invalid, illegal, or unenforceable by a
          court of competent jurisdiction, such provision shall be modified to the minimum extent
          necessary to make it valid and enforceable, and the remaining provisions shall continue
          in full force and effect.
        </P>
      </Section>

      <Section title="Assignment">
        <P>
          You may not assign or transfer these Terms or your rights or obligations under these
          Terms to any third party without our prior written consent. WeBizzle may assign its
          rights and obligations under these Terms to any affiliate, subsidiary, or successor
          entity without your consent, provided that the assignee agrees to be bound by these Terms.
        </P>
      </Section>

      <Section title="Third Party Rights">
        <P>
          These Terms do not create any rights in favour of any third party (other than our
          authorised agents and successors) to enforce any provision of these Terms. The Contracts
          (Rights of Third Parties) Act does not apply to these Terms.
        </P>
      </Section>

      <Section title="Law and Jurisdiction">
        <P>
          These Terms are governed by and construed in accordance with the laws of the Republic
          of Kenya. Any disputes arising from or related to these Terms shall be subject to the
          exclusive jurisdiction of the courts of Kenya. Before commencing legal proceedings, you
          agree to attempt to resolve any dispute with us through our internal complaints process
          (contact us via WhatsApp at 0731 371 521 or email at{" "}
          <a href="mailto:legal@webizzle.co.ke" className="text-brand hover:underline">
            legal@webizzle.co.ke
          </a>
          ).
        </P>
      </Section>

      <Section title="Our Company Details and Notices">
        <Card className="p-4 text-sm space-y-1.5">
          <p className="font-semibold text-base">WeBizzle</p>
          <p>Online neighbourhood marketplace platform</p>
          <p>Email: <a href="mailto:legal@webizzle.co.ke" className="text-brand hover:underline">legal@webizzle.co.ke</a></p>
          <p>Support: <a href="mailto:help@webizzle.co.ke" className="text-brand hover:underline">help@webizzle.co.ke</a></p>
          <p>WhatsApp: <a href="https://wa.me/254731371521" className="text-brand hover:underline" target="_blank" rel="noreferrer">0731 371 521</a></p>
          <p>Address: Webuye, Westlands, Nairobi, Kenya</p>
          <p className="text-muted-foreground">Registered in the Republic of Kenya</p>
        </Card>
      </Section>
    </LegalLayout>
  );
}

/* ================================================================
   FAQS PAGE
   ================================================================ */
export function FaqsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const faqGroups = [
    {
      title: "Orders & Delivery",
      faqs: [
        {
          q: "How do I place an order?",
          a: "Browse products on the home page or use the Smart Basket to compare prices. Add items, select a vendor, and proceed to checkout. Enter your delivery details and pay via M-Pesa. You'll receive an order confirmation with tracking details.",
        },
        {
          q: "How long does delivery take?",
          a: "Most orders are delivered within 15–35 minutes depending on the vendor and your location. The estimated delivery time is shown before you confirm your order. You can track your rider in real-time after dispatch.",
        },
        {
          q: "Can I track my delivery?",
          a: "Yes! After your order is dispatched, open the Orders page and tap \"Track\" to see live rider location on a map, estimated arrival time, rider name, bike plate number, and a step-by-step delivery timeline. The tracker updates every 5 seconds.",
        },
        {
          q: "What happens if an item is out of stock?",
          a: "The vendor will notify you before dispatch. You can choose to accept a substitute product, remove the item from your order, or cancel the entire order for a full refund.",
        },
        {
          q: "Can I cancel my order?",
          a: "You can request a cancellation before the vendor confirms the order. Once confirmed, cancellation is at the vendor's discretion. Contact us via WhatsApp immediately if you need to cancel.",
        },
        {
          q: "What if my rider can't find my location?",
          a: "The rider will call you using the phone number provided. You can also share your live GPS location from the order tracking screen. If the rider cannot reach you after 2 attempts, the order may be returned.",
        },
      ],
    },
    {
      title: "Payments & Pricing",
      faqs: [
        {
          q: "How do I pay?",
          a: "All payments are made through M-Pesa. At checkout, enter your M-Pesa phone number and approve the STK push on your phone. Your M-Pesa confirmation code serves as your proof of payment. We never see or store your M-Pesa PIN.",
        },
        {
          q: "How does the Smart Basket save me money?",
          a: "The Smart Basket compares prices across all vendors for the items you want, then recommends the single vendor that offers the lowest total (items + delivery fee). You'll see exactly how much you save compared to the market average price.",
        },
        {
          q: "What is the platform fee?",
          a: "A 3% platform fee applies to orders above KES 300. This fee is automatically deducted from the vendor's payout — it is not charged to you as a separate fee.",
        },
        {
          q: "Can I get a refund?",
          a: "Yes. If a vendor fails to deliver, provides wrong/damaged items, or if there's a payment error, you can request a refund via WhatsApp within 2 hours of delivery. Refunds are processed via M-Pesa within 48 hours. Perishable goods cannot be returned due to food safety regulations.",
        },
      ],
    },
    {
      title: "Vendors",
      faqs: [
        {
          q: "How do I register my shop on WeBizzle?",
          a: "Click 'Vendor' in the navigation, fill in your shop name, owner name, and M-Pesa phone number. Upload your trade licence, municipal permit, and KPLC token receipt for faster approval. After OTP verification, you'll be directed to your Vendor Portal.",
        },
        {
          q: "Is there a registration fee?",
          a: "No. Registering your shop on WeBizzle is completely free. There are no setup fees or monthly charges.",
        },
        {
          q: "How do I receive payments?",
          a: "Payments are sent directly to your M-Pesa account. You receive the order subtotal minus a 3% platform fee (only on orders above KES 300). Payouts are processed instantly upon order completion.",
        },
        {
          q: "How do I manage orders?",
          a: "Log into your Vendor Portal using your phone number and OTP. From the portal, you can view incoming orders, accept or reject them, update your product catalogue, set duty hours, and chat with support.",
        },
        {
          q: "What is the Boost feature?",
          a: "Boost is a paid promotion that increases your shop's visibility on WeBizzle. Choose from Silver, Gold, or Platinum packages. Your shop appears higher in search results and gets more impressions. Payment is via M-Pesa.",
        },
        {
          q: "What types of shops can join?",
          a: "We welcome all neighbourhood vendor types: Dukas, Mama Mbogas, Pharmacies, Bakeries, Hardware stores, Butcheries, Electronics shops, and Agrovets. If you sell products to your local community, you're welcome on WeBizzle.",
        },
      ],
    },
    {
      title: "Riders",
      faqs: [
        {
          q: "How do I become a WeBizzle rider?",
          a: "Click 'Rider' in the navigation, fill in your full name, phone number, bike registration number, stage number, and location area. Take a selfie for identity verification. After OTP verification, you'll be directed to your Rider Portal. Our team will review and approve your application.",
        },
        {
          q: "What is the stage number for?",
          a: "Your stage number (e.g., Stage 14, Matatu Terminus) helps us identify your location for easy dispatch and helps customers and admin know where you operate from.",
        },
        {
          q: "How much do riders earn?",
          a: "Riders earn the full delivery fee for each delivery minus a 10% rider levy that goes to WeBizzle. Tips from customers are yours to keep. Earnings depend on the number and distance of deliveries completed.",
        },
        {
          q: "When do I get paid?",
          a: "Rider payouts are processed weekly via M-Pesa. You can view your earnings breakdown (total deliveries, total earned, levy deducted, net payout) in the Rider Portal.",
        },
        {
          q: "Can I choose my own hours?",
          a: "Yes. You can toggle your online/offline status in the Rider Portal at any time. You set your own schedule and only receive delivery requests when you're online.",
        },
      ],
    },
    {
      title: "Referrals, Receipts & Rewards",
      faqs: [
        {
          q: "How does the referral programme work?",
          a: "Generate a unique referral code from the Referrals page. Share it with friends via WhatsApp. When someone signs up using your code and places an order, you earn KES credit. Track your clicks, signups, and earnings in real-time.",
        },
        {
          q: "What is the receipt snap feature?",
          a: "Upload photos of your purchase receipts from any retailer. Our system extracts the total amount and awards you 10 tokens per approved receipt. Tokens can be redeemed for discounts on future WeBizzle orders.",
        },
        {
          q: "How do I check my savings?",
          a: "The Savings page shows your total savings across all orders compared to market-average prices, average savings percentage, savings by category, best savings streak, and your savings history.",
        },
      ],
    },
    {
      title: "Account & Security",
      faqs: [
        {
          q: "Is my M-Pesa PIN safe?",
          a: "Absolutely. Your M-Pesa PIN is entered directly on your phone's Safaricom SIM toolkit. WeBizzle never sees, collects, or stores your PIN. The STK push is handled entirely by Safaricom's secure system.",
        },
        {
          q: "How does OTP verification work?",
          a: "When you register or log in, we send a 6-digit code to your phone via SMS. Enter the code to verify your identity. Codes expire after 5 minutes. In development mode, the code is displayed on screen for testing.",
        },
        {
          q: "How do I report a problem?",
          a: "Contact us via WhatsApp at 0731 371 521 (fastest, 7am–10pm daily), call us, or email help@webizzle.co.ke. For order issues, have your M-Pesa code ready as proof of purchase.",
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => onNavigate("home")}>
          <ArrowLeft size={14} /> Back
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to know about using WeBizzle
        </p>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {faqGroups.map((g) => (
          <a
            key={g.title}
            href={`#faq-${g.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors"
          >
            {g.title}
          </a>
        ))}
      </div>

      {faqGroups.map((group) => (
        <section
          key={group.title}
          id={`faq-${group.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
          className="space-y-3 scroll-mt-20"
        >
          <h2 className="text-base font-bold text-foreground">{group.title}</h2>
          <div className="space-y-2">
            {group.faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-card p-3"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-2 font-medium text-sm list-none">
                  {faq.q}
                  <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45 text-lg leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <Card className="p-4 text-center text-sm space-y-2">
        <p className="font-semibold">Still have questions?</p>
        <p className="text-muted-foreground">
          We're here to help — chat with us on WhatsApp or browse our Support page.
        </p>
        <div className="flex justify-center gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href="https://wa.me/254731371521" target="_blank" rel="noreferrer">
              WhatsApp us
            </a>
          </Button>
          <Button
            size="sm"
            className="bg-brand text-white hover:bg-brand-dark"
            onClick={() => onNavigate("support")}
          >
            Support page
          </Button>
        </div>
      </Card>
    </div>
  );
}