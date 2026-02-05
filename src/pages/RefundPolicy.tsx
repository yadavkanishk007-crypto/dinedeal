import React from 'react';

/**
 * Refund & Cancellation Policy Component for DineDeal
 * File Name: refundpolicy.tsx
 */

const RefundPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-gray-800 leading-relaxed">
      <header className="border-b pb-8 mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">DineDeal Refund & Cancellation Policy</h1>
        <p className="text-sm text-gray-600 italic">Effective Date: [05/02/2026]dd/mm/yyyy</p>
      </header>

      <section className="mb-8">
        <p className="text-lg">
          At DineDeal, we aim to provide a smooth and reliable table reservation experience. 
          This Refund & Cancellation Policy explains the terms applicable to reservations 
          made through the DineDeal platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-orange-500 pl-4">1. Table Reservation Charges</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Customers are required to pay a reservation fee of approximately <strong>₹299</strong> to successfully book or reserve a table through the DineDeal platform.</li>
          <li>The reservation fee helps secure confirmed seating availability at partner restaurants and reduces last-minute no-shows.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-orange-500 pl-4">2. Cancellation Policy</h2>
        <p className="mb-4">Customers can cancel their reservation through the DineDeal application or website. Refund eligibility depends on the cancellation timing:</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 border-b text-left font-semibold">Cancellation Window</th>
                <th className="px-6 py-3 border-b text-left font-semibold">Refund Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-4 border-b">More than 12 hours before reservation time</td>
                <td className="px-6 py-4 border-b text-green-600 font-medium">Full Refund Eligible</td>
              </tr>
              <tr>
                <td className="px-6 py-4 border-b">Within 12 hours of reservation time</td>
                <td className="px-6 py-4 border-b text-red-600 font-medium">Non-refundable</td>
              </tr>
              <tr>
                <td className="px-6 py-4 border-b">No-Show (Failure to arrive)</td>
                <td className="px-6 py-4 border-b text-red-600 font-medium">Non-refundable</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-orange-500 pl-4">3. Refund Processing</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Eligible refunds will be processed to the original payment method used during booking.</li>
          <li>Refund processing typically takes <strong>5–10 business days</strong> after approval, depending on payment providers.</li>
          <li>DineDeal is not responsible for delays caused by banks or payment gateways.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-orange-500 pl-4">4. Restaurant-Initiated Cancellations</h2>
        <p className="mb-2 italic font-medium">If a reservation is cancelled by the restaurant due to operational issues, overbooking, or unavoidable circumstances:</p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Customers will receive a full refund of the reservation fee.</li>
          <li>Refunds will be processed automatically to the original payment method.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-orange-500 pl-4">5. Modification of Reservations</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Reservation changes (date, time, or guest count) are subject to restaurant availability.</li>
          <li>Modification requests may require cancellation and rebooking, and applicable charges may apply.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-orange-500 pl-4">6. Non-Refundable Situations</h2>
        <p className="mb-2">Refunds will not be provided in the following cases:</p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Cancellation within 12 hours of reservation time.</li>
          <li>Customer does not arrive at the restaurant at the scheduled reservation time.</li>
          <li>Violation of restaurant or platform terms and conditions.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-orange-500 pl-4">7. Exceptional Circumstances</h2>
        <p>DineDeal may review refund requests in exceptional or genuine cases at its sole discretion. Customers may contact support for assistance, and each case will be evaluated individually.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-l-4 border-orange-500 pl-4">8. Policy Updates</h2>
        <p>DineDeal reserves the right to modify or update this Refund & Cancellation Policy at any time. Customers are encouraged to review this policy periodically.</p>
      </section>

      <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4">9. Contact & Support</h2>
        <p className="mb-4">For refund or cancellation-related queries, customers may contact DineDeal support through:</p>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="font-semibold mr-2">In-app Support:</span> Use the Help section in the DineDeal app.
          </li>
          <li className="flex items-center">
            <span className="font-semibold mr-2">Email:</span> 
            <a href="mailto:support@dinedeal.in" className="text-orange-600 hover:underline">support@dinedeal.in</a>
          </li>
        </ul>
      </section>

      <footer className="mt-12 pt-8 border-t text-center text-gray-500 text-sm">
        <p>By making a reservation through DineDeal, customers agree to this Refund & Cancellation Policy.</p>
      </footer>
    </div>
  );
};

export default RefundPolicy;
