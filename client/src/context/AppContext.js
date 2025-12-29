import { createContext, useContext, useEffect, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState("");
  const [authorId, setAuthorId] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        if (storedToken) {
          setAuthToken(storedToken);

          const decoded = jwtDecode(storedToken);
          const restaurantIdFromToken = decoded?.restaurant_id;

          if (restaurantIdFromToken) {
            setRestaurantId(restaurantIdFromToken);
            resIdRef.current = restaurantIdFromToken;
          } else {
            console.warn("No authToken");
          }
        }
      } catch (error) {
        console.error("", error);
      }
    };

    initializeAuth();
    fetchAutoAcceptAndTime();
  }, []);
};
