import { useCallback, useMemo, useState } from 'react';
import DeleteButton from '../../components/buttons/DeleteButton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { ArrowLeftIcon, ArrowRightIcon, EditIcon, TicketIcon } from '../../components/common/Icons.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import DateRangePicker from '../../components/filters/DateRangePicker.jsx';
import AddDiscountModal from '../../components/modals/AddDiscountModal.jsx';
import ConfirmationModal, { ModalHeader, ModalShell } from '../../components/modals/ConfirmationModal.jsx';
import SuccessModal from '../../components/modals/SuccessModal.jsx';
import { formatDots, fromISO, toISO } from '../../api/formatDate.js';
import { validateDiscountDraft, validateProductSelection } from '../../validation/discountValidation.js';
import DiscountSales from './DiscountSales.jsx';
import SelectProductsSales from './SelectProductsSales.jsx';
import {
  DISCOUNTS_PAGE_SIZE, INITIAL_DISCOUNTS, INITIAL_DISCOUNT_DEFS, PRODUCTS, TODAY, appliesLabel,
} from './salesMockData.js';

const COLUMNS = ['Discount Name', 'Type', 'Value', 'Applies To', 'Period', 'Status', 'Action'];
const COLS = '1.3fr 1fr .8fr 1.1fr 1.9fr .9fr .9fr';
const BLANK_DRAFT = { id: null, name: '', start: null, end: null, status: 'Active', original: null };

const ADDED = ['Discount Added successfully', 'The new discount has been added, you can apply to the products.'];
const UPDATED = ['Discount Updated successfully', 'The new discount has been added, you can apply to the products.'];

