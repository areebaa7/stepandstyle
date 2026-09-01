// app/storefront/utils/shopApi.js

export async function fetchProducts(category = null) {
  try {
    let url = '/api/products';
    if (category) {
      url += `?category=${category.toLowerCase()}`;
    }

    const response = await fetch(url, { cache: 'no-store' });
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error('Failed to load products from API: Server returned non-JSON response');
      return [];
    }
    const json = await response.json();

    if (!response.ok || !json.success) {
      console.error('Failed to load products from API');
      return [];
    }

    return json.data.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      formattedPrice: `Rs.${product.price.toLocaleString()}`,
      originalPrice: product.salePrice ? product.salePrice : null,
      formattedOriginalPrice: product.salePrice ? `Rs.${product.salePrice.toLocaleString()}` : null,
      discount: product.discount ? `${product.discount}% OFF` : null,
      image: product.image || (product.images?.[0]) || '/assets/placeholder.jpg',
      images: product.images && product.images.length > 0 ? product.images : [product.image],
      description: product.description,
      shortDescription: product.shortDescription,
      category: product.category || 'Footwear',
      colors: product.colors && product.colors.length > 0 ? product.colors : ['#1F2937'],
      colorVariants: product.variants || [],
      details: product.specifications || {},
    }));
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return [];
  }
}
