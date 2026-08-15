async function main() {
  console.log("Sending test create-order request to Render backend using built-in fetch...");
  try {
    const res = await fetch("https://dinedeal-backend-076n.onrender.com/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 9,
        type: "restaurant",
        restaurantId: "5ce58c50-8969-4831-a846-114a9c56e6ae",
        userId: "61984ff0-11b6-4942-a00c-f3e091e438ca",
        metadata: {
          type: "table_reservation",
          partySize: 2,
          date: "2026-06-27",
          time: "07:00 PM"
        }
      })
    });

    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response text:", text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

main();
