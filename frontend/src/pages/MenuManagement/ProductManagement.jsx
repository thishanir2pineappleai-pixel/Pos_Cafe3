import { useCallback, useMemo, useState } from 'react';
import AddButton from '../../components/buttons/AddButton.jsx';
import ClearAllButton from '../../components/buttons/ClearAllButton.jsx';
import FilterButton from '../../components/buttons/FilterButton.jsx';
import { BoxIcon, CategoriesIcon, CheckCircleIcon, ChevronRightIcon, XCircleIcon } from '../../components/common/Icons.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import CategoryFilter from '../../components/filters/CategoryFilter.jsx';
import PriceRangeFilter from '../../components/filters/PriceRangeFilter.jsx';
import StatusFilter from '../../components/filters/StatusFilter.jsx';
import ConfirmationModal from '../../components/modals/ConfirmationModal.jsx';
import SuccessModal from '../../components/modals/SuccessModal.jsx';
import ProductTable from '../../components/OneTimeUsable/ProductTable.jsx';
import MainLayout from '../../layout/MainLayout.jsx';
import ProductDetails from './ProductDetails.jsx';
import ProductForm from './ProductForm.jsx';
import {
  INITIAL_CATEGORIES, INITIAL_DISCOUNTS, INITIAL_PRODUCTS, PAGE_SIZE, STATUS_OUT_OF_STOCK, getStockStatus,
} from './menuMockData.js';

const NO_FILTERS = { status: '', category: '', price: '' };

const HEADERS = {
  list: ['Menu Management', 'Manage your food, drinks, and inventory items easily.'],
  add: ['Add Menu Item', 'Fill in the details to add a new food or drink to your menu.'],
  edit: ['Edit Menu Item', 'Change the details to the food or drink to your menu.'],
  details: [
    <>Menu Management <ChevronRightIcon size={22} className="title-sep" /> View Product</>,
    'View the product details.',
  ],
};

function SummaryCard({ tone, Icon, label, value }) {
  return (
    <div className={`stat stat--${tone}`}>
      <span className="stat__icon"><Icon size={24} /></span>
      <div>
        <div className="stat__label">{label}</div>
        <div className="stat__value">{value}</div>
      </div>
    </div>
  );
}

