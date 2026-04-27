import { Link } from "react-router-dom";
import formatCurrency from "../utils/formatCurrency";
import getFoodImage from "../utils/getFoodImage";

const CartItem = ({ item, onUpdate, onRemove }) => {
  const imageItem = {
    itemName: item.itemName,
    image: item.image
  };
  const restaurantId =
    typeof item.restaurantId === "object" ? item.restaurantId?._id : item.restaurantId;
  const restaurantName =
    typeof item.restaurantId === "object" ? item.restaurantId?.name : "Restaurant";
  const restaurantLocation =
    typeof item.restaurantId === "object"
      ? item.restaurantId?.location || item.restaurantId?.city || ""
      : "";

  return (
    <article className="cart-item cart-item-card">
      <div className="cart-item-main">
        <Link
          to={restaurantId ? `/restaurants/${restaurantId}` : "/restaurants"}
          className="cart-item-image-link"
        >
          <img
            src={getFoodImage(imageItem)}
            alt={item.itemName}
            className="cart-item-image"
          />
        </Link>
        <div className="cart-item-copy">
          <h3>{item.itemName}</h3>
          <p>{formatCurrency(item.price)} each</p>
          <p>
            From:{" "}
            <Link to={restaurantId ? `/restaurants/${restaurantId}` : "/restaurants"}>
              {restaurantName}
            </Link>
          </p>
          {restaurantLocation ? <p>Location: {restaurantLocation}</p> : null}
          <p>Quantity: {item.quantity}</p>
        </div>
      </div>
      <div className="cart-item-actions">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onUpdate(item.menuItem, Number(e.target.value))}
        />
        <strong>{formatCurrency(item.price * item.quantity)}</strong>
        <button className="button secondary" onClick={() => onRemove(item.menuItem)}>
          Remove
        </button>
      </div>
    </article>
  );
};

export default CartItem;
