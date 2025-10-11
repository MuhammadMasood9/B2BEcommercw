import SupplierCard from '../SupplierCard';

export default function SupplierCardExample() {
  return (
    <div className="p-4 max-w-md">
      <SupplierCard
        id="1"
        logo="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop"
        name="Global Electronics Manufacturing Co."
        location="Shenzhen, China"
        yearsInBusiness={12}
        rating={4.8}
        responseRate="95%"
        mainProducts={["Headphones", "Speakers", "Chargers", "Cables"]}
        verified={true}
        goldSupplier={true}
      />
    </div>
  );
}
