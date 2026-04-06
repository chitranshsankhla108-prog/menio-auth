import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, OrderItem, Feedback, MenuCategory } from '@/types/cafe';

interface CafeState {
  menuItems: MenuItem[];
  currentOrder: OrderItem[];
  feedbacks: Feedback[];
  
  // Menu actions
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  
  // Order actions
  addToOrder: (item: MenuItem) => void;
  removeFromOrder: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearOrder: () => void;
  getOrderSubtotal: () => number;
  
  // Feedback actions
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialMenuItems: MenuItem[] = [
  { id: '1', name: 'Masala Chai', price: 40, category: 'Drinks', description: 'Authentic spiced tea', available: true },
  { id: '2', name: 'Filter Coffee', price: 60, category: 'Drinks', description: 'South Indian style', available: true },
  { id: '3', name: 'Cold Coffee', price: 90, category: 'Drinks', description: 'Creamy & refreshing', available: true },
  { id: '4', name: 'Samosa', price: 25, category: 'Snacks', description: 'Crispy potato filling', available: true },
  { id: '5', name: 'Veg Sandwich', price: 80, category: 'Snacks', description: 'Grilled with veggies', available: true },
  { id: '6', name: 'Paneer Tikka', price: 180, category: 'Meals', description: 'Tandoori style', available: true },
  { id: '7', name: 'Dal Makhani Thali', price: 220, category: 'Meals', description: 'Complete meal', available: true },
];

export const useCafeStore = create<CafeState>()(
  persist(
    (set, get) => ({
      menuItems: initialMenuItems,
      currentOrder: [],
      feedbacks: [],

      addMenuItem: (item) =>
        set((state) => ({
          menuItems: [...state.menuItems, { ...item, id: generateId() }],
        })),

      updateMenuItem: (id, updates) =>
        set((state) => ({
          menuItems: state.menuItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      deleteMenuItem: (id) =>
        set((state) => ({
          menuItems: state.menuItems.filter((item) => item.id !== id),
        })),

      addToOrder: (item) =>
        set((state) => {
          const existing = state.currentOrder.find(
            (o) => o.menuItem.id === item.id
          );
          if (existing) {
            return {
              currentOrder: state.currentOrder.map((o) =>
                o.menuItem.id === item.id
                  ? { ...o, quantity: o.quantity + 1 }
                  : o
              ),
            };
          }
          return {
            currentOrder: [...state.currentOrder, { menuItem: item, quantity: 1 }],
          };
        }),

      removeFromOrder: (itemId) =>
        set((state) => ({
          currentOrder: state.currentOrder.filter(
            (o) => o.menuItem.id !== itemId
          ),
        })),

      updateQuantity: (itemId, quantity) =>
        set((state) => ({
          currentOrder:
            quantity <= 0
              ? state.currentOrder.filter((o) => o.menuItem.id !== itemId)
              : state.currentOrder.map((o) =>
                  o.menuItem.id === itemId ? { ...o, quantity } : o
                ),
        })),

      clearOrder: () => set({ currentOrder: [] }),

      getOrderSubtotal: () => {
        const state = get();
        return state.currentOrder.reduce(
          (total, item) => total + item.menuItem.price * item.quantity,
          0
        );
      },

      addFeedback: (feedback) =>
        set((state) => ({
          feedbacks: [
            { ...feedback, id: generateId(), createdAt: new Date() },
            ...state.feedbacks,
          ],
        })),
    }),
    {
      name: 'menio-storage',
    }
  )
);
