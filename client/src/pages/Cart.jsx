import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CartItem from "../components/CartItem";
import { changeCartItem, deleteCartItem, loadCart } from "../redux/cartSlice";
import calculateTotal from "../utils/calculateTotal";
import formatCurrency from "../utils/formatCurrency";

const Cart = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(loadCart());
  }, [dispatch]);

  return (
    <section>
      <h2>Your Cart</h2>
      {items.length === 0 ? (
        <p>Your cart is empty. Browse restaurants and add items to continue.</p>
      ) : (
        <>
          {items.map((item) => (
            <CartItem
              key={item.menuItem}
              item={item}
              onUpdate={(itemId, quantity) => dispatch(changeCartItem({ itemId, payload: { quantity } }))}
              onRemove={(itemId) => dispatch(deleteCartItem(itemId))}
            />
          ))}
          <div className="summary-box">
            <h3>Subtotal: {formatCurrency(calculateTotal(items))}</h3>
            <div className="action-row">
              <Link className="button" to="/checkout">
                Proceed to Checkout
              </Link>
              <Link className="button secondary" to="/checkout">
                Buy Now
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Cart;
