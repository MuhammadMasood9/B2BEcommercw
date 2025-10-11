import SupplierCard from "./SupplierCard";

export default function TopSuppliers() {
  //todo: remove mock functionality
  const suppliers = [
    {
      id: "1",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
      name: "Global Electronics Manufacturing",
      location: "Shenzhen, China",
      yearsInBusiness: 12,
      rating: 4.8,
      responseRate: "95%",
      mainProducts: ["Headphones", "Speakers", "Chargers"],
      verified: true,
      goldSupplier: true,
    },
    {
      id: "2",
      logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
      name: "Fashion Textile Exports Ltd",
      location: "Mumbai, India",
      yearsInBusiness: 8,
      rating: 4.6,
      responseRate: "92%",
      mainProducts: ["T-Shirts", "Dresses", "Fabrics"],
      verified: true,
      goldSupplier: false,
    },
    {
      id: "3",
      logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop",
      name: "Industrial Machinery Corp",
      location: "Tokyo, Japan",
      yearsInBusiness: 15,
      rating: 4.9,
      responseRate: "98%",
      mainProducts: ["CNC Machines", "Motors", "Parts"],
      verified: true,
      goldSupplier: true,
    },
  ];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">Top-Ranked Suppliers</h2>
          <a href="/suppliers" className="text-primary hover:underline font-medium" data-testid="link-view-all-suppliers">
            View All →
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <SupplierCard key={supplier.id} {...supplier} />
          ))}
        </div>
      </div>
    </section>
  );
}
