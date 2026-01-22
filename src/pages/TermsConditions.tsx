import React from 'react';

const TermsAndConditions = () => {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 text-sm leading-relaxed font-sans text-gray-800">
      
      {/* Header */}
      <div className="mb-10 border-b pb-6">
        <h1 className="text-3xl font-bold mb-2">DineDeal – Terms & Conditions</h1>
        [cite_start]<p className="text-gray-500">Last Updated: 22/01/2026 [cite: 113]</p>
        <p className="mt-4 text-gray-600">
          These Terms and Conditions constitute a legally binding agreement between you ("Customer", "User") 
          and DineDeal. By accessing or using the Platform, you expressly agree to be bound by these Terms. 
          [cite_start]If you do not agree, please cease using the Platform immediately [cite: 115-118].
        </p>
      </div>

      {/* PART I */}
      <section className="mb-12">
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900">PART I: Platform Foundations & Legal Status</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2">1. Legal Nature of DineDeal</h3>
            <p className="mb-2">
              DineDeal is strictly a <strong>technology intermediary</strong>. We provide digital tools to enable customers 
              to discover restaurants and facilitate payments. We do not:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              [cite_start]<li>Own, operate, or manage any restaurant [cite: 143]</li>
              [cite_start]<li>Prepare or serve food [cite: 144]</li>
              [cite_start]<li>Control restaurant policies, pricing, or service standards [cite: 147]</li>
            </ul>
            <p className="mt-2 italic">
              [cite_start]All dining experiences occur independently between the Customer and the Restaurant[cite: 148].
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">2. Eligibility</h3>
            <p>
              [cite_start]Use of the Platform is restricted to individuals who are <strong>18 years of age or older</strong>[cite: 172]. 
              [cite_start]By using the Platform, you represent that you are legally competent to contract[cite: 175].
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">3. Account Security</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              [cite_start]<li>You are responsible for maintaining the confidentiality of your login credentials[cite: 198].</li>
              [cite_start]<li>You are responsible for all activities conducted through your Account[cite: 199].</li>
              [cite_start]<li>DineDeal is not liable for unauthorized access or device compromise [cite: 200-202].</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">4. Information Disclaimer</h3>
            <p>
              Restaurant menus, prices, and policies are sourced from restaurants or public sources. 
              [cite_start]DineDeal does not guarantee the accuracy of this information, and it may change without notice [cite: 217-226].
            </p>
          </div>
        </div>
      </section>

      {/* PART II */}
      <section className="mb-12">
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900">PART II: Reservations, Payments & Refunds</h2>
        </div>

        <div className="space-y-8">
          {/* Critical Warning Block */}
          <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 rounded-r">
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Important: Restaurant Discretion</h3>
            <p className="mb-2 font-medium">
              [cite_start]A reservation is a request, not a guaranteed right of admission[cite: 327].
            </p>
            <p className="text-gray-700 mb-2">
              [cite_start]Restaurants listed on the Platform are private establishments and retain <strong>absolute discretion</strong> over entry, seating, and service[cite: 240]. [cite_start]A restaurant may deny entry even if you have a confirmed reservation or have made an advance payment[cite: 246].
            </p>
            <p className="text-gray-700">
              [cite_start]Common reasons for denial include: Dress codes, capacity constraints, stags/party size mismatch, safety concerns, or late arrival [cite: 250-255].
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">5. Advance Payments & Refunds</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 underline">The Guaranteed Refund Principle</h4>
                <p className="mb-2">
                  [cite_start]If a restaurant denies entry despite a valid reservation, <strong>any advance payment made through DineDeal shall be refunded</strong> [cite: 390-391].
                </p>
                <p className="text-gray-600 text-xs">
                  Refunds are processed to the original payment method. [cite_start]Timelines depend on bank processing [cite: 394-407].
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 underline">Liability Limits</h4>
                <p className="mb-2">
                  [cite_start]DineDeal's liability is strictly limited to the amount actually paid through the Platform[cite: 398].
                </p>
                <p className="text-gray-600 text-xs">
                  [cite_start]We are not liable for travel expenses, emotional distress, or loss of opportunity [cite: 400-403].
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">6. No-Shows & Cancellations</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>
                [cite_start]<strong>No-Show:</strong> If you fail to arrive within the grace period, the restaurant may cancel the reservation and forfeit advance payments [cite: 416-418].
              </li>
              <li>
                <strong>Cancellations:</strong> Applicable cancellation charges will be displayed prior to booking. [cite_start]If a restaurant cancels due to operational issues, you will be refunded [cite: 430-436].
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">7. Payment Processing</h3>
            <p>
              Payments are processed via RBI-compliant third-party gateways. [cite_start]DineDeal does not store sensitive card details, CVV, or UPI PINs [cite: 460-464].
            </p>
          </div>
        </div>
      </section>

      {/* PART III */}
      <section className="mb-12">
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900">PART III: Conduct & Governance</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2">8. Customer Conduct</h3>
            <p className="mb-2">You agree to behave lawfully and respectfully. You shall not:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              [cite_start]<li>Misbehave with staff or patrons [cite: 543]</li>
              [cite_start]<li>Create disturbances or damage property [cite: 544-545]</li>
              [cite_start]<li>Engage in harassment or discrimination [cite: 546]</li>
              [cite_start]<li>Attempt to bypass restaurant policies [cite: 548]</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">9. Platform Misuse</h3>
            <p>
              [cite_start]DineDeal reserves the right to suspend or terminate accounts for fraud, abuse of offers, creating multiple accounts, or using automated bots[cite: 553, 560].
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">10. User Reviews</h3>
            <p>
              Reviews are user-generated opinions. DineDeal does not endorse them. [cite_start]We reserve the right to remove content that is abusive, defamatory, or misleading [cite: 571-580].
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">11. Grievance Redressal</h3>
            <div className="bg-gray-50 border p-4 rounded-md">
              <p className="mb-2">For complaints or grievances, please contact our Grievance Officer:</p>
              [cite_start]<p className="font-semibold">Email: zaveltd@gmail.com [cite: 613]</p>
              [cite_start]<p className="text-gray-600 mt-1">Response Timeline: Within 48-72 working hours [cite: 616]</p>
              <p className="text-xs mt-2 text-gray-500">
                Note: DineDeal addresses platform issues and refund facilitation. [cite_start]We do not adjudicate food quality disputes or restaurant entry decisions[cite: 621].
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">12. Governing Law</h3>
            <p>
              These Terms shall be governed by the laws of India. [cite_start]Courts of competent jurisdiction in India shall have exclusive jurisdiction [cite: 639-640].
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t pt-8 text-center text-gray-500">
        <p className="mb-2">
          By using DineDeal, you acknowledge that you have read all three parts of these Terms, 
          [cite_start]understand the restaurant-first authority model, and accept refunds as the sole remedy where applicable [cite: 661-663].
        </p>
      </footer>

    </main>
  );
};

export default TermsAndConditions;
