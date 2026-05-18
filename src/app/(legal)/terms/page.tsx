import Link from 'next/link'

export const metadata = {
  title: 'Terms & Conditions — Cinematic Forge',
  description: 'Terms and Conditions for Cinematic Forge by INNOVATIVE',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-[#00e5c8] text-sm hover:underline">← Back to Cinematic Forge</Link>
          <h1 className="text-4xl font-bold mt-6 mb-2">Terms &amp; Conditions</h1>
          <p className="text-gray-500 text-sm">Cinematic Forge by INNOVATIVE · Last updated May 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Cinematic Forge ("the Service") provided by INNOVATIVE, you agree to be
              bound by these Terms &amp; Conditions. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Cinematic Forge is a professional AI-assisted film production platform. The Service enables users
              to generate, edit, and export video content using AI processing engines. Generated content may
              reflect the prompts and creative direction provided by the user.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Credits &amp; Payments</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Credits are consumed when using AI generation and processing features.</li>
              <li>Credits are non-refundable except where required by applicable law.</li>
              <li>Subscription credits reset monthly and do not roll over.</li>
              <li>Top-up credit packs do not expire.</li>
              <li>INNOVATIVE reserves the right to adjust credit costs with 14 days notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to generate content that:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Is unlawful, harmful, threatening, abusive, or harassing.</li>
              <li>Infringes the intellectual property rights of any third party.</li>
              <li>Contains non-consensual depictions of real individuals.</li>
              <li>Is designed to deceive or spread misinformation at scale.</li>
            </ul>
            <p className="mt-3">Violations may result in immediate account termination without refund.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Intellectual Property</h2>
            <p>
              Content you generate using the Service is owned by you, subject to any third-party model
              provider licenses. INNOVATIVE retains no ownership of your generated content. You grant
              INNOVATIVE a limited license to store and serve your content for the purposes of providing
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. AI Processing &amp; Quality</h2>
            <p>
              AI-generated content is provided "as-is." INNOVATIVE makes no warranties regarding the
              accuracy, quality, or fitness of generated content for any particular purpose. Generation
              results may vary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Privacy</h2>
            <p>
              Your use of the Service is governed by our{' '}
              <Link href="/privacy" className="text-[#00e5c8] hover:underline">Privacy Policy</Link>,
              which is incorporated herein by reference.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, INNOVATIVE shall not be liable for any indirect,
              incidental, or consequential damages arising from your use of the Service, including but not
              limited to loss of revenue or content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to Terms</h2>
            <p>
              INNOVATIVE may update these Terms at any time. Continued use of the Service after changes
              constitutes acceptance of the updated Terms. Material changes will be notified via email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:legal@cinematicforge.ai" className="text-[#00e5c8] hover:underline">
                legal@cinematicforge.ai
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
