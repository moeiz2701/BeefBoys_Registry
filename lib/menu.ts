// Menu configuration. Update prices here — everything else reads from this file.

export type MenuItemId = "mazedaar" | "bhut_mazedaar" | "notty_fries";

export type MenuItem = {
  id: MenuItemId;
  name: string;
  price: number;
  image: string;
  mealable: boolean;
};

export const MENU: MenuItem[] = [
  {
    id: "mazedaar",
    name: "Mazedaar",
    price: 500,
    image: "/menu_items/Beef_Boys_Mazedaar_Square.png",
    mealable: true,
  },
  {
    id: "bhut_mazedaar",
    name: "Bhut Mazedaar",
    price: 700,
    image: "/menu_items/Beef_Boys_Bhut_Mazedaar_Square.png",
    mealable: true,
  },
  {
    id: "notty_fries",
    name: "Notty Fries",
    price: 500,
    image: "/menu_items/Beef_Boys_Notty_Fries_Square.png",
    mealable: false,
  },
];

// Extra charged when a sandwich is upgraded to a meal.
export const MEAL_PRICE = 150;

export const MENU_BY_ID: Record<MenuItemId, MenuItem> = Object.fromEntries(
  MENU.map((m) => [m.id, m]),
) as Record<MenuItemId, MenuItem>;

export function formatRs(n: number): string {
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}
