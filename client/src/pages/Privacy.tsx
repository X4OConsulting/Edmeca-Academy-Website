import { MarketingLayout } from "@/components/marketing/MarketingLayout";

const UPDATED = "15 October 2026";

/** Who receives personal information, what, and where. Keep in step with the code (server/, api/). */
const PROCESSORS: { name: string; purpose: string; data: string; where: string }[] = [
  { name: "Vercel", purpose: "Hosts the website and runs its server functions", data: "All requests to the site, including IP address", where: "EU (Frankfurt) for processing; global network for delivery" },
  { name: "Neon", purpose: "Database", data: "Your account, profile, saved work, form submissions", where: "EU (Frankfurt)" },
  { name: "Anthropic (Claude)", purpose: "AI analysis in the Financial Analysis and Business Model Canvas tools, and the readiness assessment report", data: "The financial data, canvas or answers you submit to that tool", where: "United States" },
  { name: "Groq", purpose: "The portal chat assistant", data: "Your chat messages and a summary of your saved business tools", where: "United States" },
  { name: "DeepSeek", purpose: "Writing the fuller AI Map and Execution Gap reports", data: "Business name, sector, your diagnostic answers and scores, and context you type. Not your name or email", where: "China" },
  { name: "Google (Apps Script and Sheets)", purpose: "Recording diagnostic results and emailing your report", data: "Your diagnostic answers and, when you request the report, your name, email and organisation", where: "Global" },
  { name: "Google (sign-in)", purpose: "Sign in with Google, if you choose it", data: "Your Google name, email and profile picture", where: "Global" },
  { name: "Resend", purpose: "Sending emails (sign-in codes, confirmations, form notifications)", data: "Your email address and the email content", where: "United States" },
  { name: "Google Fonts", purpose: "Loading the website's fonts", data: "IP address and browser details", where: "Global" },
];

export default function Privacy() {
  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 prose prose-slate dark:prose-invert prose-headings:font-serif">
        <h1>Privacy Policy</h1>
        <p className="lead">
          This policy explains what personal information Edmeca (Pty) Ltd ("EDMECA", "we") collects through edmeca.co.za,
          why, who we share it with, and the rights you have under the Protection of Personal Information Act, 2013 (POPIA).
        </p>
        <p><strong>Last updated:</strong> {UPDATED}</p>

        <h2>1. Who is responsible</h2>
        <p>
          Edmeca (Pty) Ltd is the responsible party for personal information processed through this website. Questions,
          requests and complaints go to our Information Officer at <a href="mailto:info@edmeca.co.za">info@edmeca.co.za</a>.
        </p>

        <h2>2. What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your name, email address and, if you use Google sign-in, your Google profile picture. If you set a password, we store only a one-way hash of it.</li>
          <li><strong>What you create in the portal:</strong> your business profile, Business Model Canvas, SWOT/PESTLE, value proposition, pitch and progress entries.</li>
          <li><strong>Financial information you upload or paste</strong> into the Financial Analysis tool, and the reports it produces.</li>
          <li><strong>Diagnostic answers</strong> (AI Enablement Map, Execution Gap, readiness assessment) and, if you ask for your report, your name, email, organisation and whether you would like a call.</li>
          <li><strong>Messages you send us</strong> through the Contact and Signup forms.</li>
          <li><strong>Technical information:</strong> IP address, browser type and the time of requests, kept for security, to limit abuse (for example how often a sign-in code is requested) and to keep you signed in.</li>
        </ul>

        <h2>3. Why we use it</h2>
        <ul>
          <li>To create and secure your account and sign you in (including emailing sign-in codes).</li>
          <li>To provide the portal tools and save your work.</li>
          <li>To produce AI-assisted analyses and reports you ask for.</li>
          <li>To answer your enquiries and applications, and to contact you if you asked us to.</li>
          <li>To protect the service against misuse and to fix problems.</li>
        </ul>
        <p>
          We process your information because you asked us to provide the service (POPIA section 11(1)(b)), with your consent where
          you give it (for example when you request a report or a call), and for our legitimate interest in running a secure service.
          We do not sell your personal information and we do not use it for advertising.
        </p>

        <h2>4. Who we share it with</h2>
        <p>
          We use the service providers below (operators, in POPIA's terms) to run the site. They process information on our
          instructions and for these purposes only.
        </p>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-semibold">Provider</th>
                <th className="text-left py-2 pr-4 font-semibold">What for</th>
                <th className="text-left py-2 pr-4 font-semibold">What it receives</th>
                <th className="text-left py-2 font-semibold">Where</th>
              </tr>
            </thead>
            <tbody>
              {PROCESSORS.map((p) => (
                <tr key={p.name} className="border-b align-top">
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{p.purpose}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{p.data}</td>
                  <td className="py-2 text-muted-foreground">{p.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>5. Information sent outside South Africa</h2>
        <p>
          Several of these providers are outside South Africa (see the table). Under POPIA section 72 we transfer information
          only where it is needed to provide the service you asked for, and to providers bound by agreements and laws that give
          protection substantially similar to POPIA. Avoid entering information you do not want processed abroad, for example
          personal identity numbers in a financial statement you upload.
        </p>

        <h2>6. Cookies</h2>
        <p>
          We use one essential cookie to keep you signed in. It is created when you sign in and removed when you sign out.
          We do not use advertising or analytics cookies.
        </p>

        <h2>7. How long we keep it</h2>
        <ul>
          <li>Account information and your saved work: while your account is open, and deleted when you ask us to close it.</li>
          <li>Sign-in codes: expire after 10 minutes. Sign-in sessions: expire after 7 days of inactivity.</li>
          <li>Abuse-prevention records: AI usage counts are deleted after an hour; sign-in rate limits keep one counter per IP address, which is overwritten with each request and holds no other details.</li>
          <li>Enquiries, applications and diagnostic results: as long as needed to respond and follow up, then deleted.</li>
        </ul>

        <h2>8. Security</h2>
        <p>
          Information travels over encrypted connections (HTTPS) and is stored with providers that encrypt data at rest.
          Passwords and sign-in codes are stored only as one-way hashes, and access to the database is restricted.
        </p>

        <h2>9. Your rights</h2>
        <p>Under POPIA you may:</p>
        <ul>
          <li>ask whether we hold information about you and for a copy of it;</li>
          <li>ask us to correct or delete it;</li>
          <li>object to processing, or withdraw consent you gave;</li>
          <li>complain to the Information Regulator (<a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a>).</li>
        </ul>
        <p>
          Email <a href="mailto:info@edmeca.co.za">info@edmeca.co.za</a> and we will respond within 30 days. You can also update your
          name, business details and password on your Profile page at any time.
        </p>

        <h2>10. Children</h2>
        <p>The service is meant for people aged 18 and over. We do not knowingly collect information from children.</p>

        <h2>11. Changes</h2>
        <p>
          We will update this page if our practices change and show the new date above. If a change is significant, we will
          tell signed-in users by email or in the portal.
        </p>
      </article>
    </MarketingLayout>
  );
}
