/**
 * Privacy Policy — PUBLIC page (no Auth0 session required).
 *
 * Lives outside the (protected) route group on purpose: src/proxy.js only forces a
 * login redirect for PROTECTED_PREFIXES (/product, /export, /categories, /integrations),
 * so /privacy passes through for logged-out visitors exactly like /contact does. This
 * URL goes into the Shopify Partner Dashboard's "Privacy policy URL" field — Shopify's
 * reviewer must be able to load it with no session.
 *
 * Covers the WHOLE portal, not just the Shopify app. Every factual claim is derived
 * from the code — keep in sync if these change:
 *   - portal sign-in:    src/lib/auth0.js + src/proxy.js (Auth0 EU tenant, roles claim)
 *   - contact form:      src/app/nextapi/contact/route.js (Gmail SMTP)
 *   - export access:     api/src/services/customExport.service.js (owner/accessList/apiKeys keyHash)
 *   - AI categorization: api Google Gemini — product text only
 *   - Shopify scopes:    api/src/services/shopify/shopifyConnection.service.js (DEFAULT_SCOPES)
 *   - token encryption:  api/src/services/shopify/crypto.service.js (AES-256-GCM)
 *   - deletion paths:    api shopifyController.js (disconnect, app/uninstalled, shop/redact)
 */

export const metadata = {
  title: 'Privacy Policy | Patrik Partner Portal',
  description:
    'Privacy policy for the Patrik Partner Portal and the Time 4 Action Product Sync Shopify app.',
};

const LEGAL_NOTE = `<!-- Not legal advice. Controller/processor classification under GDPR (EU/Slovenia)
should be confirmed by a lawyer before publishing. -->`;

const CONTACT_EMAIL = 'grega@time-4-action.com';

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function UserOffIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636M15 9.354a4 4 0 11-6-3.354"
      />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function GlobeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

/* ─── Building blocks ────────────────────────────────────────────────────── */

/** "At a glance" stat card — the promises a partner/merchant/reviewer cares about most. */
function GlanceCard({ icon: Icon, title, text }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm transition-colors hover:border-[#01a0be]/40">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#01a0be]/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#01a0be]/25 bg-[#01a0be]/10">
        <Icon className="h-4.5 w-4.5 text-[#01a0be]" />
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">{text}</p>
    </div>
  );
}

function Section({ n, title, children }) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-baseline gap-3">
        <span
          className="text-xs font-bold tracking-widest text-[#01a0be]"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {n}
        </span>
        <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-400">{children}</div>
    </section>
  );
}

/** Bullet with a cyan tick — matches the Contact page's list styling. */
function Li({ label, children }) {
  return (
    <li className="flex items-start gap-3">
      <svg
        className="mt-1 h-3.5 w-3.5 shrink-0 text-[#01a0be]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>
        {label && <span className="font-medium text-neutral-300">{label} — </span>}
        {children}
      </span>
    </li>
  );
}

