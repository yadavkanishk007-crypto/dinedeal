export async function startRazorpayPayment(amount: number) {
  // 1️⃣ Call backend to create order
  const res = await fetch(
    "https://dinedeal-backend-076n.onrender.com/api/payments/create-order",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount })
    }
  );

  const data = await res.json();

  if (!data.success) {
    alert("Unable to initiate payment");
    return;
  }

  const { order } = data;

  // 2️⃣ Configure Razorpay Checkout
  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID, // PUBLIC KEY ONLY
    amount: order.amount,
    currency: order.currency,
    name: "DineDeal",
    description: "Dining payment",
    order_id: order.id,
    handler: function (response: any) {
      console.log("Payment Success:", response);
      alert("Payment successful!");
      // later: send response to backend for verification
    },
    theme: {
      color: "#000000"
    }
  };

  // 3️⃣ Open checkout
  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
