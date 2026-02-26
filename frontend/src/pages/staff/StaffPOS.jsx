import React, { useState } from 'react';
import StaffLayout from './StaffLayout';

function StaffPOS() {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('services'); // services or products
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    vehicle: ''
  });

  // Services available
  const services = [
    { id: 1, name: 'Oil Change', price: 1200, category: 'Maintenance', duration: '30-45 mins' },
    { id: 2, name: 'Brake Inspection', price: 800, category: 'Inspection', duration: '20-30 mins' },
    { id: 3, name: 'Engine Diagnostic', price: 1800, category: 'Diagnostic', duration: '45-60 mins' },
    { id: 4, name: 'Tire Replacement', price: 3500, category: 'Maintenance', duration: '1 hour' },
    { id: 5, name: 'Full Service', price: 3800, category: 'Maintenance', duration: '2 hours' },
    { id: 6, name: 'AC Service', price: 2200, category: 'Maintenance', duration: '1.5 hours' },
    { id: 7, name: 'Battery Replacement', price: 4800, category: 'Parts & Service', duration: '30 mins' },
    { id: 8, name: 'Brake Repair', price: 3200, category: 'Repair', duration: '2 hours' }
  ];

  // Products available
  const products = [
    { id: 1, name: 'Engine Oil 5W-30', price: 450, category: 'Lubricants', stock: 45, unit: 'Liter' },
    { id: 2, name: 'Brake Pads Set', price: 2500, category: 'Brakes', stock: 12, unit: 'Set' },
    { id: 3, name: 'Air Filter', price: 350, category: 'Filters', stock: 8, unit: 'Piece' },
    { id: 4, name: 'Battery 12V 60Ah', price: 4200, category: 'Batteries', stock: 5, unit: 'Piece' },
    { id: 5, name: 'Tire 195/65R15', price: 3500, category: 'Tires', stock: 24, unit: 'Piece' },
    { id: 6, name: 'Engine Oil 10W-40', price: 420, category: 'Lubricants', stock: 32, unit: 'Liter' },
    { id: 7, name: 'Spark Plugs Set', price: 800, category: 'Ignition', stock: 18, unit: 'Set' },
    { id: 8, name: 'Coolant Fluid', price: 350, category: 'Lubricants', stock: 28, unit: 'Liter' }
  ];

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item, type) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.type === type);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id && cartItem.type === type
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, type }]);
    }
  };

  const removeFromCart = (itemId, type) => {
    setCart(cart.filter(item => !(item.id === itemId && item.type === type)));
  };

  const updateQuantity = (itemId, type, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(cart.map(item =>
      item.id === itemId && item.type === type
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.12; // 12% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please enter customer information!');
      return;
    }
    // Process payment
    const total = calculateTotal();
    alert(`Payment processed successfully!\nTotal: ₱${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    // Clear cart and customer info
    setCart([]);
    setCustomerInfo({ name: '', phone: '', vehicle: '' });
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
    }
  };

  return (
    <StaffLayout 
      title="" 
      subtitle=""
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 -m-8 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Point of Sale</h1>
          <p className="text-slate-300">Process transactions for products and services</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products/Services Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('services')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === 'services'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Services
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === 'products'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Products
                </button>
              </div>

              {/* Search */}
              <div className="p-6 border-b border-gray-200">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Items Grid */}
              <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeTab === 'services' && filteredServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => addToCart(service, 'service')}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-xl p-4 hover:shadow-md transition-all text-left"
                    >
                      <h3 className="font-bold text-gray-900 mb-2">{service.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{service.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">₱{service.price.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">{service.duration}</span>
                      </div>
                    </button>
                  ))}

                  {activeTab === 'products' && filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product, 'product')}
                      className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-xl p-4 hover:shadow-md transition-all text-left"
                    >
                      <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-emerald-600">₱{product.price.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {((activeTab === 'services' && filteredServices.length === 0) ||
                  (activeTab === 'products' && filteredProducts.length === 0)) && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-600">No {activeTab} found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 sticky top-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Cart</h2>
              </div>

              {/* Customer Info */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Vehicle (Optional)"
                    value={customerInfo.vehicle}
                    onChange={(e) => setCustomerInfo({...customerInfo, vehicle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="p-6 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 text-sm">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div key={`${item.type}-${item.id}-${index}`} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-600">
                              {item.type === 'service' ? 'Service' : 'Product'}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.type)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-gray-900">
                            ₱{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="p-6 border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">₱{calculateSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (12%)</span>
                  <span className="font-semibold text-gray-900">₱{calculateTax().toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-red-600">₱{calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200 space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  Proceed to Payment
                </button>
                <button
                  onClick={handleClearCart}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}

export default StaffPOS;