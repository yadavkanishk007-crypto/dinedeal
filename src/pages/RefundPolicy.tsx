import React from 'react';

/**
 * Professional Legal Refund Policy Component
 * File Name: refundpolicy.tsx
 */

const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-16 px-6 sm:px-12">
      <div className="max-w-3xl mx-auto border border-gray-100 shadow-sm p-8 sm:p-16 bg-white">
        
        {/* Header Section */}
        <header className="mb-12 border-b border-gray-900 pb-6">
          <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900 uppercase">
            Refund & Cancellation Policy
          </h1>
          <div className="mt-4 flex justify-between items-center text-sm font-medium text-gray-500">
            <span>DineDeal Platform</span>
            <span>Effective Date: 05/02/2026</span>
          </div>
        </header>

        {/* Introduction */}
        <section className="mb-10 text-gray-700 leading-relaxed italic">
          <p>
            At DineDeal, we aim to provide a smooth and reliable table reservation experience. 
            This Refund & Cancellation Policy explains the terms applicable to reservations 
            made through the DineDeal platform.
          </p>
        </section>

        {/* Main Content */}
        <div className="space-y-10 text-gray-800">
          
          <section>
            <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 mb-4">
              1. Table Reservation Charges
            </h2>
            <p className="mb-3">
              Customers are required to pay a reservation fee of approximately <strong>₹299</strong> to successfully book or reserve a table through the DineDeal platform.
            </p>
            <p>
              The reservation fee helps secure confirmed seating availability at partner restaurants and reduces last-minute no-shows.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 mb-4">
              2. Cancellation Policy
            </h2>
            <p className="mb-4">
              Customers can cancel their reservation through the DineDeal application or website. Refund eligibility depends on the cancellation timing:
            </p>
            <ul className="list-none space-y-4 ml-2">
              <li className="flex flex-col">
                <span className="font-bold underline">Cancellation more than 12 hours before reservation time:</span>
                <span>Customers may be eligible for a full refund of the reservation fee.</span>
              </li>
              <li className="flex flex-col">
                <span className="font-bold underline">Cancellation within 12 hours of reservation time:</span>
                <span>The reservation fee will be non-refundable.</span>
              </li>
              <li className="flex flex-col">
                <span className="font-bold underline">No-Show (Failure to arrive at reserved time):</span>
                <span>The reservation fee will be non-refundable.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 mb-4">
              3. Refund Processing
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Eligible refunds will be processed to the original payment method used during booking.</li>
              <li>Refund processing typically takes 5–10 business days after approval, depending on payment providers.</li>
              <li>DineDeal is not responsible for delays caused by banks or payment gateways.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 mb-4">
              4. Restaurant-Initiated Cancellations
            </h2>
            <p className="mb-3">
              If a reservation is cancelled by the restaurant due to operational issues, overbooking, or unavoidable circumstances:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Customers will receive a full refund of the reservation fee.</li>
              <li>Refunds will be processed automatically to the original payment method.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 mb-4">
              5. Modification of Reservations
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Reservation changes (date, time, or guest count) are subject to restaurant availability.</li>
              <li>Modification requests may require cancellation and rebooking, and applicable charges may apply.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 mb-4">
              6. Non-Refundable Situations
            </h2>
            <p className="mb-3">Refunds will not be provided in the following cases:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Cancellation within 12 hours of reservation time.</li>
              <li>Customer does not arrive at the restaurant at the scheduled reservation time.</li>
              <li>Violation of restaurant or platform terms and conditions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 mb-4">
              7. Exceptional Circumstances
            </h2>
            <p>
              DineDeal may review refund requests in exceptional or genuine cases at its sole discretion. Customers may contact support for assistance, and each case will be evaluated individually.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 mb-4">
              8. Policy Updates
            </h2>
            <p>
              DineDeal reserves the right to modify or update this Refund & Cancellation Policy at any time. Customers are encouraged to review this policy periodically.
            </p>
          </section>

          <section className="pt-6">
            <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-200 mb-4">
              9. Contact & Support
            </h2>
            <p className="mb-4 font-serif">For refund or cancellation-related queries, customers may contact DineDeal support through:</p>
            <div className="bg-gray-50 p-4 border-l-4 border-gray-900">
              <p><strong>In-app Support</strong></p>
              <p><strong>Email:</strong> support@dinedeal.in</p>
            </div>
          </section>
        </div>

        {/* Footer Acceptance */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-600 italic">
          <p>By making a reservation through DineDeal, customers agree to this Refund & Cancellation Policy.</p>
        </footer>
      </div>
    </div>
  );
};

export default RefundPolicy;
