export async function startRazorpayPayment(amount: number) {
  // 1️⃣ Call backend to create order
  const res = await fetch(
    "https://dinedeal-backend-53ub5174f-kanishks-projects-9c34ac85.vercel.app",
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

// ---------------------------------------------------------
//  Added Utilities (Preserved from the second snippet)
// ---------------------------------------------------------

// Load Razorpay SDK dynamically
export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface RazorpayOptions {
  amount: number;
  restaurantName: string;
  userEmail: string;
  userPhone: string;
  onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id?: string }) => void;
  onError: (error: any) => void;
}

export function createRazorpayOptions(options: RazorpayOptions) {
  return {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: Math.round(options.amount * 100), // Convert to paise
    currency: "INR",
    name: "DineDeal",
    description: `Payment to ${options.restaurantName}`,
    prefill: {
      email: options.userEmail,
      contact: options.userPhone,
    },
    handler: options.onSuccess,
    modal: {
      ondismiss: () => {
        console.log("Payment modal dismissed");
      },
    },
    theme: {
      color: "#000000",
    },
  };
}
