
// itemcac.tsx
export interface CactusItem {
  Idauction: number;
  imageSrc: string;
  name: string;
  pricenow: number;
  Time: Date;
}

const itemscac: CactusItem[] = [
  { Idauction: 0, imageSrc: "/cac01.jpg", name: "ยิมโน()", pricenow: 50, Time: new Date("2024-01-25T00:00:00Z") },
  { Idauction: 1, imageSrc: "/cac01.jpg", name: "ยิมโน()", pricenow: 50, Time: new Date("2024-01-25T00:00:00Z") },
  { Idauction: 2, imageSrc: "/cac01.jpg", name: "ยิมโน()", pricenow: 50, Time: new Date("2024-01-25T00:00:00Z") },
  { Idauction: 3, imageSrc: "/cac01.jpg", name: "ยิมโน()", pricenow: 50, Time: new Date("2024-01-25T00:00:00Z") },
  { Idauction: 4, imageSrc: "/cac01.jpg", name: "ยิมโน()", pricenow: 50, Time: new Date("2024-01-25T00:00:00Z") },
  { Idauction: 5, imageSrc: "/cac01.jpg", name: "ยิมโน()", pricenow: 50, Time: new Date("2024-01-25T00:00:00Z") },
 
];

export default itemscac;