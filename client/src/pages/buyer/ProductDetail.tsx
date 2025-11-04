import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductDetailPage from "@/components/buyer/ProductDetailPage";

export default function ProductDetail() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <ProductDetailPage />
      </main>
      <Footer />
    </div>
  );
}