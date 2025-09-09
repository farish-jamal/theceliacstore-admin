import React from "react";
import { Package, ShoppingCart } from "lucide-react";

const ViewSwitcher = ({ currentView, onViewChange }) => {
  const views = [
    {
      key: "orders",
      label: "Order View", 
      icon: ShoppingCart,
      description: "View all orders"
    },
    {
      key: "sku",
      label: "SKU View",
      icon: Package,
      description: "View orders by product/SKU"
    }
  ];

  return (
    <div className="inline-flex items-center rounded-lg">
      {views.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => {
            console.log("ViewSwitcher clicked:", key);
            onViewChange(key);
          }}
          className={`flex items-center gap-2 mx-1 px-4 py-2 rounded-md border-2 font-medium ${
            currentView === key 
              ? "bg-gray-600 text-white border-gray-800" 
              : "bg-white text-gray-700 border-gray-400 hover:bg-gray-50"
          }`}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;
