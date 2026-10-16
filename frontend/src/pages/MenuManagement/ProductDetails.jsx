import { StatusBadge } from '../../components/OneTimeUsable/ProductTable.jsx';
import { ArrowLeftIcon, EditIcon } from '../../components/common/Icons.jsx';
import { INITIAL_DISCOUNTS, formatPrice } from './menuMockData.js';

function Info({ label, note, children }) {
  return (
    <div className="info">
      <div className="info__label">{label}{note && <span> {note}</span>}</div>
      <div className="info__value">{children}</div>
    </div>
  );
}

// `discounts` is passed in because the user can add discounts in the form.
export default function ProductDetails({ product, discounts = INITIAL_DISCOUNTS, onBack, onEdit, onEditIngredient }) {
  const discount = discounts.find((d) => d.name === product.discountType);

  return (
    <section className="panel details">
      <div className="details__top">
        <button type="button" className="btn btn-outline" onClick={onBack}><ArrowLeftIcon size={16} />Back</button>
        <button type="button" className="btn btn-outline-green" onClick={onEdit}><EditIcon size={16} />Edit Product</button>
      </div>

      <div className="details__body">
        <div className="details__main">
          <div className="details__title">
            <h2>{product.name}</h2>
            <StatusBadge product={product} />
          </div>
          <div className="details__id">{product.id}</div>

          <div className="details__grid">
            <Info label="Category">{product.category}</Info>
            <Info label="Quantity">{product.quantity}</Info>
            <Info label="Cost Price">{formatPrice(product.costPrice)}</Info>
            <Info label="Selling Price">{formatPrice(product.sellingPrice)}</Info>
            <Info label="Discount Type">{product.discountType || '-'}</Info>
            <Info label="Discount Percentage">{discount ? `${discount.percentage}%` : '-'}</Info>
            <Info label="Low Stock Alert" note="(When Quantity goes below)">{product.lowStockAlert}</Info>
          </div>
        </div>
        <div className="details__photo"><img src={product.image} alt={product.name} /></div>
      </div>

      <h3 className="details__section">Ingredients Information</h3>
      <div className="itable">
        <div className="itable__row itable__head">
          <span>Ingredient ID</span><span>Ingredient Name</span><span>Quantity</span><span>Action</span>
        </div>
        {product.ingredients.map((ing) => (
          <div className="itable__row" key={ing.id}>
            <span>{ing.id}</span>
            <span>{ing.name}</span>
            <span>{ing.quantity}</span>
            <span>
              <button type="button" className="icon-btn icon-btn--orange icon-btn--sm" onClick={() => onEditIngredient(ing)}
                aria-label={`Edit ${ing.name}`} title="Edit">
                <EditIcon size={12} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
