import RFQCard from '../RFQCard';

export default function RFQCardExample() {
  return (
    <div className="p-4 max-w-2xl">
      <RFQCard
        id="1"
        title="Looking for High-Quality Wireless Earbuds - Bulk Order"
        quantity="5,000 units"
        budget="$15-20 per unit"
        location="United States"
        timeRemaining="3 days left"
        quotations={12}
        category="Electronics"
      />
    </div>
  );
}
