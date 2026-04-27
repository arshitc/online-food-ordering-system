import { API_ORIGIN } from "./runtimeConfig";

const defaultRestaurantImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

const getRestaurantImage = (restaurant) => {
  if (!restaurant?.image) {
    return defaultRestaurantImage;
  }

  if (restaurant.image.startsWith("http://") || restaurant.image.startsWith("https://")) {
    return restaurant.image;
  }

  if (restaurant.image.startsWith("/")) {
    return `${API_ORIGIN}${restaurant.image}`;
  }

  return restaurant.image;
};

export default getRestaurantImage;
