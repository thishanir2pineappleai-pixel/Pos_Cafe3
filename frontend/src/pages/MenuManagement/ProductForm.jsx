import { useState } from 'react';
import AddButton from '../../components/buttons/AddButton.jsx';
import CancelButton from '../../components/buttons/CancelButton.jsx';
import RemoveButton from '../../components/buttons/RemoveButton.jsx';
import SaveButton from '../../components/buttons/SaveButton.jsx';
import { ChevronDownIcon, PlusIcon } from '../../components/common/Icons.jsx';
import IngredientAutocomplete from '../../components/common/IngredientAutocomplete.jsx';
import AddCategoryModal from '../../components/modals/AddCategoryModal.jsx';
import AddDiscountModal from '../../components/modals/AddDiscountModal.jsx';
import ConfirmationModal from '../../components/modals/ConfirmationModal.jsx';
import SelectCategoryModal from '../../components/modals/SelectCategoryModal.jsx';
import SelectDiscountModal from '../../components/modals/SelectDiscountModal.jsx';
import ImageUpload from '../../components/upload/ImageUpload.jsx';
import { parsePrice, validateProduct } from '../../validation/productValidation.js';
import { INGREDIENT_OPTIONS, formatPrice } from './menuMockData.js';

const BLANK = {
  name: '', category: '', costPrice: '', sellingPrice: '', quantity: '',
  discountType: '', lowStockAlert: '', image: null, ingredients: [],
};

const fromProduct = (p) => ({
  name: p.name, category: p.category, costPrice: formatPrice(p.costPrice), sellingPrice: formatPrice(p.sellingPrice),
  quantity: String(p.quantity), discountType: p.discountType, lowStockAlert: String(p.lowStockAlert),
  image: p.image, ingredients: p.ingredients,
});

