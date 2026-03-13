import React from 'react';

const RestaurantPrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-sm border border-gray-200 overflow-hidden">
        
        {/* Document Header */}
        <div className="bg-gray-900 text-white p-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2">
            DINEDEAL – PRIVACY POLICY FOR RESTAURANT PARTNERS
          </h1>
          <p className="text-gray-400 text-sm">
            Last Updated: [23/01/2026]
          </p>
        </div>

        {/* Content Container */}
        <div className="p-8 md:p-12 text-gray-800 text-sm md:text-base leading-relaxed space-y-8">

          {/* Preamble */}
          <section className="space-y-4">
            <p>
              This Privacy Policy (“Policy”) describes how DineDeal (“DineDeal”, “Company”, “we”, “us”, or “our”) 
              collects, uses, stores, processes, shares, retains, and protects information relating to restaurant 
              partners, including restaurant owners, operators, managers, authorised representatives, and staff 
              members (collectively, “Restaurant Partner”, “You”, “Your”) who access or use the DineDeal platform.
            </p>
            <p>
              This Policy applies to all Restaurant Partners who list, register, onboard, operate, or otherwise 
              interact with DineDeal through its mobile applications, web applications, dashboards, APIs, 
              communication channels, or related services (collectively, the “Platform”).
            </p>
            <p className="font-semibold">
              By registering as or continuing as a Restaurant Partner, you acknowledge that you have read, 
              understood, and agreed to the practices described in this Policy.
            </p>
          </section>

          {/* 1. Purpose and Scope */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">1. PURPOSE AND SCOPE</h2>
            
            <p className="mb-2"><strong>1.1</strong> This Policy governs the handling of data collected from Restaurant Partners in connection with:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>Restaurant onboarding and verification</li>
              <li>Business listing and profile management</li>
              <li>Reservation and dine-in operations</li>
              <li>Payment processing and settlements</li>
              <li>Compliance, audits, and dispute resolution</li>
              <li>Platform security, fraud prevention, and analytics</li>
            </ul>

            <p className="mb-2"><strong>1.2</strong> This Policy applies only to Restaurant Partners and is separate from the privacy policy applicable to customers.</p>
            
            <p className="mb-2"><strong>1.3</strong> This Policy must be read together with:</p>
            <ul className="list-disc list-outside pl-5 space-y-1">
              <li>Restaurant Terms & Conditions</li>
              <li>Platform Terms of Use</li>
              <li>Applicable Laws of India</li>
            </ul>
          </section>

          {/* 2. Categories of Information */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">2. CATEGORIES OF INFORMATION WE COLLECT</h2>
            
            <h3 className="font-bold mb-2">2.1 Business Identification Information</h3>
            <p className="mb-2">We may collect:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>Restaurant name, brand name, and trade name</li>
              <li>Type of establishment (café, fine dining, casual dining, etc.)</li>
              <li>Address, city, state, and location details</li>
              <li>Business registration details (if applicable)</li>
            </ul>

            <h3 className="font-bold mb-2">2.2 Owner and Authorised Representative Information</h3>
            <p className="mb-2">We may collect:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>Full name</li>
              <li>Mobile number</li>
              <li>Email address</li>
              <li>Role or designation</li>
              <li>Government-issued identification (where required for verification)</li>
            </ul>

            <h3 className="font-bold mb-2">2.3 KYC AND VERIFICATION INFORMATION</h3>
            <p className="mb-2">For compliance, fraud prevention, and settlement purposes, we may collect:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
              <li>PAN details</li>
              <li>GST details (if applicable)</li>
              <li>Bank account details</li>
              <li>Cancelled cheque or bank proof</li>
              <li>Identity verification documents</li>
              <li>Address proof</li>
            </ul>
            <p className="mb-4">Such data may be collected directly or via third-party verification partners.</p>

            <h3 className="font-bold mb-2">2.4 Financial AND SETTLEMENT INFORMATION</h3>
            <p className="mb-2">We may collect and process:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
              <li>Bank account numbers</li>
              <li>IFSC codes</li>
              <li>Settlement preferences</li>
              <li>Transaction histories</li>
              <li>Payout amounts and timestamps</li>
              <li>Commission or platform fee data</li>
            </ul>
            <p className="mb-4">DineDeal does not store sensitive payment instrument credentials such as PINs or passwords.</p>

            <h3 className="font-bold mb-2">2.5 Restaurant Operational Data</h3>
            <p className="mb-2">We may collect:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>Reservation availability</li>
              <li>Seating capacity</li>
              <li>Operating hours</li>
              <li>Menu details and pricing</li>
              <li>Offers, discounts, and deal configurations</li>
            </ul>

            <h3 className="font-bold mb-2">2.6 PLATFORM USAGE AND TECHNICAL DATA</h3>
            <p className="mb-2">We may automatically collect:</p>
            <ul className="list-disc list-outside pl-5 space-y-1">
              <li>Login timestamps</li>
              <li>IP addresses</li>
              <li>Device and browser information</li>
              <li>Dashboard usage activity</li>
              <li>Error logs and diagnostics</li>
            </ul>
          </section>

          {/* 3. Purposes of Data Processing */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">3. PURPOSES OF DATA PROCESSING</h2>
            <p className="mb-4">We process Restaurant Partner data for the following lawful purposes:</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">3.1 Onboarding and Verification</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Identity verification</li>
                  <li>KYC compliance</li>
                  <li>Fraud prevention</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">3.2 Platform Operations</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Listing restaurants</li>
                  <li>Enabling reservations</li>
                  <li>Managing availability and offers</li>
                  <li>Facilitating dine-in workflows</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">3.3 Payments and Settlements</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Processing payouts</li>
                  <li>Reconciling transactions</li>
                  <li>Resolving payment disputes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">3.4 Communication</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Operational notifications</li>
                  <li>Policy updates</li>
                  <li>Support communications</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">3.5 Legal and Regulatory Compliance</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Tax compliance</li>
                  <li>Accounting records</li>
                  <li>Government or court requests</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-2">3.6 Analytics and Platform Improvement</h3>
                <ul className="list-disc list-outside pl-5 space-y-1">
                  <li>Usage analysis</li>
                  <li>Feature optimisation</li>
                  <li>Risk monitoring</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Legal Basis */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">4. LEGAL BASIS FOR PROCESSING</h2>
            <p className="mb-2">We process data based on:</p>
            <ul className="list-disc list-outside pl-5 space-y-1">
              <li>Performance of contractual obligations</li>
              <li>Legal and regulatory requirements</li>
              <li>Legitimate business interests</li>
              <li>Consent, where required</li>
            </ul>
          </section>

          {/* 5. Data Sharing */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">5. DATA SHARING AND DISCLOSURE</h2>
            
            <h3 className="font-bold mb-2">5.1 With Payment and Banking Partners</h3>
            <p className="mb-2">Data may be shared with:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>Payment gateways</li>
              <li>Banking partners</li>
              <li>Settlement service providers</li>
            </ul>

            <h3 className="font-bold mb-2">5.2 With Verification and Compliance Partners</h3>
            <p className="mb-2">For:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>KYC verification</li>
              <li>Fraud detection</li>
              <li>Risk assessment</li>
            </ul>

            <h3 className="font-bold mb-2">5.3 With Government or Legal Authorities</h3>
            <p className="mb-2">When required by:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
              <li>Law</li>
              <li>Regulation</li>
              <li>Court order</li>
            </ul>

            <h3 className="font-bold mb-2">5.4 Business Transfers</h3>
            <p className="mb-2">In the event of:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
              <li>Merger</li>
              <li>Acquisition</li>
              <li>Restructuring</li>
            </ul>
            <p>Restaurant Partner data may be transferred subject to confidentiality obligations.</p>
          </section>

          {/* 6. Storage and Retention */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">6. DATA STORAGE AND RETENTION</h2>
            <p className="mb-2"><strong>6.1</strong> Data is stored on secure servers located in India or other compliant jurisdictions.</p>
            <p className="mb-2"><strong>6.2</strong> Retention periods depend on:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
              <li>Legal requirements</li>
              <li>Contractual obligations</li>
              <li>Business necessity</li>
            </ul>
            <p className="mb-2"><strong>6.3</strong> Upon termination:</p>
            <ul className="list-disc list-outside pl-5 space-y-1">
              <li>Certain data may be retained for audits, compliance, or dispute resolution.</li>
            </ul>
          </section>

          {/* 7. Security */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">7. DATA SECURITY MEASURES</h2>
            <p className="mb-2">We implement:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
              <li>Encryption at rest and in transit</li>
              <li>Access control mechanisms</li>
              <li>Role-based permissions</li>
              <li>Regular security audits</li>
            </ul>
            <p>No system is completely secure; however, reasonable safeguards are implemented.</p>
          </section>

          {/* 8. Confidentiality */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">8. CONFIDENTIALITY AND ACCESS CONTROL</h2>
            <p className="mb-2"><strong>8.1</strong> Restaurant Partner data is accessible only to:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
              <li>Authorised DineDeal personnel</li>
              <li>Approved service providers</li>
            </ul>
            <p><strong>8.2</strong> Employees and vendors are bound by confidentiality obligations.</p>
          </section>

          {/* 9. Rights */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">9. RIGHTS OF RESTAURANT PARTNERS</h2>
            <p className="mb-2">You may request:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
              <li>Access to your data</li>
              <li>Correction of inaccuracies</li>
              <li>Account deactivation (subject to legal retention)</li>
            </ul>
            <p>Requests can be made via the contact details below.</p>
          </section>

          {/* 10. Accuracy */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">10. DATA ACCURACY AND RESPONSIBILITY</h2>
            <p className="mb-2">Restaurant Partners are responsible for:</p>
            <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
              <li>Ensuring data accuracy</li>
              <li>Updating changes promptly</li>
            </ul>
            <p>DineDeal shall not be liable for consequences arising from incorrect data.</p>
          </section>

          {/* 11. Third Party Links */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">11. THIRD-PARTY LINKS AND SERVICES</h2>
            <p className="mb-2">The Platform may integrate third-party services.</p>
            <p>DineDeal is not responsible for their privacy practices.</p>
          </section>

          {/* 12. Cookies */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">12. COOKIES AND TRACKING TECHNOLOGIES</h2>
            <p className="mb-2">We may use cookies and similar tools to:</p>
            <ul className="list-disc list-outside pl-5 space-y-1">
              <li>Maintain sessions</li>
              <li>Improve dashboard performance</li>
              <li>Analyse usage</li>
            </ul>
          </section>

          {/* 13. Termination */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">13. TERMINATION AND DATA HANDLING</h2>
            <p className="mb-2">Upon termination:</p>
            <ul className="list-disc list-outside pl-5 space-y-1">
              <li>Access may be revoked</li>
              <li>Data may be archived</li>
              <li>Certain data retained as required by law</li>
            </ul>
          </section>

          {/* 14. Liability */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">14. LIMITATION OF LIABILITY</h2>
            <p className="mb-2">To the maximum extent permitted by law:</p>
            <ul className="list-disc list-outside pl-5 space-y-1">
              <li>DineDeal shall not be liable for indirect or consequential damages</li>
              <li>Liability shall not exceed amounts paid or payable under the Platform</li>
            </ul>
          </section>

          {/* 15. Changes */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">15. CHANGES TO THIS POLICY</h2>
            <p className="mb-2">We may update this Policy from time to time.</p>
            <p>Continued use constitutes acceptance.</p>
          </section>

          {/* 16. Grievance */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">16. GRIEVANCE REDRESSAL</h2>
            <p className="mb-2">For questions or concerns, contact:</p>
            <p className="mb-2">📧 Email: zaveltd@gmail.com</p>
            <p>We aim to respond within 48–72 working hours.</p>
          </section>

          {/* 17. Governing Law */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">17. GOVERNING LAW</h2>
            <p className="mb-2">This Policy shall be governed by the laws of India.</p>
            <p>Courts of competent jurisdiction in India shall have authority.</p>
          </section>

          {/* 18. Acknowledgement */}
          <section>
            <h2 className="text-lg font-bold uppercase mb-3">18. ACKNOWLEDGEMENT</h2>
            <p className="mb-2">By registering as a Restaurant Partner, you acknowledge that:</p>
            <ul className="list-disc list-outside pl-5 space-y-1">
              <li>You have read this Policy</li>
              <li>You understand how your data is processed</li>
              <li>You consent to such processing as permitted by law</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
};

export default RestaurantPrivacyPolicy;
