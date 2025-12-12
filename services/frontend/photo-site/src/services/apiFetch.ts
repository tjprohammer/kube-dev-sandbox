// services/api.js

export const fetchImagesFromAPI = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_GATEWAY_URL}/products`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const result = await response.json();
    const data = JSON.parse(result.body);

    if (Array.isArray(data)) {
      return data.map((item) => ({
        url: item.image,
        alt: item.title,
        title: item.title,
        description: item.description,
        category: item.category,
      }));
    } else {
      console.error("Parsed data is not an array:", data);
      return []; // Return an empty array if data is not an array
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return []; // Return an empty array in case of an error
  }
};
