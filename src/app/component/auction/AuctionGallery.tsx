'use client';

interface AuctionGalleryProps {
  pics: string[];
  mainImage: string;
  setMainImage: (img: string) => void;
  productName: string;
}

export default function AuctionGallery({
  pics,
  mainImage,
  setMainImage,
  productName,
}: AuctionGalleryProps) {
  const mainImgFull = mainImage || pics[0] || '';

  return (
    <div className="w-full">
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow">
  {mainImgFull ? (
    <img
      src={mainImgFull}
      alt={productName}
      className="absolute inset-0 w-full h-full object-cover"
    />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
      ไม่มีรูป
    </div>
  )}
</div>

      {/* Thumbnail */}
      {pics.length > 0 && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {pics.map((full, i) => {
            const active = mainImgFull === full;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setMainImage(full)}
                className={`relative w-20 h-20 rounded overflow-hidden border
                            ${active ? 'ring-2 ring-red-500' : 'hover:border-red-500'}`}
                aria-label={`thumbnail-${i + 1}`}
              >
                <img src={full} alt={`thumb-${i}`} className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