// Add / Edit Menu Item form. mode: 'add' | 'edit'.
export default function ProductForm({
  mode, product, categories, discounts, onAddCategory, onAddDiscount, onCancel, onSave,
}) {
  const [values, setValues] = useState(product ? fromProduct(product) : BLANK);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState(null); // selCat | addCat | selDisc | addDisc | confirm
  const [ingName, setIngName] = useState('');
  const [ingQty, setIngQty] = useState('');

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  const input = (key, placeholder) => (
    <input className={`input${errors[key] ? ' has-error' : ''}`} value={values[key]} placeholder={placeholder}
      onChange={(e) => set(key, e.target.value)} />
  );

  const addIngredient = () => {
    const name = ingName.trim();
    const quantity = ingQty.trim();
    if (!name || !quantity) return;
    const known = INGREDIENT_OPTIONS.find((o) => o.name.toLowerCase() === name.toLowerCase());
    // ponytail: ingredients not in the mock list get an "#ING---" id until the backend assigns real ids.
    setValues((v) => ({ ...v, ingredients: [...v.ingredients, { id: known?.id ?? '#ING---', name: known?.name ?? name, quantity }] }));
    setIngName('');
    setIngQty('');
  };
  const removeIngredient = (index) =>
    setValues((v) => ({ ...v, ingredients: v.ingredients.filter((_, i) => i !== index) }));

  const requestSave = () => {
    const found = validateProduct(values);
    setErrors(found);
    if (Object.keys(found).length === 0) setModal('confirm');
  };

  const confirmSave = () => onSave({
    name: values.name.trim(),
    category: values.category,
    costPrice: parsePrice(values.costPrice),
    sellingPrice: parsePrice(values.sellingPrice),
    quantity: Number(values.quantity),
    lowStockAlert: values.lowStockAlert.trim() === '' ? 15 : Number(values.lowStockAlert),
    discountType: values.discountType,
    image: values.image,
    ingredients: values.ingredients,
  });

  const unusedOptions = INGREDIENT_OPTIONS.filter((o) => !values.ingredients.some((i) => i.id === o.id));
  const edit = mode === 'edit';

  return (
    <section className="panel form">
      <h2 className="form__title">Item Details</h2>

      <div className="form__grid">
        <label className="field">
          <span className="field-label">Item Name</span>
          {input('name', 'Enter the name of the item')}
        </label>
        <div className="field">
          <span className="field-label">Category</span>
          <div className="select-row">
            <button type="button" className={`input input-select${values.category ? '' : ' is-placeholder'}${errors.category ? ' has-error' : ''}`}
              onClick={() => setModal('selCat')}>
              <span>{values.category || 'Select a category'}</span>
              <ChevronDownIcon size={14} />
            </button>
            <button type="button" className="square-add" onClick={() => setModal('addCat')} aria-label="Add category"><PlusIcon size={18} /></button>
          </div>
        </div>
        <label className="field">
          <span className="field-label">Cost Price</span>
          {input('costPrice', 'Enter price (Rs)')}
        </label>

        <label className="field">
          <span className="field-label">Selling Price</span>
          {input('sellingPrice', 'Enter the selling price')}
        </label>
        <div className="field">
          <span className="field-label">Item Photo</span>
          <ImageUpload value={values.image} onChange={(url) => set('image', url)} />
        </div>
        <label className="field">
          <span className="field-label">Quantity</span>
          {input('quantity', 'Type your quantity')}
        </label>
      </div>

      <h3 className="form__section">Discount (Optional)</h3>
      <div className="form__grid">
        <div className="field">
          <span className="field-label">Discount Type</span>
          <div className="select-row">
            <button type="button" className={`input input-select${values.discountType ? '' : ' is-placeholder'}`} onClick={() => setModal('selDisc')}>
              <span>{values.discountType || 'Discount Type'}</span>
              <ChevronDownIcon size={14} />
            </button>
            <button type="button" className="square-add" onClick={() => setModal('addDisc')} aria-label="Add discount"><PlusIcon size={18} /></button>
          </div>
        </div>
        <label className="field">
          <span className="field-label">Low Stock Alert</span>
          {input('lowStockAlert', 'Enter Low Stock Alert')}
        </label>
      </div>

      <h3 className="form__section">Ingredients Details</h3>
      <div className="ingredient-row">
        <div className="field">
          <span className="field-label">Ingredient Name</span>
          <IngredientAutocomplete value={ingName} onChange={setIngName} options={unusedOptions} placeholder="Enter and Select Ingredient Name" />
        </div>
        <label className="field">
          <span className="field-label">Quantity</span>
          <input className="input" value={ingQty} placeholder="Quantity" onChange={(e) => setIngQty(e.target.value)} />
        </label>
        <AddButton label="Add Ingredient" onClick={addIngredient} />
      </div>
      {values.ingredients.map((ing, i) => (
        <div className="ingredient-row ingredient-row--added" key={`${ing.id}-${i}`}>
          <input className="input" value={ing.name} readOnly aria-label="Ingredient name" />
          <input className="input" value={ing.quantity} aria-label="Quantity"
            onChange={(e) => setValues((v) => ({
              ...v, ingredients: v.ingredients.map((x, idx) => (idx === i ? { ...x, quantity: e.target.value } : x)),
            }))} />
          <RemoveButton onClick={() => removeIngredient(i)} />
        </div>
      ))}

      <div className="form__actions">
        <CancelButton onClick={onCancel} />
        <SaveButton label="Save Item" onClick={requestSave} />
      </div>

      {modal === 'selCat' && (
        <SelectCategoryModal categories={categories} selected={values.category} onClose={() => setModal(null)}
          onSelect={(name) => { set('category', name); setModal(null); }} />
      )}
      {modal === 'addCat' && (
        <AddCategoryModal onClose={() => setModal(null)}
          onSave={(name) => { onAddCategory(name); set('category', name); setModal(null); }} />
      )}
      {modal === 'selDisc' && (
        <SelectDiscountModal discounts={discounts} selected={values.discountType} onClose={() => setModal(null)}
          onSelect={(name) => { set('discountType', name); setModal(null); }} />
      )}
      {modal === 'addDisc' && (
        <AddDiscountModal onClose={() => setModal(null)}
          onSave={(discount) => { onAddDiscount(discount); set('discountType', discount.name); setModal(null); }} />
      )}
      {modal === 'confirm' && (
        <ConfirmationModal
          message={edit ? 'Click "Save Changes" to update the product.' : 'Click "Save" to add the product.'}
          confirmLabel={edit ? 'Save Changes' : 'Save'}
          onCancel={() => setModal(null)} onConfirm={confirmSave} />
      )}
    </section>
  );
}
