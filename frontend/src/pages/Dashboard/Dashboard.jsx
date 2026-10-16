import MainLayout from '../../layout/MainLayout.jsx';
import OrderStatus from './OrderStatus.jsx';
import RecentOrders from './RecentOrders.jsx';
import SalesChart from './SalesChart.jsx';
import StatCardsdash from './StatCardsdash.jsx';
import StockSummary from './StockSummary.jsx';
import TopSellingItems from './TopSellingItems.jsx';
import {
  ORDER_STATUS, RECENT_ORDERS, SHIFT, STOCK_COUNTS, STOCK_ITEMS, SUMMARY, TOP_SELLING,
} from './dashboardMockData.js';

// Every number on this page comes from dashboardMockData.js (local demo data), not from a database.
function ShiftInfo() {
  return (
    <p className="shift">
      <span>Cashier: <strong>{SHIFT.cashier}</strong></span>
      <span>{SHIFT.open ? 'Login' : 'Logout'}: <strong>{SHIFT.time}</strong></span>
      <span>Shop: <strong className={SHIFT.open ? 'shift__open' : 'shift__closed'}>{SHIFT.open ? 'Open' : 'Closed'}</strong></span>
    </p>
  );
}

export default function Dashboard() {
  return (
    <MainLayout title="Dashboard" subtitle="Quick insights into your business performance." meta={<ShiftInfo />} active="Dashboard">
      <div className="dash">
        <StatCardsdash cards={SUMMARY} />
        <div className="dash-row">
          <SalesChart />
          <TopSellingItems items={TOP_SELLING} />
        </div>
        <OrderStatus statuses={ORDER_STATUS} />
        <div className="dash-row">
          <StockSummary counts={STOCK_COUNTS} items={STOCK_ITEMS} />
          <RecentOrders orders={RECENT_ORDERS} />
        </div>
      </div>
    </MainLayout>
  );
}