// ponytail: all discounts live in local state only (lost on reload); no API or database is connected.
export default function ManageDiscount({ onBack }) {
  const [discounts, setDiscounts] = useState(INITIAL_DISCOUNTS);
  const [defs, setDefs] = useState(INITIAL_DISCOUNT_DEFS);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  // flow: { kind: 'apply' | 'update', step: 'select' | 'status' | 'products' | 'confirm', draft, selection }
  const [flow, setFlow] = useState(null);
  const [errors, setErrors] = useState({});
  const [productError, setProductError] = useState('');
  const [pickingDates, setPickingDates] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = ([title, message]) => setToast({ id: Date.now(), title, message });
  const closeToast = useCallback(() => setToast(null), []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return discounts;
    return discounts.filter((d) => [d.name, 'Percentage', appliesLabel(d), d.status, `${d.value} %`].some((s) => s.toLowerCase().includes(term)));
  }, [discounts, query]);
  const totalPages = Math.max(1, Math.ceil(visible.length / DISCOUNTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = visible.slice((safePage - 1) * DISCOUNTS_PAGE_SIZE, safePage * DISCOUNTS_PAGE_SIZE);

  const patchDraft = (patch) => { setFlow((f) => ({ ...f, draft: { ...f.draft, ...patch } })); setErrors({}); };
  const setStep = (step) => setFlow((f) => ({ ...f, step }));
  const close = () => { setFlow(null); setErrors({}); setProductError(''); setPickingDates(false); setAdding(false); };

  const openApply = () => setFlow({ kind: 'apply', step: 'select', draft: BLANK_DRAFT, selection: { mode: null, productIds: [] } });
  const openUpdate = (d) => setFlow({
    kind: 'update',
    step: 'select',
    draft: { id: d.id, name: d.name, start: fromISO(d.start), end: fromISO(d.end), status: d.status, original: d.status },
    selection: { mode: d.productIds === null ? 'all' : 'selected', productIds: d.productIds ?? [] },
  });

  const rowFromDraft = (draft, productIds) => {
    const def = defs.find((x) => x.name === draft.name);
    return { id: draft.id ?? Math.max(0, ...discounts.map((d) => d.id)) + 1, name: def.name, value: def.value, productIds,
      start: toISO(draft.start), end: toISO(draft.end), status: draft.status };
  };

  const next = () => {
    const found = validateDiscountDraft(flow.draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    setStep(flow.kind === 'update' && flow.draft.status !== flow.draft.original ? 'status' : 'products');
  };

  // "Save" in the status dialog: store the new status/period but keep the existing products.
  const saveStatusOnly = () => {
    const { draft } = flow;
    setDiscounts((list) => list.map((d) => (d.id === draft.id ? rowFromDraft(draft, d.productIds) : d)));
    close();
    showToast(draft.status === 'Inactive'
      ? ['Discount inactivated successfully', 'This discount cannot be apply for new orders.']
      : ['Discount reactivated successfully', 'This discount can be apply for new orders.']);
  };

  const applyProducts = () => {
    const err = validateProductSelection(flow.selection);
    setProductError(err);
    if (!err) setStep('confirm');
  };

  const commit = () => {
    const { kind, draft, selection } = flow;
    const row = rowFromDraft(draft, selection.mode === 'all' ? null : selection.productIds);
    if (kind === 'apply') { setDiscounts((list) => [row, ...list]); setPage(1); } else setDiscounts((list) => list.map((d) => (d.id === row.id ? row : d)));
    close();
    showToast(kind === 'apply' ? ADDED : UPDATED);
  };

  const confirmDelete = () => {
    setDiscounts((list) => list.filter((d) => d.id !== deleting.id));
    setDeleting(null);
    showToast(['Discount deleted successfully', 'This discount has been removed and cannot be restored.']);
  };

  const becomingInactive = flow?.draft.status === 'Inactive';

  return (
    <>
      <section className="panel discounts">
        <div className="discounts__top">
          <button type="button" className="btn btn-outline" onClick={onBack}><ArrowLeftIcon size={16} />Back</button>
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search Discount" />
          <button type="button" className="btn btn-primary btn-apply" onClick={openApply}><TicketIcon size={18} />Apply Discount</button>
        </div>

        <div className="gtable" style={{ '--cols': COLS }}>
          <div className="gtable__inner">
            <div className="gtable__row gtable__head">{COLUMNS.map((c) => <span key={c}>{c}</span>)}</div>
            {rows.length === 0 && <EmptyState message="No discounts found" />}
            {rows.map((d) => (
              <div className="gtable__row" key={d.id}>
                <span className="b">{d.name}</span>
                <span>Percentage</span>
                <span>{d.value} %</span>
                <span>{appliesLabel(d)}</span>
                <span>{formatDots(fromISO(d.start))} - {formatDots(fromISO(d.end))}</span>
                <span><span className={`badge badge--${d.status.toLowerCase()}`}>{d.status}</span></span>
                <span className="ptable__actions">
                  <button type="button" className="icon-btn icon-btn--orange" onClick={() => openUpdate(d)} aria-label={`Edit ${d.name}`} title="Edit"><EditIcon size={15} /></button>
                  <DeleteButton onClick={() => setDeleting(d)} label={`Delete ${d.name}`} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Pagination page={safePage} pageSize={DISCOUNTS_PAGE_SIZE} total={visible.length} onChange={setPage} label="discounts" />

      {flow?.step === 'select' && (
        <DiscountSales mode={flow.kind} draft={flow.draft} defs={defs} errors={errors} onChange={patchDraft}
          onAddDiscount={() => setAdding(true)} onPickDates={() => setPickingDates(true)} onNext={next} onCancel={close} />
      )}

      {flow?.step === 'status' && (
        <ModalShell className="modal--status">
          <ModalHeader title={becomingInactive ? 'Confirm inactivate this discount.' : 'Confirm Reactivate this discount.'} onClose={close} />
          <p className="modal__desc">
            {becomingInactive
              ? 'This discount will be marked as Inactive and will no longer apply to new orders. You can reactivate it at any time.'
              : 'This discount will be marked as Active and will apply to new orders. You can deactivate it at any time.'}
          </p>
          <div className="modal__actions modal__actions--status">
            <button type="button" className="btn btn-outline-green btn-wide" onClick={saveStatusOnly}>Save</button>
            <button type="button" className="btn btn-primary btn-wide" onClick={() => setStep('products')}>Save &amp; Continue<ArrowRightIcon size={16} /></button>
          </div>
        </ModalShell>
      )}

      {flow?.step === 'products' && (
        <SelectProductsSales title={flow.kind === 'update' ? 'Update Product' : 'Select Product'} products={PRODUCTS}
          selection={flow.selection} error={productError}
          onChange={(selection) => { setFlow((f) => ({ ...f, selection })); setProductError(''); }}
          onApply={applyProducts} onCancel={close} />
      )}

      {flow?.step === 'confirm' && (
        <ConfirmationModal
          message={flow.kind === 'update' ? "Click 'Save Changes' to update discount details." : "Click 'Save' to apply discount."}
          confirmLabel={flow.kind === 'update' ? 'Save Changes' : 'Save'} onCancel={close} onConfirm={commit} />
      )}

      {pickingDates && (
        <DateRangePicker start={flow.draft.start} end={flow.draft.end} today={TODAY} onCancel={() => setPickingDates(false)}
          onApply={({ start, end }) => { patchDraft({ start, end }); setPickingDates(false); }} />
      )}

      {adding && (
        <AddDiscountModal onClose={() => setAdding(false)}
          onSave={({ name, percentage }) => {
            setDefs((list) => [...list.filter((d) => d.name !== name), { name, value: percentage }]);
            patchDraft({ name });
            setAdding(false);
          }} />
      )}

      {deleting && (
        <ConfirmationModal message='Click "Delete" to remove this discount.' confirmLabel="Delete" onCancel={() => setDeleting(null)} onConfirm={confirmDelete}>
          <div className="modal__line">{deleting.name} : {deleting.value} %</div>
        </ConfirmationModal>
      )}

      {toast && <SuccessModal key={toast.id} title={toast.title} message={toast.message} onClose={closeToast} />}
    </>
  );
}
