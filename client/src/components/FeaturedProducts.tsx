import ProductCard from "./ProductCard";

export default function FeaturedProducts() {
  //todo: remove mock functionality
  const products = [
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      name: "Premium Wireless Headphones with Active Noise Cancellation",
      priceRange: "$25.00-$35.00 /piece",
      moq: "100 pieces",
      supplierName: "AudioTech Pro",
      supplierCountry: "China",
      responseRate: "98%",
      verified: true,
      tradeAssurance: true,
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      name: "Classic Analog Wristwatch - Leather Strap",
      priceRange: "$15.00-$22.00 /piece",
      moq: "200 pieces",
      supplierName: "TimeKeeper Industries",
      supplierCountry: "Hong Kong",
      responseRate: "95%",
      verified: true,
      tradeAssurance: false,
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
      name: "Designer Sunglasses UV Protection",
      priceRange: "$8.00-$12.00 /piece",
      moq: "500 pieces",
      supplierName: "Vision Plus Co.",
      supplierCountry: "Taiwan",
      responseRate: "92%",
      verified: false,
      tradeAssurance: true,
    },
    {
      id: "4",
      image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop",
      name: "Casual Canvas Sneakers - Multiple Colors",
      priceRange: "$12.00-$18.00 /pair",
      moq: "300 pairs",
      supplierName: "FootWear Global",
      supplierCountry: "Vietnam",
      responseRate: "97%",
      verified: true,
      tradeAssurance: true,
    },
  ];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">Trending Products</h2>
          <a href="/products" className="text-primary hover:underline font-medium" data-testid="link-view-all-products">
            View All →
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}
