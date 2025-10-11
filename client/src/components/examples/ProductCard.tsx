import ProductCard from '../ProductCard';

export default function ProductCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <ProductCard
        id="1"
        image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"
        name="Wireless Bluetooth Headphones with Noise Cancellation"
        priceRange="$25.00-$35.00 /piece"
        moq="100 pieces"
        supplierName="TechPro Electronics"
        supplierCountry="China"
        responseRate="98%"
        verified={true}
        tradeAssurance={true}
      />
    </div>
  );
}
