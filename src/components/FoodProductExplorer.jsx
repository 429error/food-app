import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Filter, SortAsc, SortDesc, ChevronDown, Star, Package, Loader2 } from 'lucide-react';

const FoodProductExplorer = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const ITEMS_PER_PAGE = 20;

  // Fetch initial products
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async (searchQuery = '', isBarcode = false) => {
    setLoading(true);
    try {
      let url;
      if (isBarcode && searchQuery) {
        url = `https://world.openfoodfacts.org/api/v0/product/${searchQuery}.json`;
      } else if (searchQuery) {
        url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&json=true&page_size=100`;
      } else {
        url = 'https://world.openfoodfacts.org/cgi/search.pl?json=true&page_size=100';
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (isBarcode && data.product) {
        setProducts([data.product]);
        setFilteredProducts([data.product]);
      } else if (data.products) {
        const validProducts = data.products.filter(product => 
          product.product_name && product.product_name.trim() !== ''
        );
        setProducts(validProducts);
        setFilteredProducts(validProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setFilteredProducts([]);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://world.openfoodfacts.org/categories.json');
      const data = await response.json();
      if (data.tags) {
        const topCategories = data.tags.slice(0, 20).map(cat => ({
          id: cat.id,
          name: cat.name
        }));
        setCategories(topCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      fetchProducts(searchTerm);
      setCurrentPage(1);
    }
  };

  const handleBarcodeSearch = () => {
    if (barcodeSearch.trim()) {
      fetchProducts(barcodeSearch, true);
      setCurrentPage(1);
    }
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    if (category === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.categories && product.categories.toLowerCase().includes(category.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
    setCurrentPage(1);
  };

  const handleSort = (newSortBy) => {
    let newOrder = 'asc';
    if (sortBy === newSortBy && sortOrder === 'asc') {
      newOrder = 'desc';
    }
    
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    
    const sorted = [...filteredProducts].sort((a, b) => {
      let valueA, valueB;
      
      switch (newSortBy) {
        case 'name':
          valueA = (a.product_name || '').toLowerCase();
          valueB = (b.product_name || '').toLowerCase();
          break;
        case 'grade':
          valueA = a.nutrition_grades || 'z';
          valueB = b.nutrition_grades || 'z';
          break;
        default:
          return 0;
      }
      
      if (newOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
    
    setFilteredProducts(sorted);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const getNutritionGradeColor = (grade) => {
    const colors = {
      'a': 'bg-green-500',
      'b': 'bg-lime-500',
      'c': 'bg-yellow-500',
      'd': 'bg-orange-500',
      'e': 'bg-red-500'
    };
    return colors[grade?.toLowerCase()] || 'bg-gray-400';
  };

  const paginatedProducts = filteredProducts.slice(0, currentPage * ITEMS_PER_PAGE);

  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Products
            </button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <div className="h-64 md:h-96 bg-gray-100 flex items-center justify-center">
                  {selectedProduct.image_url ? (
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.product_name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Package className="w-24 h-24 text-gray-400" />
                  )}
                </div>
              </div>
              
              <div className="md:w-2/3 p-6">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedProduct.product_name || 'Unknown Product'}
                  </h1>
                  <button
                    onClick={() => addToCart(selectedProduct)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
                
                {selectedProduct.nutrition_grades && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-gray-600">Nutrition Grade:</span>
                    <span className={`px-3 py-1 rounded-full text-white font-bold ${getNutritionGradeColor(selectedProduct.nutrition_grades)}`}>
                      {selectedProduct.nutrition_grades.toUpperCase()}
                    </span>
                  </div>
                )}
                
                {selectedProduct.brands && (
                  <p className="text-gray-600 mb-4">
                    <span className="font-medium">Brand:</span> {selectedProduct.brands}
                  </p>
                )}
                
                {selectedProduct.categories && (
                  <p className="text-gray-600 mb-4">
                    <span className="font-medium">Categories:</span> {selectedProduct.categories}
                  </p>
                )}
                
                {selectedProduct.ingredients_text && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedProduct.ingredients_text}
                    </p>
                  </div>
                )}
                
                {selectedProduct.nutriments && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Nutritional Information (per 100g)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProduct.nutriments.energy_100g && (
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-600">Energy</div>
                          <div className="font-medium">{selectedProduct.nutriments.energy_100g} kJ</div>
                        </div>
                      )}
                      {selectedProduct.nutriments.fat_100g && (
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-600">Fat</div>
                          <div className="font-medium">{selectedProduct.nutriments.fat_100g}g</div>
                        </div>
                      )}
                      {selectedProduct.nutriments.carbohydrates_100g && (
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-600">Carbs</div>
                          <div className="font-medium">{selectedProduct.nutriments.carbohydrates_100g}g</div>
                        </div>
                      )}
                      {selectedProduct.nutriments.proteins_100g && (
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-600">Protein</div>
                          <div className="font-medium">{selectedProduct.nutriments.proteins_100g}g</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedProduct.labels && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Labels</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.labels.split(',').slice(0, 5).map((label, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {label.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-8 h-8 text-blue-600" />
              Food Product Explorer
            </h1>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Search Bars */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by barcode..."
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleBarcodeSearch}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Search
              </button>
            </div>
          </div>
          
          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <button
                onClick={() => handleSort('name')}
                className={`flex items-center gap-1 px-3 py-1 rounded ${sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Name
                {sortBy === 'name' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
              </button>
              <button
                onClick={() => handleSort('grade')}
                className={`flex items-center gap-1 px-3 py-1 rounded ${sortBy === 'grade' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Grade
                {sortBy === 'grade' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />)}
              </button>
            </div>
            
            <span className="text-sm text-gray-500">
              {filteredProducts.length} products found
            </span>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No products found</h2>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product, index) => (
                <div 
                  key={product.id || index} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.product_name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Package className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.product_name || 'Unknown Product'}
                    </h3>
                    
                    {product.brands && (
                      <p className="text-sm text-gray-600 mb-2">{product.brands}</p>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      {product.nutrition_grades && (
                        <span className={`px-2 py-1 rounded-full text-white text-xs font-bold ${getNutritionGradeColor(product.nutrition_grades)}`}>
                          Grade {product.nutrition_grades.toUpperCase()}
                        </span>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {product.categories && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {product.categories.split(',').slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {paginatedProducts.length < filteredProducts.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Load More Products
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FoodProductExplorer;