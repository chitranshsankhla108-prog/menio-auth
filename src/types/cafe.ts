export type MenuCategory = "Drinks" | "Snacks" | "Meals";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  description?: string;
  available: boolean;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  createdAt: Date;
  status: "pending" | "completed" | "cancelled";
}

export interface Feedback {
  id: string;
  name: string;
  email?: string;
  message: string;
  rating: number;
  createdAt: Date;
}
