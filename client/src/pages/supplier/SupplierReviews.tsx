import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MessageSquare, Filter } from "lucide-react";
import { format } from "date-fns";

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    orderReference: string | null;
    createdAt: string;
    buyerId: string;
    buyerName: string | null;
    buyerLastName: string | null;
    buyerCompany: string | null;
    productId: string | null;
    productName: string | null;
}

interface ReviewsResponse {
    success: boolean;
    reviews: Review[];
    total: number;
    averageRating: number;
    page: number;
    limit: number;
}

export default function SupplierReviews() {
    const [activeTab, setActiveTab] = useState("all");

    // Fetch reviews
    const { data, isLoading } = useQuery<ReviewsResponse>({
        queryKey: ["/api/suppliers/reviews"],
    });

    const reviews = data?.reviews || [];
    const averageRating = data?.averageRating || 0;

    // Calculate statistics
    const stats = {
        totalReviews: reviews.length,
        averageRating: averageRating.toFixed(1),
        fiveStars: reviews.filter(r => r.rating === 5).length,
        fourStars: reviews.filter(r => r.rating === 4).length,
        threeStars: reviews.filter(r => r.rating === 3).length,
        twoStars: reviews.filter(r => r.rating === 2).length,
        oneStar: reviews.filter(r => r.rating === 1).length,
        responseRate: 0, // Not implemented yet
    };

    // All reviews (filtering can be added later)
    const filteredReviews = reviews;

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    };

    const getRatingPercentage = (count: number) => {
        return reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
                    <p className="text-gray-600 mt-1">Manage customer feedback and ratings</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total Reviews
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalReviews}</div>
                        <p className="text-xs text-gray-500 mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Average Rating
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-3xl font-bold">{stats.averageRating}</div>
                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Out of 5.0</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            5-Star Reviews
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.fiveStars}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.totalReviews > 0 ? Math.round((stats.fiveStars / stats.totalReviews) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Recent Reviews
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {reviews.filter(r => {
                                const reviewDate = new Date(r.createdAt);
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                return reviewDate >= thirtyDaysAgo;
                            }).length}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                    </CardContent>
                </Card>
            </div>

            {/* Rating Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = [stats.fiveStars, stats.fourStars, stats.threeStars, stats.twoStars, stats.oneStar][5 - rating];
                            const percentage = getRatingPercentage(count);

                            return (
                                <div key={rating} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-20">
                                        <span className="text-sm font-medium">{rating}</span>
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 w-16 text-right">
                                        {count} ({percentage}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Reviews List */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Customer Reviews</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4 mr-2" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-gray-100 p-1">
                            <TabsTrigger 
                                value="all"
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
                            >
                                All Reviews ({reviews.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="space-y-4 mt-4">
                            {filteredReviews.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600">No reviews yet</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Reviews will appear here once customers leave feedback on your products
                                    </p>
                                </div>
                            ) : (
                                filteredReviews.map((review) => {
                                    const buyerDisplayName = review.buyerName
                                        ? `${review.buyerName} ${review.buyerLastName || ''}`.trim()
                                        : review.buyerCompany || 'Anonymous Buyer';

                                    return (
                                        <div key={review.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-600 font-semibold">
                                                            {buyerDisplayName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">{buyerDisplayName}</div>
                                                        {review.buyerCompany && review.buyerName && (
                                                            <div className="text-sm text-gray-500">{review.buyerCompany}</div>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {renderStars(review.rating)}
                                                            <span className="text-sm text-gray-500">
                                                                {format(new Date(review.createdAt), "MMM dd, yyyy")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {review.productName && (
                                                <div className="text-sm text-gray-500">
                                                    Product: <span className="font-medium text-gray-700">{review.productName}</span>
                                                    {review.orderReference && (
                                                        <>
                                                            {" • "}
                                                            Order: <span className="font-medium text-gray-700">#{review.orderReference}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {review.comment && (
                                                <p className="text-gray-700">{review.comment}</p>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
