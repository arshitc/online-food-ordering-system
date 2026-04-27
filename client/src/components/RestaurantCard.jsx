import { Link } from "react-router-dom";
import getRestaurantImage from "../utils/getRestaurantImage";

const RestaurantCard = ({ restaurant }) => (
  <article className="card showcase-card">
    <img
      src={getRestaurantImage(restaurant)}
      alt={restaurant.name}
      className="card-image"
    />
    <div className="card-body">
      <div className="meta-row">
        <span className="tag">Open Now</span>
        <span className="rating-pill">{restaurant.rating || 0} / 5</span>
      </div>
      <h3>{restaurant.name}</h3>
      <p>{restaurant.location}</p>
      <p>{restaurant.cuisine?.join(", ") || "Multi Cuisine"}</p>
      <Link className="button" to={`/restaurants/${restaurant._id}`}>
        View Menu
      </Link>
    </div>
  </article>
);

export default RestaurantCard;
