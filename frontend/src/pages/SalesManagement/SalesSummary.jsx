import { formatLKR } from '../../api/formatCurrency.js';

// Four summary cards computed from the orders in the selected date range.
export default function SalesSummary({ summary }) {
  const cards = [
    ['Total Revenue', formatLKR(summary.revenue)],
    ['Total Order', summary.orders],
    ['New Customers', summary.newCustomers],
    ['Peak Hour', summary.peakHour],
  ];
  return (
    <section className="panel sales-stats">
      {cards.map(([label, value]) => (
        <div className="sales-stat" key={label}>
          <div className="sales-stat__label">{label}</div>
          <div className="sales-stat__value">{value}</div>
        </div>
      ))}
    </section>
  );
}