function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#01a0be] hover:underline">
      {CONTACT_EMAIL}
    </a>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function PrivacyPage() {
  return (
    <div className="relative bg-transparent py-8">
      {/* Lawyer-review note required in the page source — rendered as an HTML comment. */}
      <div dangerouslySetInnerHTML={{ __html: LEGAL_NOTE }} />

      {/* Same container as Navbar.js so edges align pixel-precise */}
      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* ----------------------------- Header ----------------------------- */}
        <header className="mb-6 flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#01a0be]/30 bg-[#01a0be]/10">
            <ShieldIcon className="h-5 w-5 text-[#01a0be]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Privacy Policy</h1>
              <span className="inline-flex items-center rounded-full border border-[#01a0be]/25 bg-[#01a0be]/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-[#01a0be]">
                Legal
              </span>
            </div>
            <p className="truncate text-xs text-neutral-500">
              Patrik Partner Portal &amp; the Time 4 Action Product Sync Shopify app · Last
              updated: 10 June 2026
            </p>
          </div>
        </header>

        {/* --------------------------- At a glance --------------------------- */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GlanceCard
            icon={UserOffIcon}
            title="No shopper data"
            text="We handle product catalogues, not consumers — no customer, order or payment data anywhere."
          />
          <GlanceCard
            icon={LockIcon}
            title="Encrypted credentials"
            text="Shopify tokens and feed credentials are stored encrypted with AES-256-GCM; export API keys are hashed."
          />
          <GlanceCard
            icon={GlobeIcon}
            title="Hosted in the EU"
            text="All data lives on EU cloud infrastructure — Hetzner and T-2 (Slovenia)."
          />
          <GlanceCard
            icon={TrashIcon}
            title="Easy deletion"
            text="Disconnect, uninstall or email us — your data is erased, Shopify stores fully redacted within 48 hours."
          />
        </div>

        {/* ----------------------------- Sections ----------------------------- */}
        <div className="space-y-4">
          <Section n="01" title="Who we are">
            <p>
              The Patrik Partner Portal (product browsing, exports, catalogue integrations) and
              its Shopify app, <span className="text-neutral-300">Time 4 Action Product Sync</span>,
              are operated by <span className="text-neutral-300">Time 4 Action d.o.o.</span>,
              Koprska ulica 74, 1000 Ljubljana, Slovenia. For any question or request about your
              data, contact us at <ContactLink /> or through the portal&apos;s contact page.
            </p>
            <p>
              The portal is a business-to-business tool for approved partners. It distributes
              product catalogue data — products, prices, stock levels, images. It does not handle
              consumers or their data.
            </p>
          </Section>

          <Section n="02" title="Your portal account">
            <p>
              Sign-in is handled by Auth0 (EU-hosted tenant). From your login we receive your user
              ID, email address and assigned portal roles; an encrypted session cookie keeps you
              signed in. We do not store passwords — authentication happens entirely at Auth0.
            </p>
            <p>Inside the portal, your user ID and email appear where access is managed:</p>
            <ul className="space-y-2.5">
              <Li label="Export configurations">
                as the owner or on the access list of an export you can use. API keys created for
                exports are stored only as hashes.
              </Li>
              <Li label="Shopify connections">
                as the account a connected store belongs to (see section 04).
              </Li>
            </ul>
            <p>
              The only cookie we set is the Auth0 session cookie. The portal uses no advertising
              or analytics cookies and no tracking scripts.
            </p>
          </Section>

          <Section n="03" title="Contact form">
            <p>
              If you use the contact page we receive the name, company, email address and message
              you submit. It is delivered to our mailbox as an email (sent via Google&apos;s Gmail
              service) and used only to answer you. These messages are kept as ordinary business
              correspondence and are not used for marketing.
            </p>
          </Section>

          <Section n="04" title="The Shopify app — what it accesses">
            <p>
              When you connect a store, the app requests these Shopify permissions (OAuth scopes):
            </p>
            <ul className="space-y-2.5">
              <Li label="Products (read/write)">
                to find your products by SKU/barcode and to create or update products, variants,
                prices, descriptions and images you choose to sync.
              </Li>
              <Li label="Inventory (read/write)">
                to set stock quantities at the location you select.
              </Li>
              <Li label="Locations (read)">
                to list your inventory locations so you can pick the one to stock.
              </Li>
              <Li label="Publications (read/write)">
                to list your sales channels and publish newly created products to the channels you
                select.
              </Li>
            </ul>
            <p>
              On connection the app also reads basic store information and keeps only your store
              name and currency. To run the sync, we store for each connected store: the Shopify
              access and refresh tokens (encrypted — section 06), your store domain, your sync
              settings (location, sales channels, price list priority), a SKU-to-Shopify-ID
              mapping table, sync run history, and the portal account the store belongs to.
            </p>
            <p className="rounded-xl border border-[#01a0be]/20 bg-[#01a0be]/5 px-4 py-3 text-neutral-300">
              The app does <strong>not</strong> request access to — and therefore never collects,
              stores or processes — your customers&apos; personal data, orders, or payment
              information.
            </p>
          </Section>

          <Section n="05" title="Product data, exports and AI">
            <p>
              The catalogue itself (product names, descriptions, prices, stock, images) comes from
              our suppliers&apos; systems and from external brand feeds partners connect. It is
              business data, not personal data. Credentials for external feeds are stored
              encrypted.
            </p>
            <p>
              To organise the catalogue, product text (names, descriptions, categories) may be
              processed by Google&apos;s Gemini AI service for automatic categorisation. No
              personal data — yours or anyone else&apos;s — is sent to AI services.
            </p>
          </Section>

          <Section n="06" title="How we protect your data">
            <ul className="space-y-2.5">
              <Li>
                Shopify access and refresh tokens and external feed credentials are encrypted at
                rest with AES-256-GCM; export API keys are stored only as hashes. None of these
                are ever exposed through the portal&apos;s interface or API responses.
              </Li>
              <Li>All data in transit uses HTTPS/TLS.</Li>
              <Li>
                Webhooks and OAuth callbacks from Shopify are verified with HMAC signatures before
                being processed.
              </Li>
              <Li>
                Data is stored in a database operated by us on EU cloud infrastructure — Hetzner
                (EU) and T-2 OpenStack servers (a Slovenian provider). Web traffic is proxied
                through Cloudflare.
              </Li>
            </ul>
          </Section>

          <Section n="07" title="Service providers (subprocessors)">
            <p>These providers process data on our behalf to run the service:</p>
            <ul className="space-y-2.5">
              <Li label="Shopify">
                the platform your store runs on; receives the product data you choose to sync.
              </Li>
              <Li label="Auth0 (Okta)">portal sign-in, EU-hosted tenant.</Li>
              <Li label="Google">
                Gmail delivers contact-form messages to our mailbox; Gemini processes product
                catalogue text for categorisation (no personal data).
              </Li>
              <Li label="Hetzner (EU)">
                cloud infrastructure hosting the portal&apos;s servers and database.
              </Li>
              <Li label="T-2 (Slovenia)">
                OpenStack cloud infrastructure hosting part of the portal&apos;s servers.
              </Li>
              <Li label="Cloudflare">proxies and protects web traffic to the portal.</Li>
            </ul>
          </Section>

          <Section n="08" title="Data retention and deletion">
            <ul className="space-y-2.5">
              <Li label="Disconnect a store in the portal">
                the app uninstalls itself from your store and we immediately delete the connection
                record, the encrypted tokens, the product mapping and the sync history.
              </Li>
              <Li label="Uninstall from Shopify admin">
                Shopify revokes the app&apos;s access; we immediately delete the stored tokens and
                the product mapping. A minimal record (store domain and your sync settings) is
                kept briefly so your configuration is restored if you reinstall.
              </Li>
              <Li label="Redaction">
                when Shopify sends its <code>shop/redact</code> request (48 hours after
                uninstall), we permanently erase that remaining record, including all mapping and
                sync history.
              </Li>
              <Li label="Portal account">
                kept while you are an active partner. On request we remove your account&apos;s
                data — export ownership/access entries, API keys and Shopify connections — and
                your login at Auth0.
              </Li>
              <Li label="Contact messages">kept as ordinary business correspondence.</Li>
            </ul>
            <p>
              Because the app holds no customer data, Shopify&apos;s{' '}
              <code>customers/data_request</code> and <code>customers/redact</code> requests are
              acknowledged with nothing to return or erase.
            </p>
          </Section>

          <Section n="09" title="Your rights">
            <p>
              Under the GDPR you may request access to, correction of, or deletion of the personal
              data we hold about you (your account email, access entries and connection records),
              object to or restrict processing, and lodge a complaint with your supervisory
              authority. To exercise any of these rights, contact us at <ContactLink /> — we
              respond within 30 days.
            </p>
          </Section>

          <Section n="10" title="Changes to this policy">
            <p>
              If we change what the portal or the app accesses or stores, we will update this page
              and its &quot;Last updated&quot; date before the change takes effect. Material
              changes will be announced to affected partners by email.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
