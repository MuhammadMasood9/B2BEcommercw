import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Play, 
  Image as ImageIcon,
  ZoomIn,
  RotateCcw,
  Download
} from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  videos?: string[];
  productName: string;
}

export default function ProductImageGallery({ images, videos = [], productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Combine images and videos for gallery
  const allMedia = [
    ...images.map(img => ({ type: 'image' as const, url: img })),
    ...videos.map(vid => ({ type: 'video' as const, url: vid }))
  ];

  // Fallback image if no media
  const displayMedia = allMedia.length > 0 ? allMedia : [
    { type: 'image' as const, url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop' }
  ];

  const currentMedia = displayMedia[selectedIndex];

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % displayMedia.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + displayMedia.length) % displayMedia.length);
  };

  const openModal = (index: number) => {
    setModalIndex(index);
    setIsModalOpen(true);
    setZoom(1);
    setRotation(0);
  };

  const nextModalImage = () => {
    setModalIndex((prev) => (prev + 1) % displayMedia.length);
    setZoom(1);
    setRotation(0);
  };

  const prevModalImage = () => {
    setModalIndex((prev) => (prev - 1 + displayMedia.length) % displayMedia.length);
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = displayMedia[modalIndex].url;
    link.download = `${productName}-image-${modalIndex + 1}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Main Image/Video Display */}
      <div className="relative group">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {currentMedia.type === 'image' ? (
            <img 
              src={currentMedia.url} 
              alt={`${productName} - Image ${selectedIndex + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <video 
              src={currentMedia.url}
              controls
              className="w-full h-full object-cover"
              poster={images[0] || undefined}
            >
              Your browser does not support the video tag.
            </video>
          )}
          
          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={() => openModal(selectedIndex)}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              View Full Size
            </Button>
          </div>

          {/* Navigation Arrows */}
          {displayMedia.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
                onClick={prevImage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
                onClick={nextImage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Media Type Indicator */}
          <div className="absolute top-2 right-2">
            {currentMedia.type === 'video' ? (
              <div className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <Play className="w-3 h-3" />
                Video
              </div>
            ) : (
              <div className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {selectedIndex + 1}/{displayMedia.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Grid */}
      {displayMedia.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {displayMedia.slice(0, 8).map((media, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 relative ${
                selectedIndex === idx 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {media.type === 'image' ? (
                <img 
                  src={media.url} 
                  alt={`Thumbnail ${idx + 1}`} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Play className="w-6 h-6 text-gray-600" />
                </div>
              )}
              
              {/* Media type overlay */}
              {media.type === 'video' && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
          
          {/* Show more indicator */}
          {displayMedia.length > 8 && (
            <button
              onClick={() => openModal(8)}
              className="aspect-square rounded-lg border-2 border-gray-200 hover:border-gray-300 bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium"
            >
              +{displayMedia.length - 8}
            </button>
          )}
        </div>
      )}

      {/* Full Screen Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
          <div className="relative w-full h-full bg-black">
            {/* Modal Image/Video */}
            <div className="w-full h-full flex items-center justify-center p-4">
              {displayMedia[modalIndex]?.type === 'image' ? (
                <img 
                  src={displayMedia[modalIndex].url}
                  alt={`${productName} - Full size ${modalIndex + 1}`}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{ 
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                />
              ) : (
                <video 
                  src={displayMedia[modalIndex]?.url}
                  controls
                  className="max-w-full max-h-full"
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            {/* Modal Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {displayMedia[modalIndex]?.type === 'image' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomIn className="w-4 h-4 rotate-180" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRotate}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Navigation */}
            {displayMedia.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                  onClick={prevModalImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                  onClick={nextModalImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Modal Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded text-sm">
              {modalIndex + 1} / {displayMedia.length}
            </div>

            {/* Modal Thumbnails */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex justify-center gap-2 overflow-x-auto pb-2">
                {displayMedia.map((media, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setModalIndex(idx);
                      setZoom(1);
                      setRotation(0);
                    }}
                    className={`w-12 h-12 rounded border-2 overflow-hidden flex-shrink-0 ${
                      modalIndex === idx ? 'border-white' : 'border-gray-400'
                    }`}
                  >
                    {media.type === 'image' ? (
                      <img 
                        src={media.url} 
                        alt={`Thumbnail ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}