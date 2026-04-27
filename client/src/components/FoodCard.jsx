import formatCurrency from "../utils/formatCurrency";
import formatCategoryLabel from "../utils/formatCategory";
import getFoodImage from "../utils/getFoodImage";

const FoodCard = ({ item, onAdd, onBuy, canOrder = true }) => (
  <article className="card showcase-card">
    <img
      src={getFoodImage(item)}
      alt={item.itemName}
      className="card-image"
    />
    <div className="card-body">
      <div className="space-between">
        <h3>{item.itemName}</h3>
        <span className="tag">{item.isVeg ? "Veg" : "Non-Veg"}</span>
      </div>
      <p>{item.description || "Tasty food item prepared fresh and delivered fast."}</p>
      <div className="meta-row">
        <span className="soft-pill">{formatCategoryLabel(item.category)}</span>
        <strong>{formatCurrency(item.price)}</strong>
      </div>
      {canOrder ? (
        <>
          <button className="button" onClick={() => onAdd(item._id)} disabled={!item.availability}>
            {item.availability ? "Add to Cart" : "Unavailable"}
          </button>
          {item.availability ? (
            <button className="button secondary" onClick={() => onBuy(item._id)}>
              Buy Now
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  </article>
);

export default FoodCard;
