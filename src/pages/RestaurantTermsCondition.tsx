import React from 'react';

const RestaurantTermsCondition: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-sm border border-gray-200 overflow-hidden">
        
        {/* Document Header */}
        <div className="bg-gray-900 text-white p-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2">
            DINEDEAL – RESTAURANT PARTNER TERMS & CONDITIONS
          </h1>
          <p className="text-gray-400 text-sm">
            Last Updated: [●]
          </p>
        </div>

        {/* Content Container */}
        <div className="p-8 md:p-12 text-gray-800 text-sm md:text-base leading-relaxed space-y-8">

          {/* ================= PART I ================= */}
          <section className="space-y-6">
            <div className="border-b-2 border-gray-900 pb-2 mb-6">
              <h2 className="text-xl font-bold text-gray-900 uppercase">
                PART I: DEFINITIONS, PLATFORM ROLE, LEGAL RELATIONSHIP, ONBOARDING & COMMERCIAL FRAMEWORK
              </h2>
            </div>

            {/* Preamble */}
            <div>
              <h3 className="font-bold text-lg mb-3 uppercase">PREAMBLE AND LEGAL NOTICE</h3>
              <p className="mb-2">These Restaurant Partner Terms & Conditions (“Agreement”, “Terms”) constitute a legally binding agreement between:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
                <li>
                  DineDeal, a technology-enabled platform and intermediary operating under the laws of India (“DineDeal”, “Company”, “Platform”, “We”, “Us”, “Our”); and
                </li>
                <li>
                  The restaurant, café, food outlet, cloud kitchen, bar, or food service establishment that registers, lists, or operates on the Platform (“Restaurant Partner”, “Restaurant”, “You”, “Merchant”).
                </li>
              </ul>
              <p className="mb-2">
                By registering on the DineDeal Platform, accessing the merchant dashboard, listing offers, accepting reservations, receiving settlements, or otherwise availing any service provided by DineDeal, the Restaurant Partner expressly acknowledges that it has read, understood, and agreed to be bound by this Agreement.
              </p>
              <p className="font-semibold">
                If the Restaurant Partner does not agree with any provision of this Agreement, it must immediately discontinue use of the Platform.
              </p>
            </div>

            {/* 1. Definitions */}
            <div>
              <h3 className="font-bold text-lg mb-3">1. DEFINITIONS AND INTERPRETATION</h3>
              
              <h4 className="font-bold mb-2">1.1 Definitions</h4>
              <p className="mb-2">Unless the context otherwise requires, the following terms shall have the meanings assigned below:</p>
              <ul className="list-disc list-outside pl-5 space-y-2 mb-4">
                <li>
                  <strong>“Agreement”</strong> means these Restaurant Partner Terms & Conditions, including all schedules, annexures, policies, and amendments.
                </li>
                <li>
                  <strong>“Applicable Law”</strong> means all laws, statutes, rules, regulations, circulars, notifications, guidelines, directions, and governmental orders applicable in India.
                </li>
                <li>
                  <strong>“Commission”</strong> means the percentage fee charged by DineDeal on completed transactions, as specified herein.
                </li>
                <li>
                  <strong>“Customer”</strong> means an end user who accesses the DineDeal platform to discover restaurants, make reservations, or complete dine-in payments.
                </li>
                <li>
                  <strong>“Dashboard”</strong> means the Restaurant Partner’s digital interface provided by DineDeal for managing listings, offers, settlements, and analytics.
                </li>
                <li>
                  <strong>“Settlement”</strong> means the transfer of eligible transaction amounts to the Restaurant Partner after deductions.
                </li>
                <li>
                  <strong>“T+0 Settlement”</strong> means settlement initiation on the same calendar day as transaction completion.
                </li>
                <li>
                  <strong>“Transaction”</strong> means a completed dine-in payment or bill settlement processed through the Platform.
                </li>
              </ul>

              <h4 className="font-bold mb-2">1.2 Interpretation Rules</h4>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Headings are for convenience only and shall not affect interpretation.</li>
                <li>Singular includes plural and vice versa.</li>
                <li>“Including” shall mean “including without limitation”.</li>
                <li>Any ambiguity shall be interpreted in a manner that preserves DineDeal’s role as a technology intermediary.</li>
              </ul>
            </div>

            {/* 2. Purpose */}
            <div>
              <h3 className="font-bold text-lg mb-3">2. PURPOSE AND SCOPE OF THE AGREEMENT</h3>
              
              <h4 className="font-bold mb-2">2.1 Purpose</h4>
              <p className="mb-2">This Agreement governs the commercial, operational, and legal relationship between DineDeal and the Restaurant Partner, including:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Listing of the Restaurant on the Platform</li>
                <li>Display and promotion of offers, deals, and pricing</li>
                <li>Facilitation of customer reservations and dine-in payments</li>
                <li>Marketing, branding, and visibility services</li>
                <li>Settlement of eligible transaction amounts</li>
              </ul>

              <h4 className="font-bold mb-2">2.2 Scope</h4>
              <p>This Agreement applies to all interactions between the Restaurant Partner and DineDeal, whether online or offline, including dashboard usage, communications, settlements, and dispute resolution.</p>
            </div>

            {/* 3. Legal Nature */}
            <div>
              <h3 className="font-bold text-lg mb-3">3. LEGAL NATURE OF DINEDEAL</h3>
              
              <h4 className="font-bold mb-2">3.1 Technology Intermediary Only</h4>
              <p className="mb-2">DineDeal is a technology and marketing platform that facilitates discovery, promotion, and payment enablement between Customers and Restaurants.</p>
              <p className="mb-2">DineDeal does not:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Own, operate, or manage any restaurant</li>
                <li>Control food preparation, quality, hygiene, or service</li>
                <li>Employ restaurant staff</li>
                <li>Act as an agent, franchisee, or partner of the Restaurant</li>
              </ul>

              <h4 className="font-bold mb-2">3.2 No Agency or Partnership</h4>
              <p className="mb-2">Nothing in this Agreement shall be construed as creating:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>A partnership</li>
                <li>A joint venture</li>
                <li>An agency relationship</li>
                <li>An employer-employee relationship</li>
              </ul>
              <p>between DineDeal and the Restaurant Partner. The Restaurant Partner operates as an independent business entity.</p>
            </div>

            {/* 4. Onboarding */}
            <div>
              <h3 className="font-bold text-lg mb-3">4. RESTAURANT ONBOARDING & ELIGIBILITY</h3>
              
              <h4 className="font-bold mb-2">4.1 Eligibility Requirements</h4>
              <p className="mb-2">To onboard on the Platform, the Restaurant Partner represents and warrants that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>It is lawfully established and permitted to operate</li>
                <li>It holds all required licenses and approvals</li>
                <li>It complies with food safety, labour, and tax laws</li>
              </ul>

              <h4 className="font-bold mb-2">4.2 Verification and KYC</h4>
              <p className="mb-2">DineDeal may require submission of:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Business registration details</li>
                <li>PAN, GST (if applicable)</li>
                <li>Bank account details</li>
                <li>Identity details of authorised representatives</li>
              </ul>
              <p className="mb-4">DineDeal reserves the right to suspend onboarding or delist the Restaurant if verification fails.</p>

              <h4 className="font-bold mb-2">4.3 Accuracy of Information</h4>
              <p className="mb-2">The Restaurant Partner shall ensure that all information provided is:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>True</li>
                <li>Accurate</li>
                <li>Complete</li>
                <li>Kept up to date</li>
              </ul>
              <p>DineDeal shall not be liable for losses arising from inaccurate information.</p>
            </div>

            {/* 5. Commercial Model */}
            <div>
              <h3 className="font-bold text-lg mb-3">5. COMMERCIAL MODEL AND COMMISSION</h3>
              
              <h4 className="font-bold mb-2">5.1 Platform Commission</h4>
              <p className="mb-2">DineDeal shall charge a 5% (five percent) commission on the final transaction value.</p>
              <p className="mb-4">The commission may be calculated inclusive or exclusive of taxes, as determined by DineDeal from time to time.</p>

              <h4 className="font-bold mb-2">5.2 Deduction Mechanism</h4>
              <p className="mb-2">Unless otherwise agreed in writing:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Commission shall be deducted prior to settlement.</li>
                <li>The Restaurant Partner authorises DineDeal to make such deductions.</li>
              </ul>

              <h4 className="font-bold mb-2">5.3 Modification of Commission</h4>
              <p className="mb-2">DineDeal reserves the right to revise commission rates upon prior notice via dashboard or email.</p>
              <p>Continued use of the Platform constitutes acceptance of revised rates.</p>
            </div>

            {/* 6. Taxes */}
            <div>
              <h3 className="font-bold text-lg mb-3">6. TAXES AND STATUTORY COMPLIANCE</h3>
              
              <h4 className="font-bold mb-2">6.1 Restaurant Responsibilities</h4>
              <p className="mb-2">The Restaurant Partner is solely responsible for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>GST registration (if applicable)</li>
                <li>Tax calculation and payment</li>
                <li>Issuance of valid tax invoices to Customers</li>
                <li>Compliance with all tax laws</li>
              </ul>

              <h4 className="font-bold mb-2">6.2 Commission Taxes</h4>
              <p>Any tax applicable on DineDeal’s commission shall be borne as per Applicable Law.</p>
            </div>

            {/* 7. Settlement */}
            <div>
              <h3 className="font-bold text-lg mb-3">7. SETTLEMENT FRAMEWORK</h3>
              
              <h4 className="font-bold mb-2">7.1 T+0 Settlement Phase</h4>
              <p className="mb-4">DineDeal currently operates a T+0 settlement cycle, meaning settlement is initiated on the same day of successful transaction completion.</p>

              <h4 className="font-bold mb-2">7.2 Promotional Nature of T+0</h4>
              <p className="mb-2">The Restaurant Partner expressly acknowledges that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>T+0 settlement is a promotional / introductory facility</li>
                <li>It is not guaranteed indefinitely</li>
                <li>It does not create a vested right</li>
              </ul>

              <h4 className="font-bold mb-2">7.3 Right to Modify Settlement Cycle</h4>
              <p className="mb-2">DineDeal reserves the absolute right to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Change settlement cycles (T+1, T+2, weekly, etc.)</li>
                <li>Temporarily hold settlements for reconciliation, disputes, fraud checks, or compliance</li>
              </ul>
              <p className="mb-4">Such changes shall be communicated via dashboard, email, or platform notification.</p>

              <h4 className="font-bold mb-2">7.4 Settlement Adjustments</h4>
              <p className="mb-2">Settlements may be adjusted for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Commission</li>
                <li>Refunds</li>
                <li>Chargebacks</li>
                <li>Disputed transactions</li>
                <li>Regulatory or legal holds</li>
              </ul>
            </div>

            {/* 8. Discretion */}
            <div>
              <h3 className="font-bold text-lg mb-3">8. PLATFORM DISCRETION AND BUSINESS RISK</h3>
              
              <h4 className="font-bold mb-2">8.1 No Guaranteed Revenue</h4>
              <p className="mb-2">DineDeal does not guarantee:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Minimum transactions</li>
                <li>Customer footfall</li>
                <li>Revenue generation</li>
              </ul>

              <h4 className="font-bold mb-2">8.2 Visibility and Algorithmic Control</h4>
              <p className="mb-2">DineDeal may modify:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Restaurant visibility</li>
                <li>Rankings</li>
                <li>Algorithmic exposure</li>
              </ul>
              <p>based on platform strategy, without liability.</p>
            </div>

            {/* 9. Representations */}
            <div>
              <h3 className="font-bold text-lg mb-3">9. REPRESENTATIONS AND WARRANTIES OF RESTAURANT</h3>
              <p className="mb-2">The Restaurant Partner represents that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>All food served is safe and compliant</li>
                <li>All offers will be honoured</li>
                <li>No discriminatory practices will be followed</li>
                <li>Customers from DineDeal will be treated equally</li>
              </ul>
            </div>

            {/* 10. Survival */}
            <div>
              <h3 className="font-bold text-lg mb-3">10. SURVIVAL AND CONTINUITY</h3>
              <p className="mb-2">Clauses relating to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Commission</li>
                <li>Taxes</li>
                <li>Settlements</li>
                <li>Liability</li>
                <li>Indemnity</li>
              </ul>
              <p>shall survive termination of this Agreement.</p>
            </div>
          </section>

          {/* ================= PART II ================= */}
          <section className="space-y-6">
            <div className="border-b-2 border-gray-900 pb-2 mb-6 pt-10">
              <h2 className="text-xl font-bold text-gray-900 uppercase">
                PART II: TRANSACTIONS, PAYMENTS, SETTLEMENTS, REFUNDS, MARKETING, OFFERS & PLATFORM CONTROLS
              </h2>
              <p className="text-sm mt-1 text-gray-500">Last Updated: [●]</p>
            </div>

            {/* 1. Purpose */}
            <div>
              <h3 className="font-bold text-lg mb-3">1. PURPOSE AND STRUCTURE OF PART II</h3>
              <p className="mb-2"><strong>1.1</strong> This Part II governs all financial, transactional, promotional, and operational aspects of the relationship between DineDeal and the Restaurant Partner.</p>
              <p><strong>1.2</strong> This Part II must be read together with Part I and Part III. In the event of conflict, the interpretation that most strongly preserves DineDeal’s role as a technology intermediary and risk-limited platform shall prevail.</p>
            </div>

            {/* 2. Transaction Lifecycle */}
            <div>
              <h3 className="font-bold text-lg mb-3">2. TRANSACTION LIFE-CYCLE ON THE PLATFORM</h3>
              
              <h4 className="font-bold mb-2">2.1 Nature of Transactions</h4>
              <p className="mb-2"><strong>2.1.1</strong> Transactions facilitated through the Platform may include:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Dine-in bill payments</li>
                <li>Advance payments</li>
                <li>Reservation-linked transactions</li>
                <li>Promotional or discounted transactions</li>
              </ul>
              <p className="mb-4"><strong>2.1.2</strong> DineDeal merely facilitates the digital processing of such transactions and does not become a party to the underlying food or service contract between the Customer and the Restaurant Partner.</p>

              <h4 className="font-bold mb-2">2.2 Completion of Transaction</h4>
              <p className="mb-2"><strong>2.2.1</strong> A transaction shall be deemed “completed” when:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Payment is successfully captured through the Platform, and</li>
                <li>The Customer has been served or the bill has been generated, as applicable.</li>
              </ul>
              <p className="mb-2"><strong>2.2.2</strong> DineDeal relies on system logs, payment gateway confirmations, and Restaurant Partner inputs to determine transaction completion.</p>
            </div>

            {/* 3. Payment Processing */}
            <div>
              <h3 className="font-bold text-lg mb-3">3. PAYMENT PROCESSING FRAMEWORK</h3>
              
              <h4 className="font-bold mb-2">3.1 Role of DineDeal in Payments</h4>
              <p className="mb-2"><strong>3.1.1</strong> DineDeal acts solely as a payment facilitation intermediary.</p>
              <p className="mb-2"><strong>3.1.2</strong> DineDeal does not:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Act as a bank or wallet</li>
                <li>Store sensitive payment credentials</li>
                <li>Guarantee uninterrupted payment services</li>
              </ul>

              <h4 className="font-bold mb-2">3.2 Third-Party Payment Gateways</h4>
              <p className="mb-2"><strong>3.2.1</strong> All payments are processed via RBI-compliant third-party payment gateways.</p>
              <p className="mb-2"><strong>3.2.2</strong> The Restaurant Partner acknowledges that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Payment gateway performance is outside DineDeal’s control</li>
                <li>Failures, delays, or reversals may occur due to banking or network issues</li>
              </ul>

              <h4 className="font-bold mb-2">3.3 Failed, Pending, or Reversed Payments</h4>
              <p className="mb-2"><strong>3.3.1</strong> Transactions may be marked as:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Failed</li>
                <li>Pending</li>
                <li>Reversed</li>
              </ul>
              <p className="mb-2">based on payment gateway status.</p>
              <p className="mb-2"><strong>3.3.2</strong> DineDeal shall not be liable for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Customer dissatisfaction arising from payment failures</li>
                <li>Loss of business due to technical payment issues</li>
              </ul>
            </div>

            {/* 4. Settlement Mechanism */}
            <div>
              <h3 className="font-bold text-lg mb-3">4. SETTLEMENT MECHANISM (DETAILED)</h3>
              
              <h4 className="font-bold mb-2">4.1 Settlement Eligibility</h4>
              <p className="mb-2"><strong>4.1.1</strong> Only transactions that are:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Successfully completed</li>
                <li>Not under dispute</li>
                <li>Not flagged for fraud</li>
              </ul>
              <p className="mb-4">shall be eligible for settlement.</p>

              <h4 className="font-bold mb-2">4.2 T+0 Settlement (Promotional Phase)</h4>
              <p className="mb-2"><strong>4.2.1</strong> DineDeal currently offers a T+0 settlement model, where settlement initiation occurs on the same day as transaction completion.</p>
              <p className="mb-2"><strong>4.2.2</strong> The Restaurant Partner expressly acknowledges that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>T+0 settlement is promotional and discretionary</li>
                <li>It may be modified, paused, or withdrawn at any time</li>
              </ul>

              <h4 className="font-bold mb-2">4.3 Modification or Suspension of Settlements</h4>
              <p className="mb-2"><strong>4.3.1</strong> DineDeal reserves the right to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Shift to T+1, T+2, weekly, or custom settlement cycles</li>
                <li>Temporarily hold settlements for reconciliation or compliance</li>
              </ul>
              <p className="mb-2"><strong>4.3.2</strong> Grounds for holding settlements include:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Refunds or chargebacks</li>
                <li>Customer complaints</li>
                <li>Fraud investigations</li>
                <li>Regulatory requirements</li>
                <li>Technical reconciliation</li>
              </ul>

              <h4 className="font-bold mb-2">4.4 Settlement Adjustments and Deductions</h4>
              <p className="mb-2">Settlements may be adjusted for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Platform commission</li>
                <li>Taxes (if applicable)</li>
                <li>Refunds</li>
                <li>Chargebacks</li>
                <li>Promotional costs (if agreed)</li>
                <li>Penalties arising from policy violations</li>
              </ul>
            </div>

            {/* 5. Refunds */}
            <div>
              <h3 className="font-bold text-lg mb-3">5. REFUNDS AND CHARGEBACKS</h3>
              
              <h4 className="font-bold mb-2">5.1 Customer Refunds</h4>
              <p className="mb-2"><strong>5.1.1</strong> Refunds may arise due to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Restaurant fault</li>
                <li>Order failure</li>
                <li>Service quality issues</li>
                <li>Entry denial</li>
                <li>Transaction errors</li>
              </ul>
              <p className="mb-2"><strong>5.1.2</strong> The Restaurant Partner acknowledges that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Refunds may be processed directly to the Customer</li>
                <li>Refund amounts may be deducted from future settlements</li>
              </ul>

              <h4 className="font-bold mb-2">5.2 Chargebacks</h4>
              <p className="mb-2"><strong>5.2.1</strong> Chargebacks may be initiated by Customers via banks or payment gateways.</p>
              <p className="mb-2"><strong>5.2.2</strong> The Restaurant Partner shall:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Cooperate in investigations</li>
                <li>Provide requested documentation</li>
              </ul>
              <p className="mb-4"><strong>5.2.3</strong> Chargeback amounts, penalties, or fees may be deducted from settlements.</p>

              <h4 className="font-bold mb-2">5.3 Fraudulent Transactions</h4>
              <p className="mb-2"><strong>5.3.1</strong> Transactions suspected to be fraudulent may be:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Reversed</li>
                <li>Withheld</li>
                <li>Permanently blocked from settlement</li>
              </ul>
            </div>

            {/* 6. Pricing & Offers */}
            <div>
              <h3 className="font-bold text-lg mb-3">6. PRICING, OFFERS, AND DEAL INTEGRITY</h3>
              
              <h4 className="font-bold mb-2">6.1 Pricing Accuracy</h4>
              <p className="mb-2"><strong>6.1.1</strong> The Restaurant Partner is solely responsible for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Accuracy of prices</li>
                <li>Menu correctness</li>
                <li>Taxes and charges displayed</li>
              </ul>
              <p className="mb-4"><strong>6.1.2</strong> DineDeal shall not be liable for losses arising from incorrect pricing provided by the Restaurant.</p>

              <h4 className="font-bold mb-2">6.2 Offers and Promotions</h4>
              <p className="mb-2"><strong>6.2.1</strong> All offers listed on the Platform must be:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Honoured without discrimination</li>
                <li>Applied exactly as displayed</li>
              </ul>
              <p className="mb-2"><strong>6.2.2</strong> The Restaurant Partner shall not:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Deny offers to DineDeal customers</li>
                <li>Impose undisclosed conditions</li>
              </ul>

              <h4 className="font-bold mb-2">6.3 Withdrawal or Modification of Offers</h4>
              <p className="mb-2"><strong>6.3.1</strong> Restaurants may modify or withdraw offers, subject to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Platform policies</li>
                <li>Notice requirements (if any)</li>
              </ul>
              <p><strong>6.3.2</strong> DineDeal may suspend or delist offers that cause customer disputes or reputational harm.</p>
            </div>

            {/* 7. Marketing */}
            <div>
              <h3 className="font-bold text-lg mb-3">7. MARKETING AND PROMOTIONAL BENEFITS</h3>
              
              <h4 className="font-bold mb-2">7.1 Complimentary Promotional Content</h4>
              <p className="mb-2"><strong>7.1.1</strong> Subject to availability and discretion, DineDeal may provide:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Up to 10 promotional posts per calendar month</li>
                <li>Up to 2 promotional reels per calendar month</li>
              </ul>
              <p className="mb-2"><strong>7.1.2</strong> Such content is:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Complimentary</li>
                <li>Non-transferable</li>
                <li>Non-monetizable</li>
              </ul>

              <h4 className="font-bold mb-2">7.2 Editorial and Creative Discretion</h4>
              <p className="mb-2"><strong>7.2.1</strong> DineDeal retains full discretion over:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Whether content is created</li>
                <li>Timing of posting</li>
                <li>Platforms or channels used</li>
              </ul>
              <p className="mb-4"><strong>7.2.2</strong> Complimentary promotions are not guaranteed and do not constitute a contractual right.</p>

              <h4 className="font-bold mb-2">7.3 Paid Promotions</h4>
              <p className="mb-2"><strong>7.3.1</strong> Any promotional activity beyond complimentary limits shall:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Be chargeable</li>
                <li>Require explicit approval</li>
                <li>Be subject to baseline fees communicated separately</li>
              </ul>
            </div>

            {/* 8. Customer Handling */}
            <div>
              <h3 className="font-bold text-lg mb-3">8. CUSTOMER HANDLING AND NON-DISCRIMINATION</h3>
              <p className="mb-2"><strong>8.1</strong> The Restaurant Partner shall:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Treat DineDeal customers equally</li>
                <li>Not deny service based on booking source</li>
              </ul>
              <p className="mb-2"><strong>8.2</strong> Discrimination against DineDeal customers may result in:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Penalties</li>
                <li>Suspension</li>
                <li>Delisting</li>
              </ul>
            </div>

            {/* 9. Fraud Prevention */}
            <div>
              <h3 className="font-bold text-lg mb-3">9. PLATFORM MONITORING AND FRAUD PREVENTION</h3>
              
              <h4 className="font-bold mb-2">9.1 Monitoring Rights</h4>
              <p className="mb-2">DineDeal may monitor:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Transaction patterns</li>
                <li>Refund frequency</li>
                <li>Customer complaints</li>
                <li>Behavioural anomalies</li>
              </ul>

              <h4 className="font-bold mb-2">9.2 Corrective Actions</h4>
              <p className="mb-2">DineDeal may take corrective actions including:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Visibility reduction</li>
                <li>Offer suspension</li>
                <li>Settlement holds</li>
                <li>Account suspension or termination</li>
              </ul>
            </div>

            {/* 10. Disputes */}
            <div>
              <h3 className="font-bold text-lg mb-3">10. DISPUTES AND ESCALATIONS</h3>
              <p className="mb-2"><strong>10.1</strong> Customer disputes relating to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Food quality</li>
                <li>Service issues</li>
                <li>Pricing</li>
              </ul>
              <p className="mb-2">shall be primarily resolved by the Restaurant Partner.</p>
              <p><strong>10.2</strong> DineDeal may facilitate communication but does not adjudicate food or service quality disputes.</p>
            </div>

            {/* 11. Limitation */}
            <div>
              <h3 className="font-bold text-lg mb-3">11. LIMITATION OF PLATFORM RESPONSIBILITY</h3>
              <p className="mb-2"><strong>11.1</strong> DineDeal shall not be responsible for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Food quality</li>
                <li>Hygiene standards</li>
                <li>Staff conduct</li>
                <li>Regulatory violations by the Restaurant</li>
              </ul>
            </div>

            {/* 12. Survival Part II */}
            <div>
              <h3 className="font-bold text-lg mb-3">12. SURVIVAL OF FINANCIAL CLAUSES</h3>
              <p className="mb-2">All clauses relating to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Payments</li>
                <li>Settlements</li>
                <li>Refunds</li>
                <li>Chargebacks</li>
                <li>Commission</li>
              </ul>
              <p>shall survive termination of this Agreement.</p>
            </div>
          </section>

          {/* ================= PART III ================= */}
          <section className="space-y-6">
            <div className="border-b-2 border-gray-900 pb-2 mb-6 pt-10">
              <h2 className="text-xl font-bold text-gray-900 uppercase">
                PART III: DATA, CONFIDENTIALITY, INTELLECTUAL PROPERTY, ENFORCEMENT, LIABILITY, TERMINATION & GOVERNING LAW
              </h2>
              <p className="text-sm mt-1 text-gray-500">Last Updated: [●]</p>
            </div>

            {/* 1. Purpose */}
            <div>
              <h3 className="font-bold text-lg mb-3">1. PURPOSE AND LEGAL EFFECT OF PART III</h3>
              <p className="mb-2"><strong>1.1</strong> This Part III governs:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Ownership, use, and protection of data</li>
                <li>Confidentiality obligations between the Parties</li>
                <li>Intellectual property rights and licensing</li>
                <li>Platform enforcement powers</li>
                <li>Limitation of liability and risk allocation</li>
                <li>Indemnity obligations of the Restaurant Partner</li>
                <li>Suspension, delisting, and termination</li>
                <li>Governing law, jurisdiction, and dispute resolution</li>
                <li>Miscellaneous legal doctrines ensuring enforceability</li>
              </ul>
              <p><strong>1.2</strong> Parts I, II, and III together constitute the entire Restaurant Partner Agreement between DineDeal and the Restaurant Partner.</p>
            </div>

            {/* 2. Data Ownership */}
            <div>
              <h3 className="font-bold text-lg mb-3">2. DATA OWNERSHIP, CONTROL & USAGE</h3>
              
              <h4 className="font-bold mb-2">2.1 Categories of Data</h4>
              <p className="mb-2">For the purposes of this Agreement, “Data” includes but is not limited to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Restaurant business information</li>
                <li>Menu, pricing, and offer data</li>
                <li>Transaction and settlement data</li>
                <li>Customer booking and payment metadata</li>
                <li>Analytics, performance metrics, and dashboards</li>
                <li>Communications exchanged via the Platform</li>
              </ul>

              <h4 className="font-bold mb-2">2.2 Ownership of Data</h4>
              <p className="mb-2"><strong>2.2.1</strong> Restaurant Partner retains ownership of:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Its business name, branding, and menu content</li>
                <li>Its proprietary pricing and operational information</li>
              </ul>
              <p className="mb-2"><strong>2.2.2</strong> DineDeal retains ownership of:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Platform-generated analytics</li>
                <li>Transaction logs and system records</li>
                <li>Aggregated and anonymised insights</li>
                <li>Platform architecture, dashboards, and reports</li>
              </ul>

              <h4 className="font-bold mb-2">2.3 License to Use Restaurant Data</h4>
              <p className="mb-2">The Restaurant Partner grants DineDeal a:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Non-exclusive</li>
                <li>Worldwide</li>
                <li>Royalty-free</li>
                <li>Perpetual (for the term of this Agreement and archival thereafter as required by law)</li>
              </ul>
              <p className="mb-2">license to host, store, process, display, analyse, and use Restaurant Data solely for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Platform operations</li>
                <li>Marketing and promotion</li>
                <li>Analytics and reporting</li>
                <li>Compliance, audits, and dispute resolution</li>
              </ul>
            </div>

            {/* 3. Customer Data */}
            <div>
              <h3 className="font-bold text-lg mb-3">3. CUSTOMER DATA & DATA PROTECTION</h3>
              
              <h4 className="font-bold mb-2">3.1 Limited Access to Customer Data</h4>
              <p className="mb-2"><strong>3.1.1</strong> Restaurant Partners shall receive only such Customer Data as is strictly necessary to fulfil reservations, dine-in services, or compliance obligations.</p>
              <p className="mb-2"><strong>3.1.2</strong> Customer Data shall not be used by the Restaurant Partner for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Unsolicited marketing</li>
                <li>Third-party sharing</li>
                <li>Any purpose outside the transaction</li>
              </ul>

              <h4 className="font-bold mb-2">3.2 Compliance With Data Protection Laws</h4>
              <p className="mb-2"><strong>3.2.1</strong> Restaurant Partner agrees to comply with:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Applicable data protection laws in India</li>
                <li>Platform data handling policies</li>
                <li>Reasonable security practices</li>
              </ul>
              <p className="mb-4"><strong>3.2.2</strong> Any misuse or breach of Customer Data shall be the sole responsibility of the Restaurant Partner.</p>

              <h4 className="font-bold mb-2">3.3 Data Breach Obligations</h4>
              <p className="mb-2">In the event of a data breach attributable to the Restaurant Partner, the Partner shall:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Immediately notify DineDeal</li>
                <li>Cooperate in mitigation and investigation</li>
                <li>Indemnify DineDeal for losses arising therefrom</li>
              </ul>
            </div>

            {/* 4. Confidentiality */}
            <div>
              <h3 className="font-bold text-lg mb-3">4. CONFIDENTIALITY OBLIGATIONS</h3>
              
              <h4 className="font-bold mb-2">4.1 Confidential Information</h4>
              <p className="mb-2">“Confidential Information” includes:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Commercial terms</li>
                <li>Commission structures</li>
                <li>Settlement data</li>
                <li>Platform features and algorithms</li>
                <li>Non-public communications</li>
              </ul>

              <h4 className="font-bold mb-2">4.2 Confidentiality Undertaking</h4>
              <p className="mb-2">Each Party agrees:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>To keep Confidential Information strictly confidential</li>
                <li>Not to disclose it to third parties except as required by law</li>
                <li>To use it solely for purposes of this Agreement</li>
              </ul>

              <h4 className="font-bold mb-2">4.3 Survival of Confidentiality</h4>
              <p>Confidentiality obligations shall survive termination of this Agreement.</p>
            </div>

            {/* 5. IP */}
            <div>
              <h3 className="font-bold text-lg mb-3">5. INTELLECTUAL PROPERTY RIGHTS</h3>
              
              <h4 className="font-bold mb-2">5.1 Platform IP</h4>
              <p className="mb-2">All intellectual property relating to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Software</li>
                <li>Source code</li>
                <li>User interface</li>
                <li>Algorithms</li>
                <li>Branding</li>
              </ul>
              <p className="mb-4">belongs exclusively to DineDeal.</p>

              <h4 className="font-bold mb-2">5.2 Restaurant IP License</h4>
              <p className="mb-2">The Restaurant Partner grants DineDeal a limited license to use:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Restaurant name</li>
                <li>Logo</li>
                <li>Images</li>
                <li>Videos</li>
                <li>Menu content</li>
              </ul>
              <p className="mb-4">solely for Platform listing, marketing, and promotional purposes.</p>

              <h4 className="font-bold mb-2">5.3 No Transfer of Ownership</h4>
              <p>Nothing in this Agreement transfers ownership of intellectual property from one Party to the other.</p>
            </div>

            {/* 6. Enforcement */}
            <div>
              <h3 className="font-bold text-lg mb-3">6. PLATFORM RIGHTS AND ENFORCEMENT POWERS</h3>
              
              <h4 className="font-bold mb-2">6.1 Monitoring and Audit Rights</h4>
              <p className="mb-2">DineDeal reserves the right to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Monitor Platform usage</li>
                <li>Audit transactions and offers</li>
                <li>Review customer complaints and ratings</li>
              </ul>

              <h4 className="font-bold mb-2">6.2 Corrective Actions</h4>
              <p className="mb-2">DineDeal may, at its discretion:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Suspend offers</li>
                <li>Reduce visibility</li>
                <li>Hold settlements</li>
                <li>Suspend or terminate access</li>
              </ul>
              <p>where misuse, fraud, or reputational risk is identified.</p>
            </div>

            {/* 7. Limitation Liability */}
            <div>
              <h3 className="font-bold text-lg mb-3">7. LIMITATION OF LIABILITY</h3>
              
              <h4 className="font-bold mb-2">7.1 Platform Limitation</h4>
              <p className="mb-2">DineDeal acts solely as a technology and marketing intermediary.</p>
              <p className="mb-2">DineDeal shall not be liable for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Food quality or safety</li>
                <li>Hygiene compliance</li>
                <li>Customer dissatisfaction</li>
                <li>Loss of profits or business</li>
                <li>Indirect or consequential damages</li>
              </ul>

              <h4 className="font-bold mb-2">7.2 Liability Cap</h4>
              <p className="mb-2">To the maximum extent permitted by law, DineDeal’s total liability, if any, shall not exceed:</p>
              <p>The total commission earned by DineDeal from the Restaurant Partner in the preceding 30 (thirty) days.</p>
            </div>

            {/* 8. Indemnity */}
            <div>
              <h3 className="font-bold text-lg mb-3">8. INDEMNITY</h3>
              
              <h4 className="font-bold mb-2">8.1 Restaurant Partner Indemnity</h4>
              <p className="mb-2">The Restaurant Partner agrees to indemnify and hold harmless DineDeal from and against any claims, losses, damages, penalties, costs, or expenses arising out of:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Food safety violations</li>
                <li>Regulatory non-compliance</li>
                <li>Customer claims</li>
                <li>Misrepresentation or fraud</li>
                <li>Breach of this Agreement</li>
              </ul>

              <h4 className="font-bold mb-2">8.2 Defence and Cooperation</h4>
              <p className="mb-2">The Restaurant Partner shall:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Provide full cooperation</li>
                <li>Bear legal costs</li>
                <li>Not settle claims without DineDeal’s consent</li>
              </ul>
            </div>

            {/* 9. Suspension */}
            <div>
              <h3 className="font-bold text-lg mb-3">9. SUSPENSION, DELISTING & TERMINATION</h3>
              
              <h4 className="font-bold mb-2">9.1 Suspension and Delisting</h4>
              <p className="mb-2">DineDeal may suspend or delist a Restaurant Partner for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Fraud or misuse</li>
                <li>Legal non-compliance</li>
                <li>Repeated customer complaints</li>
                <li>Reputational risk</li>
              </ul>

              <h4 className="font-bold mb-2">9.2 Termination for Convenience</h4>
              <p className="mb-4">Either Party may terminate this Agreement with written notice.</p>

              <h4 className="font-bold mb-2">9.3 Immediate Termination</h4>
              <p className="mb-2">DineDeal may terminate immediately in case of:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Fraud</li>
                <li>Illegal activity</li>
                <li>Material breach</li>
                <li>Regulatory risk</li>
              </ul>

              <h4 className="font-bold mb-2">9.4 Consequences of Termination</h4>
              <p className="mb-2">Upon termination:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Listings shall be removed</li>
                <li>Access to dashboard revoked</li>
                <li>Outstanding settlements adjusted</li>
                <li>Surviving obligations shall continue</li>
              </ul>
            </div>

            {/* 10. Governing Law */}
            <div>
              <h3 className="font-bold text-lg mb-3">10. GOVERNING LAW & JURISDICTION</h3>
              <p className="mb-2"><strong>10.1</strong> This Agreement shall be governed by the laws of India.</p>
              <p><strong>10.2</strong> Courts at Jhansi, Uttar Pradesh, shall have exclusive jurisdiction.</p>
            </div>

            {/* 11. Dispute Resolution */}
            <div>
              <h3 className="font-bold text-lg mb-3">11. DISPUTE RESOLUTION</h3>
              <p className="mb-2"><strong>11.1</strong> Parties shall attempt to resolve disputes amicably.</p>
              <p><strong>11.2</strong> Nothing herein prevents DineDeal from seeking injunctive or equitable relief.</p>
            </div>

            {/* 12. Force Majeure */}
            <div>
              <h3 className="font-bold text-lg mb-3">12. FORCE MAJEURE</h3>
              <p className="mb-2">Neither Party shall be liable for failure due to events beyond reasonable control, including:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Natural disasters</li>
                <li>Government actions</li>
                <li>Network failures</li>
                <li>Pandemics</li>
              </ul>
            </div>

            {/* 13. Assignment */}
            <div>
              <h3 className="font-bold text-lg mb-3">13. ASSIGNMENT</h3>
              <p className="mb-2">DineDeal may assign this Agreement without restriction.</p>
              <p>The Restaurant Partner may not assign without written consent.</p>
            </div>

            {/* 14. Amendments */}
            <div>
              <h3 className="font-bold text-lg mb-3">14. AMENDMENTS</h3>
              <p className="mb-2">DineDeal may amend these Terms by notice via dashboard or email.</p>
              <p>Continued use constitutes acceptance.</p>
            </div>

            {/* 15. Severability */}
            <div>
              <h3 className="font-bold text-lg mb-3">15. SEVERABILITY</h3>
              <p>If any provision is held invalid, remaining provisions shall remain enforceable.</p>
            </div>

            {/* 16. Entire Agreement */}
            <div>
              <h3 className="font-bold text-lg mb-3">16. ENTIRE AGREEMENT</h3>
              <p>Parts I, II, and III together constitute the entire agreement, superseding all prior arrangements.</p>
            </div>

            {/* 17. Survival */}
            <div>
              <h3 className="font-bold text-lg mb-3">17. SURVIVAL</h3>
              <p className="mb-2">Clauses relating to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Payments</li>
                <li>Liability</li>
                <li>Indemnity</li>
                <li>Confidentiality</li>
                <li>Governing law</li>
              </ul>
              <p>shall survive termination.</p>
            </div>

            {/* 18. Final Acceptance */}
            <div>
              <h3 className="font-bold text-lg mb-3">18. FINAL ACCEPTANCE</h3>
              <p className="mb-2">By registering on the DineDeal Platform, the Restaurant Partner confirms that it has:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Read</li>
                <li>Understood</li>
                <li>Agreed</li>
              </ul>
              <p>to be bound by this Agreement.</p>
            </div>

          </section>

        </div>
      </div>
    </div>
  );
};

export default RestaurantTermsCondition;
