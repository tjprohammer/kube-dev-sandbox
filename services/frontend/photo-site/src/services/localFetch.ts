// utils/fetchData.js
export const fetchImages = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const result = await response.json();
    // Check if the response needs to be parsed from a string (AWS response)
    const data = typeof result.body === 'string' ? JSON.parse(result.body) : result;
    if (!Array.isArray(data)) {
      console.error("Data is not an array:", data);
      return [];
    }
    return data.map(item => ({
      url: item.image,
      alt: item.title,
      title: item.title,
      description: item.description,
      category: item.category,
      materials: item.materials,
    }));
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
};
