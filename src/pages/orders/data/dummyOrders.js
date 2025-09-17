// Dummy data for orders and SKU views

export const dummyOrders = [
  {
    _id: "ORD001",
    status: "pending",
    totalAmount: 1250.00,
    discountedPriceAfterCoupon: 1200.00,
    createdAt: "2024-01-15T10:30:00Z",
    customer: {
      _id: "CUST001",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+91 9876543210"
    },
    items: [
      {
        product: {
          _id: "PROD001",
          name: "Gluten-Free Bread Mix",
          sku: "GFB001"
        },
        quantity: 2,
        price: 300
      },
      {
        product: {
          _id: "PROD002", 
          name: "Almond Flour",
          sku: "ALM001"
        },
        quantity: 1,
        price: 650
      }
    ],
    shippingAddress: {
      street: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001"
    }
  },
  {
    _id: "ORD002",
    status: "processing",
    totalAmount: 850.00,
    discountedPriceAfterCoupon: 800.00,
    createdAt: "2024-01-14T15:45:00Z",
    customer: {
      _id: "CUST002",
      name: "Jane Smith",
      email: "jane.smith@example.com", 
      phone: "+91 9876543211"
    },
    items: [
      {
        product: {
          _id: "PROD003",
          name: "Rice Flour",
          sku: "RCF001"
        },
        quantity: 3,
        price: 200
      },
      {
        product: {
          _id: "PROD001",
          name: "Gluten-Free Bread Mix",
          sku: "GFB001"
        },
        quantity: 1,
        price: 300
      }
    ],
    shippingAddress: {
      street: "456 Park Ave",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001"
    }
  },
  {
    _id: "ORD003",
    status: "shipped",
    totalAmount: 1500.00,
    discountedPriceAfterCoupon: 1450.00,
    createdAt: "2024-01-13T09:20:00Z",
    customer: {
      _id: "CUST003",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      phone: "+91 9876543212"
    },
    items: [
      {
        product: {
          _id: "PROD002",
          name: "Almond Flour", 
          sku: "ALM001"
        },
        quantity: 2,
        price: 650
      },
      {
        product: {
          _id: "PROD004",
          name: "Quinoa Seeds",
          sku: "QUI001"
        },
        quantity: 1,
        price: 400
      }
    ],
    shippingAddress: {
      street: "789 Oak St",
      city: "Bangalore",
      state: "Karnataka", 
      pincode: "560001"
    }
  },
  {
    _id: "ORD004",
    status: "delivered",
    totalAmount: 600.00,
    discountedPriceAfterCoupon: 580.00,
    createdAt: "2024-01-12T14:10:00Z",
    customer: {
      _id: "CUST004",
      name: "Alice Brown",
      email: "alice.brown@example.com",
      phone: "+91 9876543213"
    },
    items: [
      {
        product: {
          _id: "PROD003",
          name: "Rice Flour",
          sku: "RCF001"
        },
        quantity: 2,
        price: 200
      },
      {
        product: {
          _id: "PROD005",
          name: "Coconut Flour",
          sku: "COC001"
        },
        quantity: 1,
        price: 250
      }
    ],
    shippingAddress: {
      street: "321 Pine St",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001"
    }
  },
  {
    _id: "ORD005",
    status: "cancelled",
    totalAmount: 950.00,
    discountedPriceAfterCoupon: 900.00,
    createdAt: "2024-01-11T11:30:00Z",
    customer: {
      _id: "CUST005",
      name: "Charlie Wilson",
      email: "charlie.wilson@example.com",
      phone: "+91 9876543214"
    },
    items: [
      {
        product: {
          _id: "PROD001",
          name: "Gluten-Free Bread Mix",
          sku: "GFB001"
        },
        quantity: 1,
        price: 300
      },
      {
        product: {
          _id: "PROD004",
          name: "Quinoa Seeds",
          sku: "QUI001"  
        },
        quantity: 1,
        price: 400
      },
      {
        product: {
          _id: "PROD005",
          name: "Coconut Flour",
          sku: "COC001"
        },
        quantity: 1,
        price: 250
      }
    ],
    shippingAddress: {
      street: "654 Elm St",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001"
    }
  },
  {
    _id: "ORD006",
    status: "processing",
    totalAmount: 1100.00,
    discountedPriceAfterCoupon: 1050.00,
    createdAt: "2024-01-10T16:45:00Z",
    customer: {
      _id: "CUST002",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+91 9876543211"
    },
    items: [
      {
        product: {
          _id: "PROD002",
          name: "Almond Flour",
          sku: "ALM001"
        },
        quantity: 1,
        price: 650
      },
      {
        product: {
          _id: "PROD003",
          name: "Rice Flour",
          sku: "RCF001"
        },
        quantity: 2,
        price: 200
      }
    ],
    shippingAddress: {
      street: "456 Park Ave",
      city: "Delhi",
      state: "Delhi", 
      pincode: "110001"
    }
  }
];

export const ORDER_STATUSES = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

// Generate SKU view data from orders
export const generateSKUData = (orders, statusFilter = "all") => {
  const skuMap = new Map();
  
  // Filter orders by status if not "all"
  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter(order => order.status === statusFilter);
  
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      // Handle both real API data and dummy data structures
      // Check if item has type field, if not assume it's a product
      const isBundle = item.type === 'bundle';
      const isProduct = item.type === 'product' || !item.type; // Default to product if no type
      
      let product;
      if (isBundle) {
        product = item.bundle;
      } else if (isProduct) {
        product = item.product;
      }
      
      // For real API data, we might not have SKU, so use product ID as fallback
      const sku = product?.sku || product?._id || 'unknown';
      
      if (!skuMap.has(sku)) {
        skuMap.set(sku, {
          sku: sku,
          productName: product?.name || 'Unknown Product',
          productId: product?._id,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
          orders: []
        });
      }
      
      const skuData = skuMap.get(sku);
      skuData.totalQuantity += item.quantity || 0;
      
      // Handle different price formats including $numberDecimal objects
      const getPrice = (priceField) => {
        if (!priceField) return 0;
        if (typeof priceField === 'number') return priceField;
        if (priceField.$numberDecimal) return parseFloat(priceField.$numberDecimal);
        return parseFloat(priceField) || 0;
      };
      
      // Calculate revenue based on available price fields
      let itemPrice = 0;
      
      if (item.discounted_total_amount !== null && item.discounted_total_amount !== undefined) {
        itemPrice = getPrice(item.discounted_total_amount) / (item.quantity || 1);
      } else if (item.total_amount !== null && item.total_amount !== undefined) {
        itemPrice = getPrice(item.total_amount) / (item.quantity || 1);
      } else if (product?.discounted_price !== null && product?.discounted_price !== undefined) {
        itemPrice = getPrice(product.discounted_price);
      } else if (product?.price !== null && product?.price !== undefined) {
        itemPrice = getPrice(product.price);
      }
      
      skuData.totalRevenue += (itemPrice * (item.quantity || 0));
      
      skuData.orders.push({
        orderId: order._id,
        quantity: item.quantity || 0,
        price: itemPrice,
        customer: order.customer || { 
          name: order.address?.name || 'Unknown Customer',
          email: order.address?.mobile || 'No contact'
        },
        orderDate: order.createdAt,
        orderStatus: order.status
      });
    });
  });
  
  // Convert Map to Array and sort by total revenue descending
  return Array.from(skuMap.values())
    .map(skuData => ({
      ...skuData,
      orderCount: skuData.orders.length
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
};
