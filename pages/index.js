import { useEffect, useState } from 'react';

export default function Home() {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    fetch('/api/booking?booking=QUAPWZ')
      .then(res => res.json())
      .then(data => setBooking(data))
      .catch(err => console.error(err));
  }, []);

  if (!booking) return <div>Loading...</div>;

  return (
    <div>
      <h1>Booking Info</h1>
      <p>Name: {booking.data.booking.main_contact}</p>
      <p>Phone: {booking.data.booking.phone}</p>
      <p>Total Price: {booking.data.booking.total_price} USD</p>
      <p>Tickets:</p>
      <ul>
        {booking.data.booking.tickets.map((t, i) => (
          <li key={i}>
            {t.passenger.name} - {t.passenger.surname} - {t.pnrs[0].source} → {t.pnrs[0].destination}
          </li>
        ))}
      </ul>
    </div>
  );
}
