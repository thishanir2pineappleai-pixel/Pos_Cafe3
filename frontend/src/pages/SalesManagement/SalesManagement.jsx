import { Fragment, useMemo, useState } from 'react';
import ManageDiscountButton from '../../components/buttons/ManageDiscountButton.jsx';
import { ChevronRightIcon } from '../../components/common/Icons.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import DateFilter from '../../components/filters/DateFilter.jsx';
import DateRangePicker from '../../components/filters/DateRangePicker.jsx';
import MainLayout from '../../layout/MainLayout.jsx';
import { toISO } from '../../api/formatDate.js';
import ManageDiscount from './ManageDiscount.jsx';
import SalesOrders from './SalesOrders.jsx';
import SalesSummary from './SalesSummary.jsx';
import { ORDERS, ORDERS_PAGE_SIZE, TODAY, summarize } from './salesMockData.js';

const TODAY_RANGE = { start: TODAY, end: TODAY };

const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;

function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SalesManagement() {
  const [screen, setScreen] = useState('dashboard'); // dashboard | discounts
  const [range, setRange] = useState(TODAY_RANGE);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const inRange = useMemo(() => {
    const from = toISO(range.start);
    const to = toISO(range.end ?? range.start);
    return ORDERS.filter((o) => o.date >= from && o.date <= to);
  }, [range]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return inRange;
    return inRange.filter((o) => [o.id, o.type, o.customer, o.items, o.status, o.time].some((s) => s.toLowerCase().includes(term)));
  }, [inRange, query]);

  const summary = useMemo(() => summarize(inRange), [inRange]);
  const totalPages = Math.max(1, Math.ceil(visible.length / ORDERS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = visible.slice((safePage - 1) * ORDERS_PAGE_SIZE, safePage * ORDERS_PAGE_SIZE);

  const applyRange = (next) => { setRange(next); setPicking(false); setPage(1); };
  const updateQuery = (value) => { setQuery(value); setPage(1); };

  // ponytail: .csv is real; .xls is tab-separated text that Excel opens; .pdf opens the browser print dialog
  // (the designs do not say what a PDF export should contain). Exports cover every filtered order, not just the page.
  const exportOrders = (format) => {
    if (format === 'pdf') { window.print(); return; }
    const head = ['Order ID', 'Order Type', 'Customer', 'Items', 'Total', 'Status', 'Time', 'Date'];
    const rows = visible.map((o) => [o.id, o.type, o.customer, o.items, o.total, o.status, o.time, o.date]);
    if (format === 'csv') download('sales-orders.csv', [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n'), 'text/csv');
    else download('sales-orders.xls', [head, ...rows].map((r) => r.join('\t')).join('\n'), 'application/vnd.ms-excel');
  };

  const discounts = screen === 'discounts';
  const title = discounts
    ? <>{['Sales Management', 'Manage Discount'].map((p, i) => <Fragment key={p}>{i > 0 && <ChevronRightIcon size={22} className="title-sep" />}{p}</Fragment>)}</>
    : 'Sales Management';
  const subtitle = discounts ? 'Create, manage, organize and apply discounts.' : 'Easily track, analyze, and export your sales data.';

  return (
    <MainLayout title={title} subtitle={subtitle} active="Sales Management">
      {!discounts && (
        <>
          <section className="panel sales-top">
            <div>
              <div className="sales-top__label">Select Date / Date Range</div>
              <DateFilter range={range} today={TODAY} onOpen={() => setPicking(true)} onReset={() => applyRange(TODAY_RANGE)} />
            </div>
            <ManageDiscountButton onClick={() => setScreen('discounts')} />
          </section>

          <SalesSummary summary={summary} />
          <SalesOrders orders={pageRows} query={query} onQuery={updateQuery} onExport={exportOrders} />
          <Pagination page={safePage} pageSize={ORDERS_PAGE_SIZE} total={visible.length} onChange={setPage} label="orders" />

          {picking && (
            <DateRangePicker start={range.start} end={range.end} today={TODAY} onApply={applyRange} onCancel={() => setPicking(false)} />
          )}
        </>
      )}
      {discounts && <ManageDiscount onBack={() => setScreen('dashboard')} />}
    </MainLayout>
  );
}
