import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

const UPDATED = "15 October 2026";

export default function Terms() {
  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 prose prose-slate dark:prose-invert prose-headings:font-serif">
        <h1>Terms of Service</h1>
        <p className="lead">
          These terms apply when you use edmeca.co.za and the EDMECA Academy portal, provided by Edmeca (Pty) Ltd
          ("EDMECA", "we"). By creating an account or using the site, you agree to them.
        </p>
        <p><strong>Last updated:</strong> {UPDATED}</p>

        <h2>1. The service</h2>
        <p>
          EDMECA provides business frameworks and tools (such as the Business Model Canvas, SWOT/PESTLE, value proposition,
          pitch builder, progress tracker and financial analysis), AI-assisted guidance, and diagnostics such as the AI
          Enablement Map and Execution Gap. We may change, add or remove features over time.
        </p>

        <h2>2. Your account</h2>
        <ul>
          <li>You must be 18 or older and give a correct email address.</li>
          <li>One email address is one account. Keep access to your email and any password secure; you are responsible for activity on your account.</li>
          <li>Tell us at <a href="mailto:info@edmeca.co.za">info@edmeca.co.za</a> if you think someone else has used your account.</li>
        </ul>

        <h2>3. AI-generated content is guidance, not advice</h2>
        <p>
          Analyses, suggestions and reports produced by the AI tools are generated automatically from what you enter. They can
          be incomplete or wrong. They are educational guidance, not financial, legal, tax or investment advice. Check
          important figures and decisions with a qualified professional before acting on them.
        </p>

        <h2>4. Your content</h2>
        <p>
          You own what you create and upload. You give us permission to store and process it to provide the service to you,
          including sending it to the AI providers described in our <Link href="/privacy">Privacy Policy</Link>. Only upload
          information you are entitled to share.
        </p>

        <h2>5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>break the law, or upload content that is unlawful, harmful or infringes someone else's rights;</li>
          <li>try to access other people's accounts or data, or test, probe or attack the service's security;</li>
          <li>use scripts or bots to overload the service or run up usage of the AI tools, or get around usage limits;</li>
          <li>resell or copy the service, its frameworks or content without our written permission.</li>
        </ul>
        <p>We may suspend or close accounts that break these rules.</p>

        <h2>6. Our content</h2>
        <p>
          The website, frameworks, templates, wording and software belong to EDMECA or its licensors. You may use them for
          your own business while you use the service.
        </p>

        <h2>7. Availability</h2>
        <p>
          We work to keep the service running but cannot promise it will always be available or error-free. We may pause it
          for maintenance. Keep copies of work that matters to you; most tools let you export.
        </p>

        <h2>8. Paid engagements</h2>
        <p>
          Workshops, coaching and programme engagements are agreed separately in writing. Those agreements take precedence
          over these terms where they differ.
        </p>

        <h2>9. Liability</h2>
        <p>
          To the extent the law allows, EDMECA is not liable for indirect or consequential loss, or for decisions you make based
          on the AI tools' output. Nothing in these terms limits rights you have under the Consumer Protection Act, 2008, or
          liability that cannot be limited by law.
        </p>

        <h2>10. Ending your use</h2>
        <p>
          You can stop using the service at any time and ask us to delete your account by emailing
          {" "}<a href="mailto:info@edmeca.co.za">info@edmeca.co.za</a>. We may end access with notice, or without notice if you
          seriously break these terms.
        </p>

        <h2>11. Changes to these terms</h2>
        <p>
          We will post updated terms on this page with a new date. If a change is significant we will tell signed-in users.
          Continuing to use the service after a change means you accept the updated terms.
        </p>

        <h2>12. Law and contact</h2>
        <p>
          These terms are governed by the laws of the Republic of South Africa. Questions:
          {" "}<a href="mailto:info@edmeca.co.za">info@edmeca.co.za</a>.
        </p>
      </article>
    </MarketingLayout>
  );
}
