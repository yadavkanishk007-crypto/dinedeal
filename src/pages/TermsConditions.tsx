import React from 'react';

const TermsCondition: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-sm border border-gray-200 overflow-hidden">
        
        {/* Document Header */}
        <div className="bg-gray-900 text-white p-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider mb-2">
            DINEDEAL – TERMS & CONDITIONS FOR CUSTOMERS
          </h1>
          <p className="text-gray-400 text-sm">
            Last Updated: [22/01/2026]
          </p>
        </div>

        {/* Content Container */}
        <div className="p-8 md:p-12 text-gray-800 text-sm md:text-base leading-relaxed space-y-8">

          {/* ================= PART I ================= */}
          <section className="space-y-6">
            <div className="border-b-2 border-gray-900 pb-2 mb-6">
              <h2 className="text-xl font-bold text-gray-900 uppercase">
                PART I: PLATFORM FOUNDATIONS, LEGAL STATUS, DEFINITIONS, AND RELATIONSHIP FRAMEWORK
              </h2>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 uppercase">PREAMBLE AND LEGAL NOTICE</h3>
              <p className="mb-3">
                These Terms and Conditions (“Terms”, “Agreement”) are a legally binding instrument 
                governing access to and use of the services made available by DineDeal, a technology
                enabled platform operating in accordance with the laws of India (“DineDeal”, “Company”, 
                “We”, “Us”, “Our”).
              </p>
              <p className="mb-3">
                This Agreement is executed electronically and does not require physical or digital signatures.
              </p>
              <p className="mb-3">
                By accessing, browsing, registering on, interacting with, or using the Platform in any manner 
                whatsoever, including but not limited to making reservations, viewing listings, or initiating 
                payments, you (“Customer”, “User”, “You”, “Your”) expressly agree to be bound by these 
                Terms.
              </p>
              <p className="font-semibold">
                If you do not agree with any part of these Terms, you must immediately cease using the 
                Platform. Continued use constitutes irrevocable acceptance.
              </p>
            </div>

            {/* 1. Definitions */}
            <div>
              <h3 className="font-bold text-lg mb-3">1. DEFINITIONS, INTERPRETATION, AND CONSTRUCTION</h3>
              
              <h4 className="font-bold mb-2">1.1 Definitions</h4>
              <p className="mb-2">For the purposes of this Agreement, unless the context otherwise requires:</p>
              <ol className="list-decimal list-outside pl-5 space-y-2">
                <li>
                  <strong>“Account”</strong> means a registered user account created on the Platform using a mobile number, email address, or any other permitted authentication mechanism.
                </li>
                <li>
                  <strong>“Advance Payment”</strong> means any monetary amount paid by a Customer in advance through the Platform in relation to a reservation, offer, or dining experience.
                </li>
                <li>
                  <strong>“Applicable Law”</strong> means all statutes, enactments, acts, ordinances, rules, regulations, notifications, circulars, guidelines, directions, and governmental orders applicable within the territory of India.
                </li>
                <li>
                  <strong>“Customer”</strong> means any natural person who accesses or uses the Platform for dining-related services.
                </li>
                <li>
                  <strong>“Platform”</strong> means the DineDeal mobile application, website, progressive web application (PWA), APIs, backend systems, and any related digital infrastructure.
                </li>
                <li>
                  <strong>“Reservation”</strong> means a booking request transmitted by the Platform to a restaurant.
                </li>
                <li>
                  <strong>“Restaurant”</strong> means any third-party dining establishment listed on the Platform.
                </li>
                <li>
                  <strong>“Services”</strong> means the technology-based facilitation services offered by DineDeal.
                </li>
                <li>
                  <strong>“Third Party”</strong> means any entity other than DineDeal and the Customer.
                </li>
              </ol>

              <h4 className="font-bold mt-4 mb-2">1.2 Rules of Interpretation</h4>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Headings and sub-headings are for reference only and do not affect interpretation.</li>
                <li>Words in the singular include the plural and vice versa.</li>
                <li>References to “including” shall mean “including without limitation”.</li>
                <li>Any reference to a statute includes amendments, re-enactments, and subordinate legislation.</li>
                <li>Ambiguities, if any, shall be interpreted in favour of maintaining DineDeal’s status as a neutral intermediary.</li>
              </ul>
            </div>

            {/* 2. Legal Nature */}
            <div>
              <h3 className="font-bold text-lg mb-3">2. LEGAL NATURE OF DINEDEAL</h3>
              
              <h4 className="font-bold mb-2">2.1 Technology Platform Only</h4>
              <p className="mb-2">
                DineDeal is strictly a technology intermediary that provides digital tools to enable 
                Customers to discover Restaurants, transmit reservation requests, view offers, and facilitate 
                payments.
              </p>
              <p className="mb-2">DineDeal does not:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Own, lease, operate, manage, or control any restaurant</li>
                <li>Prepare, serve, or handle food or beverages</li>
                <li>Employ restaurant staff</li>
                <li>Supervise restaurant operations</li>
                <li>Control restaurant policies, pricing, menus, seating, or service standards</li>
              </ul>
              <p>All dining experiences occur independently between the Customer and the Restaurant.</p>

              <h4 className="font-bold mt-4 mb-2">2.2 No Assumption of Restaurant Obligations</h4>
              <p className="mb-2">Under no circumstances shall DineDeal be deemed to have assumed:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Any duty of care owed by a Restaurant to a Customer</li>
                <li>Any contractual obligation arising between a Customer and a Restaurant</li>
                <li>Any liability for acts, omissions, negligence, or decisions of Restaurants</li>
              </ul>
            </div>

            {/* 3. Intermediary */}
            <div>
              <h3 className="font-bold text-lg mb-3">3. INTERMEDIARY SAFE-HARBOUR POSITION</h3>
              
              <h4 className="font-bold mb-2">3.1 Intermediary Role</h4>
              <p className="mb-2">
                DineDeal functions as an intermediary within the meaning of applicable Indian information 
                technology and electronic commerce laws.
              </p>
              <p className="mb-2">The Platform merely:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Hosts information</li>
                <li>Transmits requests</li>
                <li>Facilitates communication</li>
                <li>Enables digital payments</li>
              </ul>
              <p>DineDeal does not initiate, select, modify, or control the substantive terms of restaurant services.</p>

              <h4 className="font-bold mt-4 mb-2">3.2 No Editorial Control</h4>
              <p className="mb-2">DineDeal does not exercise editorial control over:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Restaurant listings</li>
                <li>Menu descriptions</li>
                <li>Pricing</li>
                <li>Availability</li>
                <li>Policies</li>
              </ul>
              <p>Responsibility for such content lies solely with Restaurants.</p>
            </div>

            {/* 4. Eligibility */}
            <div>
              <h3 className="font-bold text-lg mb-3">4. ELIGIBILITY AND LEGAL CAPACITY</h3>
              
              <h4 className="font-bold mb-2">4.1 Age Requirement</h4>
              <p className="mb-4">Use of the Platform is restricted to individuals who are 18 years of age or older.</p>

              <h4 className="font-bold mb-2">4.2 Capacity to Contract</h4>
              <p className="mb-2">By using the Platform, you represent that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>You are legally competent to contract</li>
                <li>You are not restricted under any law from using such services</li>
                <li>You are acting voluntarily and for lawful purposes</li>
              </ul>

              <h4 className="font-bold mb-2">4.3 Right to Deny Access</h4>
              <p className="mb-2">DineDeal reserves the absolute right to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Refuse service</li>
                <li>Suspend or terminate Accounts</li>
                <li>Restrict access to features</li>
              </ul>
              <p>without notice where eligibility requirements are not satisfied.</p>
            </div>

            {/* 5. Account Registration */}
            <div>
              <h3 className="font-bold text-lg mb-3">5. ACCOUNT REGISTRATION AND SECURITY</h3>
              
              <h4 className="font-bold mb-2">5.1 Registration Process</h4>
              <p className="mb-2">Customers may be required to create an Account using:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Mobile number and OTP</li>
                <li>Email verification</li>
                <li>Any other authentication mechanism permitted by DineDeal</li>
              </ul>

              <h4 className="font-bold mb-2">5.2 Accuracy of Information</h4>
              <p className="mb-2">You undertake that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>All information provided is true and complete</li>
                <li>You will promptly update changes</li>
                <li>You will not impersonate another person</li>
              </ul>
              <p className="mb-4">DineDeal bears no responsibility for consequences arising from false or outdated information.</p>

              <h4 className="font-bold mb-2">5.3 Account Security</h4>
              <p className="mb-2">You are solely responsible for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Maintaining confidentiality of login credentials</li>
                <li>All activities conducted through your Account</li>
              </ul>
              <p className="mb-2">DineDeal shall not be liable for losses caused by:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Unauthorized access</li>
                <li>Device compromise</li>
                <li>Credential leakage</li>
                <li>SIM swap fraud</li>
              </ul>
            </div>

            {/* 6. Scope */}
            <div>
              <h3 className="font-bold text-lg mb-3">6. SCOPE AND LIMITATIONS OF SERVICES</h3>
              
              <h4 className="font-bold mb-2">6.1 Best-Effort Availability</h4>
              <p className="mb-2">The Platform is provided on an “as-is” and “as-available” basis.</p>
              <p className="mb-2">DineDeal makes no guarantees regarding:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Continuous uptime</li>
                <li>Error-free operation</li>
                <li>Immediate issue resolution</li>
              </ul>

              <h4 className="font-bold mb-2">6.2 Technical Constraints</h4>
              <p className="mb-2">You acknowledge that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Downtime may occur</li>
                <li>Features may be modified or discontinued</li>
                <li>Services may be unavailable due to maintenance, upgrades, or force majeure events</li>
              </ul>
            </div>

            {/* 7. Listings Disclaimer */}
            <div>
              <h3 className="font-bold text-lg mb-3">7. RESTAURANT LISTINGS AND INFORMATION DISCLAIMER</h3>
              
              <h4 className="font-bold mb-2">7.1 Source of Information</h4>
              <p className="mb-2">All restaurant-related information displayed on the Platform is sourced from:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Restaurants themselves</li>
                <li>Publicly available sources</li>
                <li>Third-party content providers</li>
              </ul>

              <h4 className="font-bold mb-2">7.2 No Verification Guarantee</h4>
              <p className="mb-2">DineDeal does not independently verify:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Menus</li>
                <li>Prices</li>
                <li>Offers</li>
                <li>Seating availability</li>
                <li>Policies</li>
              </ul>
              <p className="mb-4">Accuracy is not guaranteed.</p>

              <h4 className="font-bold mb-2">7.3 Changes Without Notice</h4>
              <p>Restaurants may change information at any time without notice. DineDeal is not obligated to notify Customers of such changes.</p>
            </div>

            {/* 8. Reservations Legal Character */}
            <div>
              <h3 className="font-bold text-lg mb-3">8. RESERVATIONS – LEGAL CHARACTER AND LIMITATIONS</h3>
              
              <h4 className="font-bold mb-2">8.1 Reservation as a Request</h4>
              <p className="mb-2">A reservation made through the Platform:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Is only a request</li>
                <li>Does not create a legal right to entry</li>
                <li>Does not guarantee seating, service, or availability</li>
              </ul>

              <h4 className="font-bold mb-2">8.2 No Guarantee or Warranty</h4>
              <p className="mb-2">DineDeal does not warrant that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>A reservation will be honoured</li>
                <li>Entry will be granted</li>
                <li>Service will be provided</li>
              </ul>
            </div>

            {/* 9. Restaurant Discretion */}
            <div>
              <h3 className="font-bold text-lg mb-3">9. ABSOLUTE RESTAURANT DISCRETION (FOUNDATIONAL DOCTRINE)</h3>
              
              <h4 className="font-bold mb-2">9.1 Private Establishment Rights</h4>
              <p className="mb-2">Restaurants listed on the Platform are private establishments and retain absolute discretion over:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Admission</li>
                <li>Seating</li>
                <li>Service</li>
                <li>Refusal of service</li>
              </ul>

              <h4 className="font-bold mb-2">9.2 Entry Denial Despite Reservation</h4>
              <p className="mb-2">A restaurant may deny entry even if:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>A reservation is confirmed</li>
                <li>An advance payment has been made</li>
                <li>The Customer arrives on time</li>
              </ul>

              <h4 className="font-bold mb-2">9.3 Non-Exhaustive Reasons</h4>
              <p className="mb-2">Denial may occur due to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Internal policies</li>
                <li>Dress codes</li>
                <li>Capacity constraints</li>
                <li>Safety concerns</li>
                <li>Behavioural assessment</li>
                <li>Regulatory compliance</li>
                <li>Any other reason deemed appropriate by the Restaurant</li>
              </ul>

              <h4 className="font-bold mb-2">9.4 No Authority to Override</h4>
              <p className="mb-2">DineDeal has no authority to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Override restaurant decisions</li>
                <li>Compel entry</li>
                <li>Interfere in operational matters</li>
              </ul>
            </div>

            {/* 10. Acknowledgement */}
            <div>
              <h3 className="font-bold text-lg mb-3">10. CUSTOMER ACKNOWLEDGEMENT AND WAIVER</h3>
              <p className="mb-2">By using the Platform, you expressly acknowledge and agree that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Restaurants have final authority over entry</li>
                <li>DineDeal does not guarantee admission</li>
                <li>You waive any claim against DineDeal arising from entry denial</li>
              </ul>
            </div>

            {/* 11. Force Majeure */}
            <div>
              <h3 className="font-bold text-lg mb-3">11. FORCE MAJEURE</h3>
              <p className="mb-2">DineDeal shall not be liable for failure or delay caused by events beyond reasonable control, including but not limited to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Natural disasters</li>
                <li>Government actions</li>
                <li>Pandemics</li>
                <li>Network outages</li>
                <li>Power failures</li>
                <li>Acts of God</li>
              </ul>
            </div>

            {/* 12. Statutory Positioning */}
            <div>
              <h3 className="font-bold text-lg mb-3">12. STATUTORY AND REGULATORY POSITIONING</h3>
              <h4 className="font-bold mb-2">12.1 IT Act Compliance</h4>
              <p className="mb-4">DineDeal operates as an intermediary in accordance with applicable provisions of Indian information technology laws.</p>
              
              <h4 className="font-bold mb-2">12.2 Data Protection Alignment</h4>
              <p>Personal data processing is governed by DineDeal’s Privacy Policy and applicable data protection laws.</p>
            </div>

            {/* 13. Survival & Severability */}
            <div>
              <h3 className="font-bold text-lg mb-3">13. SURVIVAL AND SEVERABILITY</h3>
              
              <h4 className="font-bold mb-2">13.1 Survival</h4>
              <p className="mb-2">Clauses relating to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Disclaimers</li>
                <li>Limitation of liability</li>
                <li>Waivers</li>
                <li>Governing law</li>
              </ul>
              <p>shall survive termination of use.</p>

              <h4 className="font-bold mt-4 mb-2">13.2 Severability</h4>
              <p>If any provision is held invalid, the remaining provisions shall remain enforceable.</p>
            </div>

            {/* 14. Entire Part I */}
            <div>
              <h3 className="font-bold text-lg mb-3">14. ENTIRE PART I AGREEMENT</h3>
              <p className="mb-2">This Part I forms the foundational legal framework governing:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Platform nature</li>
                <li>Relationship boundaries</li>
                <li>Reservation character</li>
                <li>Restaurant discretion</li>
              </ul>
            </div>
          </section>

          {/* ================= PART II ================= */}
          <section className="space-y-6">
            <div className="border-b-2 border-gray-900 pb-2 mb-6 pt-10">
              <h2 className="text-xl font-bold text-gray-900 uppercase">
                PART II: RESERVATIONS, ENTRY DENIAL, PAYMENTS, REFUNDS, CANCELLATIONS & LIABILITY FRAMEWORK
              </h2>
              <p className="text-sm mt-1 text-gray-500">Last Updated: [22/01/2026]</p>
            </div>

            {/* 1. Purpose */}
            <div>
              <h3 className="font-bold text-lg mb-3">1. PURPOSE AND SCOPE OF PART II</h3>
              <p className="mb-2"><strong>1.1</strong> This Part II governs all matters relating to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Restaurant reservations made through the Platform</li>
                <li>The legal character and limitations of such reservations</li>
                <li>Entry denial by restaurants</li>
                <li>Advance payments, refunds, and reversals</li>
                <li>Cancellations, no-shows, and late arrivals</li>
                <li>Offers, discounts, and promotional conditions</li>
                <li>Payment processing, failures, and settlement delays</li>
                <li>Allocation and limitation of liability among parties</li>
              </ul>
              <p><strong>1.2</strong> This Part II must be read together with Part I. In case of inconsistency, the interpretation that most strongly preserves DineDeal’s intermediary and facilitative role shall prevail.</p>
            </div>

            {/* 2. Reservation Mechanics */}
            <div>
              <h3 className="font-bold text-lg mb-3">2. RESERVATION MECHANICS AND WORKFLOW</h3>
              
              <h4 className="font-bold mb-2">2.1 Reservation Initiation</h4>
              <p className="mb-2"><strong>2.1.1</strong> Customers may initiate a reservation by:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Selecting a restaurant</li>
                <li>Choosing date, time, and party size</li>
                <li>Submitting a reservation request through the Platform</li>
              </ul>
              <p className="mb-2"><strong>2.1.2</strong> Submission of a reservation request does not:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Create a binding contract with the restaurant</li>
                <li>Guarantee entry, seating, or service</li>
                <li>Create any obligation on DineDeal to ensure admission</li>
              </ul>

              <h4 className="font-bold mb-2">2.2 Reservation Confirmation</h4>
              <p className="mb-2"><strong>2.2.1</strong> A “confirmed” reservation indicates only that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>The request has been transmitted to the restaurant, and/or</li>
                <li>The restaurant has indicated provisional acceptance</li>
              </ul>
              <p className="mb-2"><strong>2.2.2</strong> A confirmation message, notification, SMS, or email:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Is informational in nature</li>
                <li>Does not override restaurant discretion</li>
                <li>Does not create an enforceable right to dine</li>
              </ul>

              <h4 className="font-bold mb-2">2.3 Time Slots and Party Size</h4>
              <p className="mb-2"><strong>2.3.1</strong> Restaurants may impose:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Grace periods</li>
                <li>Maximum party size limits</li>
                <li>Seating duration limits</li>
              </ul>
              <p><strong>2.3.2</strong> Arrival outside permitted time windows or deviation from party size may result in denial of entry or cancellation, at the restaurant’s discretion.</p>
            </div>

            {/* 3. Legal Status */}
            <div>
              <h3 className="font-bold text-lg mb-3">3. LEGAL STATUS OF RESERVATIONS</h3>
              
              <h4 className="font-bold mb-2">3.1 Reservation Is Not an Admission Right</h4>
              <p className="mb-2"><strong>3.1.1</strong> A reservation made through the Platform is legally characterized as:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>A request to dine, not a right of admission</li>
                <li>A facilitative service provided by DineDeal</li>
              </ul>
              <p className="mb-2"><strong>3.1.2</strong> No reservation shall be construed as:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>A license to enter private premises</li>
                <li>A guarantee of seating</li>
                <li>A promise of service</li>
              </ul>

              <h4 className="font-bold mb-2">3.2 Restaurant’s Superior Authority</h4>
              <p className="mb-2"><strong>3.2.1</strong> Restaurants retain absolute and unfettered authority over:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Entry</li>
                <li>Seating</li>
                <li>Service</li>
                <li>Refusal of service</li>
              </ul>
              <p className="mb-2"><strong>3.2.2</strong> This authority exists independently of:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Reservation status</li>
                <li>Advance payments</li>
                <li>Communications from DineDeal</li>
              </ul>
            </div>

            {/* 4. Entry Denial */}
            <div>
              <h3 className="font-bold text-lg mb-3">4. ENTRY DENIAL BY RESTAURANTS</h3>
              
              <h4 className="font-bold mb-2">4.1 General Principle</h4>
              <p className="mb-2"><strong>4.1.1</strong> You expressly acknowledge and agree that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Restaurants are private establishments</li>
                <li>Entry and service are subject solely to restaurant policies and discretion</li>
              </ul>
              <p className="mb-4"><strong>4.1.2</strong> DineDeal does not and cannot compel a restaurant to admit any Customer.</p>

              <h4 className="font-bold mb-2">4.2 Non-Exhaustive Grounds for Entry Denial</h4>
              <p className="mb-2">Restaurants may deny entry or service for reasons including, but not limited to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Capacity or overcrowding</li>
                <li>Operational constraints</li>
                <li>Safety or security concerns</li>
                <li>Dress code or conduct policies</li>
                <li>Intoxication or perceived impairment</li>
                <li>Mismatch in party size</li>
                <li>Late arrival beyond grace period</li>
                <li>Regulatory or licensing requirements</li>
                <li>Internal management decisions</li>
                <li>Private events or closures</li>
                <li>Any other reason deemed appropriate by the restaurant</li>
              </ul>

              <h4 className="font-bold mb-2">4.3 No Obligation to Provide Justification</h4>
              <p className="mb-2"><strong>4.3.1</strong> Restaurants are not obligated to provide:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Written reasons</li>
                <li>Evidence</li>
                <li>Detailed explanations</li>
              </ul>
              <p className="mb-4">for denial of entry, subject to Applicable Law.</p>

              <h4 className="font-bold mb-2">4.4 DineDeal’s Non-Involvement</h4>
              <p className="mb-2"><strong>4.4.1</strong> DineDeal:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Does not adjudicate entry disputes</li>
                <li>Does not investigate restaurant decisions</li>
                <li>Does not override restaurant authority</li>
              </ul>
              <p className="mb-2"><strong>4.4.2</strong> Any dispute relating to entry denial is strictly between:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>The Customer and the Restaurant</li>
              </ul>
              <p>except for refund processing as set out below.</p>
            </div>

            {/* 5. Advance Payments */}
            <div>
              <h3 className="font-bold text-lg mb-3">5. ADVANCE PAYMENTS – LEGAL CHARACTER</h3>
              
              <h4 className="font-bold mb-2">5.1 Nature of Advance Payments</h4>
              <p className="mb-2"><strong>5.1.1</strong> Certain reservations, offers, or dining experiences may require an advance payment.</p>
              <p className="mb-2"><strong>5.1.2</strong> Advance payments:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Are facilitated by DineDeal</li>
                <li>Are processed through third-party payment gateways</li>
                <li>May be collected on behalf of restaurants</li>
              </ul>
              <p className="mb-2"><strong>5.1.3</strong> DineDeal does not act as:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>A bank</li>
                <li>A wallet</li>
                <li>A financial institution</li>
              </ul>

              <h4 className="font-bold mb-2">5.2 Adjustment Against Final Bill</h4>
              <p className="mb-2"><strong>5.2.1</strong> Subject to restaurant policy, advance payments may be:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Adjusted against the final dining bill, or</li>
                <li>Treated as a booking amount</li>
              </ul>
              <p><strong>5.2.2</strong> Adjustment mechanics are determined solely by the restaurant.</p>
            </div>

            {/* 6. Refunds */}
            <div>
              <h3 className="font-bold text-lg mb-3">6. REFUNDS WHERE ENTRY IS DENIED</h3>
              
              <h4 className="font-bold mb-2">6.1 Guaranteed Refund Principle</h4>
              <p className="mb-2"><strong>6.1.1</strong> If a restaurant denies entry despite a valid reservation, then:</p>
              <p className="mb-2 pl-5 font-semibold">Any advance payment made through DineDeal shall be refunded.</p>
              <p className="mb-2"><strong>6.1.2</strong> Refunds shall be processed:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>To the original payment method</li>
                <li>In accordance with payment gateway and bank timelines</li>
              </ul>

              <h4 className="font-bold mb-2">6.2 Scope of Refund Obligation</h4>
              <p className="mb-2"><strong>6.2.1</strong> DineDeal’s refund obligation is strictly limited to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>The amount actually paid through the Platform</li>
              </ul>
              <p className="mb-2"><strong>6.2.2</strong> DineDeal shall not be liable for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Travel expenses</li>
                <li>Alternate arrangements</li>
                <li>Loss of opportunity</li>
                <li>Emotional distress</li>
                <li>Consequential or indirect damages</li>
              </ul>

              <h4 className="font-bold mb-2">6.3 Processing Timelines</h4>
              <p className="mb-2"><strong>6.3.1</strong> Refund initiation may take several working days.</p>
              <p className="mb-2"><strong>6.3.2</strong> Actual credit timelines depend on:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Bank processing</li>
                <li>Payment gateway policies</li>
              </ul>
              <p>DineDeal does not control such timelines.</p>
            </div>

            {/* 7. No Shows */}
            <div>
              <h3 className="font-bold text-lg mb-3">7. NO-SHOWS AND LATE ARRIVALS</h3>
              
              <h4 className="font-bold mb-2">7.1 Definition of No-Show</h4>
              <p className="mb-2">A “No-Show” occurs when:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>The Customer fails to arrive within the grace period, or</li>
                <li>The Customer does not attend at all</li>
              </ul>

              <h4 className="font-bold mb-2">7.2 Consequences of No-Show</h4>
              <p className="mb-2"><strong>7.2.1</strong> Restaurants may:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Cancel the reservation</li>
                <li>Forfeit advance payments</li>
                <li>Refuse future reservations</li>
              </ul>
              <p className="mb-4"><strong>7.2.2</strong> DineDeal shall not be responsible for such consequences.</p>

              <h4 className="font-bold mb-2">7.3 Late Arrival</h4>
              <p className="mb-2"><strong>7.3.1</strong> Late arrival may be treated as:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>A no-show</li>
                <li>A fresh request, subject to availability</li>
              </ul>
              <p>at the restaurant’s discretion.</p>
            </div>

            {/* 8. Cancellations */}
            <div>
              <h3 className="font-bold text-lg mb-3">8. CANCELLATIONS AND MODIFICATIONS</h3>
              
              <h4 className="font-bold mb-2">8.1 Customer-Initiated Cancellations</h4>
              <p className="mb-2"><strong>8.1.1</strong> Cancellation policies vary by restaurant and offer.</p>
              <p className="mb-2"><strong>8.1.2</strong> Applicable cancellation terms, including charges, shall be:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Displayed prior to booking</li>
                <li>Binding upon confirmation</li>
              </ul>

              <h4 className="font-bold mb-2">8.2 Restaurant-Initiated Cancellations</h4>
              <p className="mb-2"><strong>8.2.1</strong> Restaurants may cancel reservations due to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Operational issues</li>
                <li>Force majeure</li>
                <li>Capacity constraints</li>
              </ul>
              <p><strong>8.2.2</strong> In such cases, advance payments made through DineDeal shall be refunded.</p>
            </div>

            {/* 9. Offers */}
            <div>
              <h3 className="font-bold text-lg mb-3">9. OFFERS, DISCOUNTS, AND PROMOTIONS</h3>
              
              <h4 className="font-bold mb-2">9.1 Nature of Offers</h4>
              <p className="mb-2"><strong>9.1.1</strong> Offers are:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Created and controlled by restaurants</li>
                <li>Subject to specific terms and conditions</li>
              </ul>
              <p className="mb-2"><strong>9.1.2</strong> Offers may be limited by:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Time</li>
                <li>Day</li>
                <li>Menu items</li>
                <li>Minimum bill value</li>
              </ul>

              <h4 className="font-bold mb-2">9.2 Withdrawal or Modification</h4>
              <p className="mb-2">Restaurants may:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Modify</li>
                <li>Suspend</li>
                <li>Withdraw</li>
              </ul>
              <p className="mb-4">offers at any time, without liability to DineDeal.</p>

              <h4 className="font-bold mb-2">9.3 Offer Disputes</h4>
              <p className="mb-2">DineDeal does not guarantee:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Offer applicability</li>
                <li>Discount calculation accuracy</li>
              </ul>
              <p>Disputes regarding offers are primarily between the Customer and the Restaurant.</p>
            </div>

            {/* 10. Payments */}
            <div>
              <h3 className="font-bold text-lg mb-3">10. PAYMENTS AND PAYMENT FAILURES</h3>
              
              <h4 className="font-bold mb-2">10.1 Payment Processing</h4>
              <p className="mb-2"><strong>10.1.1</strong> Payments are processed through RBI-compliant third-party gateways.</p>
              <p className="mb-2"><strong>10.1.2</strong> DineDeal does not store:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Card numbers</li>
                <li>CVV</li>
                <li>UPI PINs</li>
              </ul>

              <h4 className="font-bold mb-2">10.2 Payment Failures</h4>
              <p className="mb-2">Payment failures may occur due to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Bank decline</li>
                <li>Network issues</li>
                <li>Gateway downtime</li>
              </ul>
              <p className="mb-4">DineDeal shall not be liable for such failures.</p>

              <h4 className="font-bold mb-2">10.3 Duplicate or Erroneous Payments</h4>
              <p className="mb-2">In case of duplicate payments:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Refunds shall be processed subject to verification</li>
                <li>Processing timelines may vary</li>
              </ul>
            </div>

            {/* 11. Liability */}
            <div>
              <h3 className="font-bold text-lg mb-3">11. LIMITATION OF LIABILITY (TRANSACTION-SPECIFIC)</h3>
              
              <h4 className="font-bold mb-2">11.1 No Liability for Restaurant Acts</h4>
              <p className="mb-2">DineDeal shall not be liable for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Entry denial</li>
                <li>Service quality</li>
                <li>Food quality</li>
                <li>Hygiene issues</li>
                <li>Restaurant conduct</li>
              </ul>

              <h4 className="font-bold mb-2">11.2 Liability Cap</h4>
              <p className="mb-2">To the maximum extent permitted by law, DineDeal’s total liability, if any, shall not exceed:</p>
              <p className="mb-4 pl-5">The amount actually paid by the Customer through the Platform for the relevant transaction.</p>

              <h4 className="font-bold mb-2">11.3 Exclusion of Indirect Damages</h4>
              <p className="mb-2">DineDeal shall not be liable for:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Indirect losses</li>
                <li>Consequential damages</li>
                <li>Loss of profits</li>
                <li>Loss of enjoyment</li>
              </ul>
            </div>

            {/* 12. Acknowledgement */}
            <div>
              <h3 className="font-bold text-lg mb-3">12. CUSTOMER ACKNOWLEDGEMENT AND CONSENT</h3>
              <p className="mb-2">By making a reservation or payment through the Platform, you expressly acknowledge and agree that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Reservations do not guarantee entry</li>
                <li>Restaurants have final authority</li>
                <li>Refunds are the sole remedy where entry is denied</li>
              </ul>
            </div>

            {/* 13. Survival */}
            <div>
              <h3 className="font-bold text-lg mb-3">13. SURVIVAL AND CONTINUITY</h3>
              <p className="mb-2">All provisions relating to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Refund limitations</li>
                <li>Liability caps</li>
                <li>Waivers</li>
              </ul>
              <p>shall survive completion or termination of the transaction.</p>
            </div>
          </section>

          {/* ================= PART III ================= */}
          <section className="space-y-6">
            <div className="border-b-2 border-gray-900 pb-2 mb-6 pt-10">
              <h2 className="text-xl font-bold text-gray-900 uppercase">
                PART III: CUSTOMER CONDUCT, ENFORCEMENT, PLATFORM GOVERNANCE, DISPUTE RESOLUTION & MISCELLANEOUS PROVISIONS
              </h2>
              <p className="text-sm mt-1 text-gray-500">Last Updated: [22/01/2026]</p>
            </div>

            {/* 1. Purpose */}
            <div>
              <h3 className="font-bold text-lg mb-3">1. PURPOSE AND ROLE OF PART III</h3>
              <p className="mb-2"><strong>1.1</strong> This Part III governs:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Customer conduct and behavioural obligations</li>
                <li>Restaurant authority over entry and service</li>
                <li>Platform misuse, abuse, and fraud prevention</li>
                <li>Enforcement, suspension, and termination powers</li>
                <li>Content, reviews, and intellectual property</li>
                <li>Data and privacy cross-references</li>
                <li>Grievance redressal mechanisms</li>
                <li>Governing law, jurisdiction, and dispute resolution</li>
                <li>Miscellaneous legal doctrines ensuring long-term enforceability</li>
              </ul>
              <p><strong>1.2</strong> This Part III must be read together with Part I and Part II. All three parts together constitute the complete and binding Terms & Conditions between you and DineDeal.</p>
            </div>

            {/* 2. Conduct Authority */}
            <div>
              <h3 className="font-bold text-lg mb-3">2. CUSTOMER CONDUCT – RESTAURANT-FIRST AUTHORITY FRAMEWORK</h3>
              
              <h4 className="font-bold mb-2">2.1 Fundamental Principle</h4>
              <p className="mb-2"><strong>2.1.1</strong> You expressly acknowledge and agree that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>All restaurants listed on the Platform are private establishments</li>
                <li>Entry, seating, service, and refusal of service are governed solely by the restaurant’s internal policies and discretion</li>
              </ul>
              <p className="mb-2"><strong>2.1.2</strong> DineDeal does not determine, influence, or interfere with:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Restaurant conduct rules</li>
                <li>Entry eligibility criteria</li>
                <li>Behavioural standards</li>
              </ul>

              <h4 className="font-bold mb-2">2.2 Absolute Restaurant Discretion</h4>
              <p className="mb-2"><strong>2.2.1</strong> Restaurants may, at their sole and absolute discretion, deny:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Entry</li>
                <li>Seating</li>
                <li>Continued service</li>
              </ul>
              <p className="mb-2">without any obligation to provide justification, subject to Applicable Law.</p>
              <p className="mb-2"><strong>2.2.2</strong> Such discretion applies irrespective of:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Reservation confirmation</li>
                <li>Advance payment</li>
                <li>Arrival time</li>
                <li>Customer expectations</li>
              </ul>

              <h4 className="font-bold mb-2">2.3 No Platform Override</h4>
              <p className="mb-2"><strong>2.3.1</strong> You agree that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>DineDeal has no authority to override restaurant decisions</li>
                <li>DineDeal will not compel a restaurant to admit or serve you</li>
              </ul>
              <p><strong>2.3.2</strong> Any attempt to hold DineDeal responsible for restaurant conduct shall be deemed a breach of these Terms.</p>
            </div>

            {/* 3. Behavioural Obligations */}
            <div>
              <h3 className="font-bold text-lg mb-3">3. CUSTOMER BEHAVIOURAL OBLIGATIONS</h3>
              
              <h4 className="font-bold mb-2">3.1 General Behaviour</h4>
              <p className="mb-2">You agree to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Behave lawfully, respectfully, and responsibly</li>
                <li>Follow restaurant rules, policies, and instructions</li>
                <li>Refrain from abusive, disruptive, or threatening behaviour</li>
              </ul>

              <h4 className="font-bold mb-2">3.2 Prohibited Conduct</h4>
              <p className="mb-2">You shall not:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Misbehave with restaurant staff or patrons</li>
                <li>Create disturbances</li>
                <li>Damage property</li>
                <li>Engage in harassment or discrimination</li>
                <li>Attend while intoxicated beyond acceptable limits</li>
                <li>Attempt to bypass restaurant policies using the Platform</li>
              </ul>
              <p>Restaurants may deny entry or service for any such conduct without liability to DineDeal.</p>
            </div>

            {/* 4. Platform Misuse */}
            <div>
              <h3 className="font-bold text-lg mb-3">4. PLATFORM MISUSE, ABUSE, AND FRAUD PREVENTION</h3>
              
              <h4 className="font-bold mb-2">4.1 Prohibited Platform Activities</h4>
              <p className="mb-2">You shall not:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Create multiple or fraudulent accounts</li>
                <li>Manipulate offers, discounts, or refunds</li>
                <li>Misrepresent identity or party size</li>
                <li>Abuse refund or cancellation policies</li>
                <li>Use bots, scripts, or automated tools</li>
              </ul>

              <h4 className="font-bold mb-2">4.2 Fraud Detection and Action</h4>
              <p className="mb-2"><strong>4.2.1</strong> DineDeal reserves the right to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Monitor usage patterns</li>
                <li>Investigate suspicious activity</li>
                <li>Flag, restrict, or suspend accounts</li>
              </ul>
              <p><strong>4.2.2</strong> DineDeal may take such action without prior notice where fraud or abuse is suspected.</p>
            </div>

            {/* 5. Suspension */}
            <div>
              <h3 className="font-bold text-lg mb-3">5. ACCOUNT SUSPENSION, TERMINATION & BLACKLISTING</h3>
              
              <h4 className="font-bold mb-2">5.1 Grounds for Suspension or Termination</h4>
              <p className="mb-2">DineDeal may suspend or permanently terminate your Account if:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>You violate these Terms</li>
                <li>Fraud or abuse is detected</li>
                <li>Restaurant complaints are received</li>
                <li>Legal or regulatory requirements mandate action</li>
              </ul>

              <h4 className="font-bold mb-2">5.2 Consequences of Termination</h4>
              <p className="mb-2">Upon suspension or termination:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Your access to the Platform may be revoked</li>
                <li>Pending reservations may be cancelled</li>
                <li>You may be restricted from future use</li>
              </ul>
              <p>Such actions shall not give rise to any claim against DineDeal.</p>
            </div>

            {/* 6. Reviews */}
            <div>
              <h3 className="font-bold text-lg mb-3">6. REVIEWS, RATINGS & USER-GENERATED CONTENT</h3>
              
              <h4 className="font-bold mb-2">6.1 Nature of Reviews</h4>
              <p className="mb-2"><strong>6.1.1</strong> Reviews and ratings are user-generated opinions.</p>
              <p className="mb-2"><strong>6.1.2</strong> DineDeal does not:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>Endorse reviews</li>
                <li>Guarantee accuracy</li>
                <li>Verify authenticity</li>
              </ul>

              <h4 className="font-bold mb-2">6.2 Content Moderation</h4>
              <p className="mb-2">DineDeal reserves the right to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Remove or edit content</li>
                <li>Block reviews</li>
                <li>Disable content</li>
              </ul>
              <p className="mb-4">that is defamatory, abusive, misleading, unlawful, or violative of Applicable Law.</p>

              <h4 className="font-bold mb-2">6.3 License to Use Content</h4>
              <p className="mb-2">By submitting content, you grant DineDeal a:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Non-exclusive</li>
                <li>Worldwide</li>
                <li>Royalty-free</li>
              </ul>
              <p>license to use, display, and distribute such content on the Platform.</p>
            </div>

            {/* 7. IP Rights */}
            <div>
              <h3 className="font-bold text-lg mb-3">7. INTELLECTUAL PROPERTY RIGHTS</h3>
              
              <h4 className="font-bold mb-2">7.1 Ownership</h4>
              <p className="mb-2">All intellectual property on the Platform, including:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Logos</li>
                <li>Trademarks</li>
                <li>Software</li>
                <li>UI/UX</li>
                <li>Content</li>
              </ul>
              <p className="mb-4">is owned by or licensed to DineDeal.</p>

              <h4 className="font-bold mb-2">7.2 Restrictions</h4>
              <p className="mb-2">You shall not:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Copy</li>
                <li>Modify</li>
                <li>Distribute</li>
                <li>Reverse engineer</li>
              </ul>
              <p>any part of the Platform without written permission.</p>
            </div>

            {/* 8. Data Usage */}
            <div>
              <h3 className="font-bold text-lg mb-3">8. DATA USAGE & PRIVACY CROSS-REFERENCE</h3>
              
              <h4 className="font-bold mb-2">8.1 Privacy Policy Incorporation</h4>
              <p className="mb-4">Your use of the Platform is subject to DineDeal’s Privacy Policy, which is incorporated herein by reference.</p>

              <h4 className="font-bold mb-2">8.2 Data Responsibility</h4>
              <p className="mb-2">DineDeal:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Processes data as a platform intermediary</li>
                <li>Does not sell personal data</li>
                <li>Implements reasonable security safeguards</li>
              </ul>
            </div>

            {/* 9. Grievance */}
            <div>
              <h3 className="font-bold text-lg mb-3">9. GRIEVANCE REDRESSAL MECHANISM</h3>
              
              <h4 className="font-bold mb-2">9.1 Contact Details</h4>
              <p className="mb-2">For complaints, queries, or grievances, you may contact:</p>
              <p className="mb-4 pl-5">Email: zaveltd@gmail.com</p>

              <h4 className="font-bold mb-2">9.2 Response Timeline</h4>
              <p className="mb-2">DineDeal shall endeavour to respond within:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-4">
                <li>48–72 working hours</li>
              </ul>

              <h4 className="font-bold mb-2">9.3 Scope of Redressal</h4>
              <p className="mb-2">DineDeal will address:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Platform-related issues</li>
                <li>Payment or refund facilitation</li>
              </ul>
              <p className="mb-2">DineDeal does not adjudicate:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Restaurant entry decisions</li>
                <li>Food quality disputes</li>
              </ul>
            </div>

            {/* 10. Disclaimer */}
            <div>
              <h3 className="font-bold text-lg mb-3">10. DISCLAIMER OF WARRANTIES</h3>
              <p className="mb-2"><strong>10.1</strong> The Platform is provided on an “as-is” and “as-available” basis.</p>
              <p className="mb-2"><strong>10.2</strong> DineDeal disclaims all warranties, including:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Fitness for a particular purpose</li>
                <li>Non-infringement</li>
                <li>Availability or reliability</li>
              </ul>
            </div>

            {/* 11. Limitation Liability */}
            <div>
              <h3 className="font-bold text-lg mb-3">11. LIMITATION OF LIABILITY (GLOBAL)</h3>
              <p className="mb-2"><strong>11.1</strong> To the maximum extent permitted by law:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>DineDeal shall not be liable for indirect, incidental, or consequential damages</li>
              </ul>
              <p><strong>11.2</strong> DineDeal’s total liability shall never exceed the amount paid by you through the Platform for the relevant transaction.</p>
            </div>

            {/* 12. Indemnification */}
            <div>
              <h3 className="font-bold text-lg mb-3">12. INDEMNIFICATION</h3>
              <p className="mb-2">You agree to indemnify and hold harmless DineDeal from any claims arising from:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>Your conduct</li>
                <li>Violation of these Terms</li>
                <li>Disputes with restaurants</li>
              </ul>
            </div>

            {/* 13. Governing Law */}
            <div>
              <h3 className="font-bold text-lg mb-3">13. GOVERNING LAW & JURISDICTION</h3>
              <p className="mb-2"><strong>13.1</strong> These Terms shall be governed by the laws of India.</p>
              <p><strong>13.2</strong> Courts of competent jurisdiction in India shall have exclusive jurisdiction.</p>
            </div>

            {/* 14. Dispute Resolution */}
            <div>
              <h3 className="font-bold text-lg mb-3">14. DISPUTE RESOLUTION</h3>
              <p className="mb-2"><strong>14.1</strong> Parties shall attempt to resolve disputes amicably.</p>
              <p><strong>14.2</strong> DineDeal may, at its discretion, introduce arbitration or alternate dispute resolution mechanisms in the future.</p>
            </div>

            {/* 15. Modifications */}
            <div>
              <h3 className="font-bold text-lg mb-3">15. MODIFICATIONS TO TERMS</h3>
              <p className="mb-2"><strong>15.1</strong> DineDeal may update these Terms at any time.</p>
              <p><strong>15.2</strong> Continued use of the Platform constitutes acceptance of updated Terms.</p>
            </div>

            {/* 16. Assignment */}
            <div>
              <h3 className="font-bold text-lg mb-3">16. ASSIGNMENT</h3>
              <p className="mb-2">DineDeal may assign its rights and obligations without restriction.</p>
              <p>You may not assign your rights without written consent.</p>
            </div>

            {/* 17. Severability */}
            <div>
              <h3 className="font-bold text-lg mb-3">17. SEVERABILITY</h3>
              <p>If any provision is held invalid, the remaining provisions shall remain enforceable.</p>
            </div>

            {/* 18. Entire Agreement */}
            <div>
              <h3 className="font-bold text-lg mb-3">18. ENTIRE AGREEMENT</h3>
              <p>Parts I, II, and III together constitute the entire agreement between you and DineDeal.</p>
            </div>

            {/* 19. Survival */}
            <div>
              <h3 className="font-bold text-lg mb-3">19. SURVIVAL</h3>
              <p className="mb-2">Provisions relating to:</p>
              <ul className="list-disc list-outside pl-5 space-y-1 mb-2">
                <li>Liability</li>
                <li>Indemnity</li>
                <li>Waivers</li>
                <li>Governing law</li>
              </ul>
              <p>shall survive termination of use.</p>
            </div>

            {/* 20. Final Acknowledgement */}
            <div>
              <h3 className="font-bold text-lg mb-3">20. FINAL ACKNOWLEDGEMENT</h3>
              <p className="mb-2">By using DineDeal, you acknowledge that:</p>
              <ul className="list-disc list-outside pl-5 space-y-1">
                <li>You have read all three parts</li>
                <li>You understand the restaurant-first authority model</li>
                <li>You accept refunds as the sole remedy where applicable</li>
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsCondition;
