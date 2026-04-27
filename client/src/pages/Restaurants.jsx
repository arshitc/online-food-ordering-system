import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import RestaurantCard from "../components/RestaurantCard";
import { fetchRestaurants } from "../redux/restaurantSlice";

const Restaurants = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { list, loading } = useSelector((state) => state.restaurants);
  const [city, setCity] = useState("");
  const [cuisine, setCuisine] = useState("");
  const searchQuery = searchParams.get("q") || "";
  const filters = useMemo(
    () => ({ search: searchQuery, city, cuisine }),
    [city, cuisine, searchQuery]
  );

  useEffect(() => {
    dispatch(fetchRestaurants(filters));
  }, [dispatch, filters]);

  const updateSearchQuery = (value) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <section>
      <div className="section-head">
        <h2>Restaurants</h2>
        <p>Search nearby restaurants by name, city, or cuisine and find the best menu for your meal.</p>
      </div>
      <div className="filter-panel">
        <div className="filter-head">
          <h3>Find Your Favorite Food Spot</h3>
          <p>Use simple filters to quickly narrow down restaurants.</p>
        </div>
        <div className="filter-bar filter-form-row">
        <input
          className="desktop-section-search"
          value={searchQuery}
          placeholder="Search restaurant"
          onChange={(e) => updateSearchQuery(e.target.value)}
        />
        <input
          value={city}
          placeholder="City"
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          value={cuisine}
          placeholder="Cuisine"
          onChange={(e) => setCuisine(e.target.value)}
        />
        </div>
      </div>
      {loading ? <p>Loading restaurants...</p> : null}
      <div className="grid">
        {list.map((restaurant) => (
          <RestaurantCard key={restaurant._id} restaurant={restaurant} />
        ))}
      </div>
    </section>
  );
};

export default Restaurants;
