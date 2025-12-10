export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
  createdAt: number;
}

export enum PredefinedCategory {
  FruitsAndVeg = "Fruits & Vegetables",
  MeatAndFish = "Meat & Fish",
  Dairy = "Dairy & Eggs",
  Bakery = "Bakery",
  Pantry = "Pantry",
  Frozen = "Frozen",
  Beverages = "Beverages",
  Household = "Household",
  Other = "Other"
}

export interface CategoryGroup {
  name: string;
  items: ShoppingItem[];
}

export interface ChartData {
  name: string;
  value: number;
  fill: string;
}