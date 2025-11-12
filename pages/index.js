<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Info</title>
</head>
<body>
  <h1>Booking Info</h1>
  <div id="booking">Loading...</div>

  <script>
    async function getBooking() {
      try {
        const res = await fetch('/api/booking?booking=QUAPWZ');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();

        const booking = data.data.booking;
        const container = document.getElementById('booking');

        container.innerHTML = `
          <p>Name: ${booking.main_contact}</p>
          <p>Phone: ${booking.phone}</p>
          <p>Total Price: ${booking.total_price} USD</p>
          <p>Tickets:</p>
          <ul>
            ${booking.tickets.map(t => `<li>${t.passenger.name} ${t.passenger.surname} - ${t.pnrs[0].source} → ${t.pnrs[0].destination}</li>`).join('')}
          </ul>
        `;
      } catch (err) {
        document.getElementById('booking').innerText = 'Error: ' + err.message;
      }
    }

    getBooking();
  </script>
</body>
</html>
