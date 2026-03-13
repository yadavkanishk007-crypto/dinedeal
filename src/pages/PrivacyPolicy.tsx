import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-sm border border-gray-200 overflow-hidden">
        
        {/* Document Header */}
        <div className="bg-gray-900 text-white p-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2">
            DINEDEAL – PRIVACY POLICY (FOR CUSTOMERS)
          </h1>
          <p className="text-gray-400 text-sm">
            Last Updated: [22/01/2026]
          </p>
        </div>

        {/* Content Container */}
        <div className="p-8 md:p-12 text-gray-800 text-sm md:text-base leading-relaxed space-y-8">

          {/* Introduction */}
          <section className="space-y-4">
            <p>
              This Privacy Policy (“Policy”) describes how DineDeal (“we”, “our”, “us”, or “DineDeal”)
              collects, uses, stores, processes, and protects the personal information of users (“you”,
              “your”, “customer”, or “user”) who access or use the DineDeal mobile application,
              progressive web app (PWA), website, and related services (collectively, the “Platform”).
            </p>
            <p>
              DineDeal is a technology-enabled dine-in discovery, offers, and payment platform designed
              to help customers discover restaurants, unlock dining deals, make dine-in payments, and
              receive value-added services.
            </p>
            <p className="font-semibold">
              By accessing or using the Platform, you agree to the collection and use of your information in
              accordance with this Policy. If you do not agree, please do not use the Platform.
            </p>
          </section>

          {/* 1. Scope */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">1. Scope of This Privacy Policy</h2>
            <p className="mb-2">This Policy applies to:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>Customers browsing restaurants or offers</li>
              <li>Users scanning QR codes at restaurants</li>
              <li>Users making dine-in payments via the Platform</li>
              <li>Users creating accounts or using guest access</li>
              <li>Users interacting with customer support</li>
              <li>Users receiving communications, notifications, or promotions</li>
            </ul>
            <p>
              This Policy does not apply to restaurant partners or third-party platforms linked through
              DineDeal, which may have their own privacy policies.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">2. Information We Collect</h2>

            <div className="mb-6">
              <h3 className="font-bold mb-2">2.1 Personal Information You Provide</h3>
              <p className="mb-3">We may collect the following information directly from you:</p>
              <div className="space-y-3 pl-2">
                <div>
                  <p className="font-semibold">• Identity Information:</p>
                  <p className="pl-4">Name, gender (optional), date of birth (optional)</p>
                </div>
                <div>
                  <p className="font-semibold">• Contact Information:</p>
                  <p className="pl-4">Mobile number, email address</p>
                </div>
                <div>
                  <p className="font-semibold">• Account Information:</p>
                  <p className="pl-4">Login credentials, profile preferences</p>
                </div>
                <div>
                  <p className="font-semibold">• Payment Information:</p>
                  <p className="pl-4">Transaction IDs, payment status, payment method used</p>
                  <p className="pl-4 italic">(Note: We do not store sensitive card or UPI PIN details)</p>
                </div>
                <div>
                  <p className="font-semibold">• Dining Activity:</p>
                  <p className="pl-4">Restaurant visited, bill amount, applied offers, date & time</p>
                </div>
                <div>
                  <p className="font-semibold">• Support Communication:</p>
                  <p className="pl-4">Messages, emails, call recordings (where permitted)</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-2">2.2 Information Collected Automatically</h3>
              <p className="mb-2">When you use the Platform, we may automatically collect:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Device information (device type, OS, app version)</li>
                <li>IP address and approximate location</li>
                <li>Browser type and language</li>
                <li>App usage patterns and session logs</li>
                <li>Crash reports and performance data</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">2.3 Information from Restaurants & Partners</h3>
              <p className="mb-2">We may receive limited information from restaurant partners, such as:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Confirmation of dine-in visit</li>
                <li>Bill validation data</li>
                <li>Offer applicability status</li>
              </ul>
            </div>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">3. How We Use Your Information</h2>
            <p className="mb-4">We use your information for the following purposes:</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">3.1 Core Platform Services</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Account creation and authentication</li>
                  <li>Displaying nearby restaurants and offers</li>
                  <li>Processing dine-in payments</li>
                  <li>Applying eligible discounts and cashback</li>
                  <li>Generating invoices or payment confirmations</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">3.2 Customer Experience Enhancement</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Personalising restaurant recommendations</li>
                  <li>Improving app performance and UI/UX</li>
                  <li>Preventing misuse, fraud, or unauthorized activity</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">3.3 Communication</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Sending transaction confirmations</li>
                  <li>Service-related notifications</li>
                  <li>Responding to queries and complaints</li>
                  <li>Sending promotional offers (with opt-out)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">3.4 Legal & Compliance</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Meeting regulatory requirements</li>
                  <li>Audits and record-keeping</li>
                  <li>Enforcing terms and preventing fraud</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Cookies */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">4. Cookies & Tracking Technologies</h2>
            <p className="mb-2">DineDeal uses cookies, SDKs, and similar technologies to:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>Keep you logged in</li>
              <li>Analyse traffic and usage patterns</li>
              <li>Improve app stability and speed</li>
              <li>Measure marketing effectiveness</li>
            </ul>
            <p>
              You may control cookies via your browser or device settings. Disabling cookies may affect
              certain features.
            </p>
          </section>

          {/* 5. Payments */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">5. Payments & Financial Information</h2>
            <p className="mb-4">
              All payments on DineDeal are processed via RBI-compliant third-party payment gateways.
            </p>
            <p className="mb-2 font-semibold">Important clarifications:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>We do not store card numbers, CVV, or UPI PINs</li>
              <li>Payment data is tokenized and encrypted</li>
              <li>We only receive transaction reference IDs and status</li>
            </ul>
            <p>DineDeal may facilitate settlement logic but does not act as a bank or wallet.</p>
          </section>

          {/* 6. Sharing */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">6. Sharing of Information</h2>
            <p className="mb-4">We do not sell your personal data.</p>
            <p className="mb-4">We may share information only in the following cases:</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">6.1 With Restaurant Partners</h3>
                <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                  <li>To validate your dine-in visit</li>
                  <li>To apply discounts or offers</li>
                  <li>To resolve disputes</li>
                </ul>
                <p>Only minimal, necessary data is shared.</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">6.2 With Service Providers</h3>
                <p className="mb-2">Trusted vendors providing:</p>
                <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                  <li>Cloud hosting</li>
                  <li>Analytics</li>
                  <li>Customer support</li>
                  <li>Payment processing</li>
                </ul>
                <p>All vendors are bound by confidentiality obligations.</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">6.3 Legal & Regulatory Authorities</h3>
                <p className="mb-2">When required by:</p>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Law, court order, or government request</li>
                  <li>Investigation of fraud or illegal activity</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">7. Data Retention</h2>
            <p className="mb-2">We retain your information only as long as necessary:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li><strong>Account data:</strong> While your account is active</li>
              <li><strong>Transaction data:</strong> As required by law</li>
              <li><strong>Support interactions:</strong> For dispute resolution</li>
            </ul>
            <p>Upon deletion request, data is erased or anonymized unless legally required.</p>
          </section>

          {/* 8. Data Security */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">8. Data Security Measures</h2>
            <p className="mb-2">We implement industry-standard security practices, including:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>HTTPS & encryption</li>
              <li>Secure cloud infrastructure</li>
              <li>Access control and monitoring</li>
              <li>Regular audits and vulnerability testing</li>
            </ul>
            <p>
              Despite best efforts, no system is 100% secure. You are encouraged to safeguard your login
              credentials.
            </p>
          </section>

          {/* 9. Your Rights */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">9. Your Rights as a User</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Withdraw consent (where applicable)</li>
              <li>Request account deletion</li>
              <li>Opt-out of promotional communication</li>
            </ul>
            <p>Requests can be made via in-app support or email.</p>
          </section>

          {/* 10. Children's Privacy */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">10. Children’s Privacy</h2>
            <p className="mb-2">DineDeal is not intended for users below 18 years of age.</p>
            <p>We do not knowingly collect data from minors.</p>
          </section>

          {/* 11. Third-Party Links */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">11. Third-Party Links</h2>
            <p className="mb-2">The Platform may contain links to third-party websites or services.</p>
            <p>We are not responsible for their privacy practices.</p>
          </section>

          {/* 12. Changes */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">12. Changes to This Privacy Policy</h2>
            <p className="mb-2">We may update this Policy from time to time.</p>
            <p className="mb-2">Significant changes will be notified via app or email.</p>
            <p>Continued use of the Platform constitutes acceptance of the updated Policy.</p>
          </section>

          {/* 13. Grievance */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">13. Grievance Redressal & Contact</h2>
            <p className="mb-2">In accordance with Indian law, we have appointed a Grievance Officer.</p>
            <p className="mb-1">Email: zaveltd@gmail.com</p>
            <p>Response Time: Within 48–72 working hours</p>
          </section>

          {/* 14. Governing Law */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">14. Governing Law</h2>
            <p className="mb-2">This Privacy Policy is governed by the laws of India.</p>
            <p>Any disputes shall be subject to the jurisdiction of Indian courts.</p>
          </section>

          {/* 15. Acknowledgement */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">15. Acknowledgement</h2>
            <p>
              By using DineDeal, you acknowledge that you have read, understood, and agreed to this
              Privacy Policy.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