export default function ProductManagement() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [discounts, setDiscounts] = useState(INITIAL_DISCOUNTS);
  const [screen, setScreen] = useState({ name: 'list' }); // list | add | edit | details
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [ingredientEdit, setIngredientEdit] = useState(null); // { ingredient, quantity }
  const [toast, setToast] = useState(null);

  const showToast = (title, message) => setToast({ id: Date.now(), title, message });
  const closeToast = useCallback(() => setToast(null), []);

  const current = products.find((p) => p.id === screen.id);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => getStockStatus(p) !== STATUS_OUT_OF_STOCK).length,
    out: products.filter((p) => getStockStatus(p) === STATUS_OUT_OF_STOCK).length,
    categories: new Set(products.map((p) => p.category)).size,
  }), [products]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = products.filter((p) => {
      const status = getStockStatus(p);
      if (filters.status && status !== filters.status) return false;
      if (filters.category && p.category !== filters.category) return false;
      return !term || [p.name, p.id, p.category, status].some((s) => s.toLowerCase().includes(term));
    });
    if (filters.price) rows.sort((a, b) => (filters.price === 'asc' ? a.sellingPrice - b.sellingPrice : b.sellingPrice - a.sellingPrice));
    return rows;
  }, [products, query, filters]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const updateQuery = (value) => { setQuery(value); setPage(1); };
  const updateFilter = (key) => (value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };
  const clearFilters = () => { setFilters(NO_FILTERS); setPage(1); };

  const toList = () => setScreen({ name: 'list' });
  const toDetails = (id) => setScreen({ name: 'details', id });

  const nextId = () => `#PRD${Math.max(110, ...products.map((p) => Number(p.id.slice(4)))) + 1}`;

  const saveNew = (data) => {
    setProducts((list) => [{ ...data, id: nextId(), image: data.image ?? INITIAL_PRODUCTS[0].image }, ...list]);
    setPage(1);
    toList();
    showToast('Product Added Successfully!', 'The product has been added and is now available in the shop.');
  };

  const saveEdit = (data) => {
    setProducts((list) => list.map((p) => (p.id === screen.id ? { ...p, ...data, image: data.image ?? p.image } : p)));
    toDetails(screen.id);
    showToast('Product Updated Successfully!', 'The product has been updated and is now available in the shop.');
  };

  const confirmDelete = () => {
    setProducts((list) => list.filter((p) => p.id !== deleting.id));
    setDeleting(null);
    showToast('Product Deleted Successfully', 'This item has been removed and cannot be restored.');
  };

  const confirmIngredient = () => {
    const { ingredient, quantity } = ingredientEdit;
    setProducts((list) => list.map((p) => (p.id === screen.id
      ? { ...p, ingredients: p.ingredients.map((i) => (i.id === ingredient.id ? { ...i, quantity: quantity.trim() || i.quantity } : i)) }
      : p)));
    setIngredientEdit(null);
    showToast('Product Ingredient Updated Successfully !', 'The ingredient details have been updated.');
  };

  const [title, subtitle] = HEADERS[screen.name];

  return (
    <MainLayout title={title} subtitle={subtitle} active="Menu Management">
      {screen.name === 'list' && (
        <>
          <section className="panel stats">
            <SummaryCard tone="green" Icon={BoxIcon} label="Total Items" value={stats.total} />
            <SummaryCard tone="green" Icon={CheckCircleIcon} label="Active Items" value={stats.active} />
            <SummaryCard tone="red" Icon={XCircleIcon} label="Out of Stock" value={stats.out} />
            <SummaryCard tone="purple" Icon={CategoriesIcon} label="Categories" value={stats.categories} />
          </section>

          <section className="panel products">
            <div className="toolbar">
              <SearchInput value={query} onChange={updateQuery} placeholder="Search product name, product id , category and status" />
              <FilterButton open={filterOpen} onClick={() => setFilterOpen(!filterOpen)} />
              <AddButton label="Add Product" onClick={() => setScreen({ name: 'add' })} />
            </div>

            {filterOpen && (
              <div className="filters">
                <StatusFilter value={filters.status} onChange={updateFilter('status')} />
                <CategoryFilter value={filters.category} categories={categories} onChange={updateFilter('category')} />
                <PriceRangeFilter value={filters.price} onChange={updateFilter('price')} />
                <ClearAllButton onClick={clearFilters} />
              </div>
            )}

            <ProductTable products={pageRows}
              onView={(p) => toDetails(p.id)}
              onEdit={(p) => setScreen({ name: 'edit', id: p.id })}
              onDelete={setDeleting} />
          </section>

          <Pagination page={safePage} pageSize={PAGE_SIZE} total={visible.length} onChange={setPage} />
        </>
      )}

      {screen.name === 'add' && (
        <ProductForm mode="add" categories={categories} discounts={discounts}
          onAddCategory={(name) => setCategories((c) => (c.includes(name) ? c : [...c, name]))}
          onAddDiscount={(d) => setDiscounts((list) => [...list, d])}
          onCancel={toList} onSave={saveNew} />
      )}

      {screen.name === 'edit' && current && (
        <ProductForm key={current.id} mode="edit" product={current} categories={categories} discounts={discounts}
          onAddCategory={(name) => setCategories((c) => (c.includes(name) ? c : [...c, name]))}
          onAddDiscount={(d) => setDiscounts((list) => [...list, d])}
          onCancel={() => toDetails(current.id)} onSave={saveEdit} />
      )}

      {screen.name === 'details' && current && (
        <ProductDetails product={current} discounts={discounts} onBack={toList}
          onEdit={() => setScreen({ name: 'edit', id: current.id })}
          onEditIngredient={(ingredient) => setIngredientEdit({ ingredient, quantity: '' })} />
      )}

      {deleting && (
        <ConfirmationModal message='Click "Delete" to remove this item.' confirmLabel="Delete"
          onCancel={() => setDeleting(null)} onConfirm={confirmDelete}>
          <div className="modal__product"><img src={deleting.image} alt="" />{deleting.name}</div>
        </ConfirmationModal>
      )}

      {ingredientEdit && (
        <ConfirmationModal message="Confirm to update the ingredient." confirmLabel="Update" className="modal--ingredient"
          onCancel={() => setIngredientEdit(null)} onConfirm={confirmIngredient}>
          <div className="modal__fields">
            <div className="field">
              <span className="field-label">Ingredient Name</span>
              <span className="modal__static">{ingredientEdit.ingredient.name}</span>
            </div>
            <label className="field">
              <span className="field-label">Quantity</span>
              <input className="input" autoFocus value={ingredientEdit.quantity} placeholder={ingredientEdit.ingredient.quantity}
                onChange={(e) => setIngredientEdit((s) => ({ ...s, quantity: e.target.value }))} />
            </label>
          </div>
        </ConfirmationModal>
      )}

      {toast && <SuccessModal key={toast.id} title={toast.title} message={toast.message} onClose={closeToast} />}
    </MainLayout>
  );
}
