'use client';

type AuctionGalleryProps = {
  pics: string[];
  mainImage: string;
  setMainImage: React.Dispatch<React.SetStateAction<string>>;
  productName: string;
};

export default function AuctionGallery({
  pics,
  mainImage,
  setMainImage,
  productName,
}: AuctionGalleryProps) {
  const mainImgFull = mainImage || pics[0] || '';

  return (
    <div className="w-full">
      {/* Main */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 bg-white">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-emerald-700/70" />

        {mainImgFull ? (
          <img
            src={mainImgFull}
            alt={productName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
            ไม่มีรูป
          </div>
        )}
      </div>

      {/* Thumbs */}
      {pics.length > 1 && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {pics.map((full, i) => {
            const active = mainImgFull === full;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setMainImage(full)}
                className={[
                  'relative w-20 h-20 rounded-xl overflow-hidden border bg-white transition',
                  active
                    ? 'border-emerald-600 ring-2 ring-emerald-600/30'
                    : 'border-gray-200 hover:border-emerald-600/60',
                ].join(' ')}
                aria-label={`thumbnail-${i + 1}`}
              >
                <img
                  src={full}
                  alt={`thumb-${i}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
