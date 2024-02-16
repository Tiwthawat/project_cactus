// cactusitems.tsx
import React from "react";

interface AuctionItemProps {
  Idauction: number;
  imageSrc: string;
  name: string;
  pricenow: number;
  Time: Date;
  link: string; 
}

const AuctionItem: React.FC<AuctionItemProps> = ({
  Idauction,
  imageSrc,
  name,
  pricenow,
  Time,
  link, 
}) => {
  return (
    <div className="mr-10 ml-5 mb-5 w-44">
      <a href={`/Product`}>
        <picture className="flex items-center justify-center">
          <img
            src={imageSrc}
            alt={name}
            className="w-40 h-40 object-cover border-4 border-white rounded-md mr-5"
          />
        </picture>
        <div className="flex flex-col mt-2">
          <p className="text-sm text-black">{name}</p>
          <p className="text-sm text-black">
            {Idauction},{pricenow},{Time.toLocaleString()}
          </p>
        </div>
      </a>
    </div>
  );
};

export default AuctionItem;