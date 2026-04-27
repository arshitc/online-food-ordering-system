import { API_ORIGIN } from "./runtimeConfig";

const foodImageMap = [
  {
    keywords: ["burger"],
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200"
  },
  {
    keywords: ["fries", "french fries"],
    image:
      "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=1200"
  },
  {
    keywords: ["juice", "orange juice", "beverage", "drink"],
    image:
      "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=1200"
  },
  {
    keywords: ["biryani", "rice"],
    image:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=1200"
  },
  {
    keywords: ["sandwich", "wrap"],
    image:
      "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=1200"
  },
  {
    keywords: ["salad", "bowl"],
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200"
  }
];

const defaultFoodImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200";

const getFoodImage = (item) => {
  if (item?.image) {
    if (item.image.startsWith("http://") || item.image.startsWith("https://")) {
      return item.image;
    }

    if (item.image.startsWith("/")) {
      return `${API_ORIGIN}${item.image}`;
    }

    return item.image;
  }

  const searchableText = `${item?.itemName || ""} ${item?.category || ""}`.toLowerCase();
  const matchedImage = foodImageMap.find(({ keywords }) =>
    keywords.some((keyword) => searchableText.includes(keyword))
  );

  return matchedImage?.image || defaultFoodImage;
};

export default getFoodImage;
