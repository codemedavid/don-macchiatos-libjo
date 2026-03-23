import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Coffee, TrendingUp, Package, Users, Lock, FolderOpen, ChevronUp, ChevronDown, Image, ArrowUpDown } from 'lucide-react';
import { MenuItem, Variation, AddOn, ServingPreferenceOption } from '../types';
import { addOnCategories } from '../data/menuData';
import { useMenu } from '../hooks/useMenu';
import { useCategories } from '../hooks/useCategories';
import ImageUpload from './ImageUpload';
import CategoryManager from './CategoryManager';
import BannerManager from './BannerManager';
import ReorderManager from './ReorderManager';
import UpsellManager from './UpsellManager';
import BundleManager from './BundleManager';


const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('donmacchiatos_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const { menuItems, loading, addMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems } = useMenu();
  const { categories } = useCategories();
  const [currentView, setCurrentView] = useState<'dashboard' | 'items' | 'add' | 'edit' | 'categories' | 'banners' | 'reorder' | 'upsells' | 'bundles'>('dashboard');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'category' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    basePrice: 0,
    category: 'hot-coffee',
    popular: false,
    available: true,
    variations: [],
    servingPreferences: [],
    addOns: []
  });

  const handleAddItem = () => {
    setCurrentView('add');
    setFormData({
      name: '',
      description: '',
      basePrice: 0,
      category: categories[0]?.id || 'hot-coffee',
      popular: false,
      available: true,
      variations: [],
      servingPreferences: [],
      addOns: []
    });
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setCurrentView('edit');
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteMenuItem(id);
      } catch (error) {
        alert('Failed to delete item');
      }
    }
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.description || !formData.basePrice) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, formData);
      } else {
        await addMenuItem(formData as Omit<MenuItem, 'id'>);
      }
      setCurrentView('items');
      setEditingItem(null);
    } catch (error) {
      alert('Failed to save item');
    }
  };

  const handleCancel = () => {
    setCurrentView(currentView === 'add' || currentView === 'edit' ? 'items' : 'dashboard');
    setEditingItem(null);
  };

  const handleSort = (field: 'name' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setFilterCategory(''); // Clear category filter when sorting
  };

  const handleCategoryFilter = (category: string) => {
    if (filterCategory === category) {
      setFilterCategory(''); // Clear filter if same category clicked
    } else {
      setFilterCategory(category);
    }
    setSortBy(null); // Clear sorting when filtering
  };

  const handleMoveUp = async (item: MenuItem) => {
    const itemsInCategory = menuItems
      .filter(i => i.category === item.category)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const currentIndex = itemsInCategory.findIndex(i => i.id === item.id);
    if (currentIndex <= 0) return; // Already at top

    // Swap with previous item
    const newOrder = [...itemsInCategory];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];

    try {
      await reorderMenuItems(newOrder);
    } catch (error) {
      alert('Failed to reorder items');
    }
  };

  const handleMoveDown = async (item: MenuItem) => {
    const itemsInCategory = menuItems
      .filter(i => i.category === item.category)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const currentIndex = itemsInCategory.findIndex(i => i.id === item.id);
    if (currentIndex >= itemsInCategory.length - 1) return; // Already at bottom

    // Swap with next item
    const newOrder = [...itemsInCategory];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

    try {
      await reorderMenuItems(newOrder);
    } catch (error) {
      alert('Failed to reorder items');
    }
  };

  const getFilteredAndSortedItems = () => {
    let filteredItems = [...menuItems];

    // Apply category filter
    if (filterCategory) {
      filteredItems = filteredItems.filter(item => item.category === filterCategory);
    }

    // Apply sorting
    if (sortBy) {
      filteredItems.sort((a, b) => {
        let aValue = '';
        let bValue = '';

        if (sortBy === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else if (sortBy === 'category') {
          const aCat = categories.find(cat => cat.id === a.category)?.name || a.category;
          const bCat = categories.find(cat => cat.id === b.category)?.name || b.category;
          aValue = aCat.toLowerCase();
          bValue = bCat.toLowerCase();
        }

        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filteredItems;
  };

  const addVariation = () => {
    const newVariation: Variation = {
      id: `var-${Date.now()}`,
      name: '',
      price: 0,
      type: 'Size'
    };
    setFormData({
      ...formData,
      variations: [...(formData.variations || []), newVariation]
    });
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | number) => {
    const updatedVariations = [...(formData.variations || [])];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setFormData({ ...formData, variations: updatedVariations });
  };

  const removeVariation = (index: number) => {
    const updatedVariations = formData.variations?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, variations: updatedVariations });
  };

  const addServingPreference = () => {
    const newServingPreference: ServingPreferenceOption = {
      id: `sp-${Date.now()}`,
      name: '',
      value: '',
      price: 0
    };
    setFormData({
      ...formData,
      servingPreferences: [...(formData.servingPreferences || []), newServingPreference]
    });
  };

  const updateServingPreference = (
    index: number,
    field: keyof ServingPreferenceOption,
    value: string | number
  ) => {
    const updatedServingPreferences = [...(formData.servingPreferences || [])];
    updatedServingPreferences[index] = { ...updatedServingPreferences[index], [field]: value };
    setFormData({ ...formData, servingPreferences: updatedServingPreferences });
  };

  const removeServingPreference = (index: number) => {
    const updatedServingPreferences = formData.servingPreferences?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, servingPreferences: updatedServingPreferences });
  };

  const addAddOn = () => {
    const newAddOn: AddOn = {
      id: `addon-${Date.now()}`,
      name: '',
      price: 0,
      category: 'extras'
    };
    setFormData({
      ...formData,
      addOns: [...(formData.addOns || []), newAddOn]
    });
  };

  const updateAddOn = (index: number, field: keyof AddOn, value: string | number) => {
    const updatedAddOns = [...(formData.addOns || [])];
    updatedAddOns[index] = { ...updatedAddOns[index], [field]: value };
    setFormData({ ...formData, addOns: updatedAddOns });
  };

  const removeAddOn = (index: number) => {
    const updatedAddOns = formData.addOns?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, addOns: updatedAddOns });
  };

  // Dashboard Stats
  const totalItems = menuItems.length;
  const popularItems = menuItems.filter(item => item.popular).length;
  const availableItems = menuItems.filter(item => item.available).length;
  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: menuItems.filter(item => item.category === cat.id).length
  }));

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'DonMacchiatos@Admin!2026') {
      setIsAuthenticated(true);
      localStorage.setItem('donmacchiatos_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('donmacchiatos_admin_auth');
    setPassword('');
    setCurrentView('dashboard');
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-playfair font-semibold text-black">Admin Access</h1>
            <p className="text-gray-600 mt-2">Enter password to access the admin dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter admin password"
                required
              />
              {loginError && (
                <p className="text-red-500 text-sm mt-2">{loginError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Form View (Add/Edit)
  if (currentView === 'add' || currentView === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back</span>
                </button>
                <h1 className="text-2xl font-playfair font-semibold text-black">
                  {currentView === 'add' ? 'Add New Item' : 'Edit Item'}
                </h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Base Price *</label>
                <input
                  type="number"
                  value={formData.basePrice || ''}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Category *</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.popular || false}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm font-medium text-black">Mark as Popular</span>
                </label>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.available ?? true}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm font-medium text-black">Available for Order</span>
                </label>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-black mb-2">Description *</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter item description"
                rows={3}
              />
            </div>

            <div className="mb-8">
              <ImageUpload
                currentImage={formData.image}
                onImageChange={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
              />
            </div>

            {/* Variations Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-playfair font-medium text-black">Variations</h3>
                  <p className="text-sm text-gray-500 mt-1">Add different variation types like Size, Flavor, Milk, etc.</p>
                </div>
                <button
                  onClick={addVariation}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Variation</span>
                </button>
              </div>

              {formData.variations?.map((variation, index) => {
                const presetTypes = ['Size', 'Flavor', 'Milk', 'Temperature', 'Sweetness'];
                const currentType = typeof variation.type === 'string' ? variation.type : 'Size';
                const isCustom = currentType === '' || !presetTypes.includes(currentType);
                return (
                  <div key={variation.id} className="flex flex-wrap items-center gap-3 mb-3 p-4 bg-gray-50 rounded-lg">
                    <select
                      value={isCustom ? '__custom__' : currentType}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          updateVariation(index, 'type', '');
                        } else {
                          updateVariation(index, 'type', e.target.value);
                        }
                      }}
                      className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent bg-white text-sm"
                    >
                      <option value="Size">Size</option>
                      <option value="Flavor">Flavor</option>
                      <option value="Milk">Milk</option>
                      <option value="Temperature">Temperature</option>
                      <option value="Sweetness">Sweetness</option>
                      <option value="__custom__">Custom...</option>
                    </select>
                    {(isCustom || currentType === '') && (
                      <input
                        type="text"
                        value={currentType}
                        onChange={(e) => updateVariation(index, 'type', e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        placeholder="Custom type"
                        autoFocus
                      />
                    )}
                    <input
                      type="text"
                      value={variation.name}
                      onChange={(e) => updateVariation(index, 'name', e.target.value)}
                      className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Variation name (e.g., Small, Medium, Large)"
                    />
                    <input
                      type="number"
                      value={variation.price}
                      onChange={(e) => updateVariation(index, 'price', Number(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Price"
                    />
                    <button
                      onClick={() => removeVariation(index)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Serving Preferences Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-playfair font-medium text-black">Serving Preferences</h3>
                <button
                  onClick={addServingPreference}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Serving Preference</span>
                </button>
              </div>

              {formData.servingPreferences?.map((servingPreference, index) => (
                <div key={servingPreference.id} className="flex items-center space-x-3 mb-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={servingPreference.name}
                    onChange={(e) => updateServingPreference(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Display name (e.g., Hot, Iced)"
                  />
                  <input
                    type="text"
                    value={servingPreference.value}
                    onChange={(e) => updateServingPreference(index, 'value', e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Value (e.g., hot)"
                  />
                  <input
                    type="number"
                    value={servingPreference.price}
                    onChange={(e) => updateServingPreference(index, 'price', Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Price"
                  />
                  <button
                    onClick={() => removeServingPreference(index)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add-ons Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-playfair font-medium text-black">Add-ons</h3>
                <button
                  onClick={addAddOn}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Add-on</span>
                </button>
              </div>

              {formData.addOns?.map((addOn, index) => (
                <div key={addOn.id} className="flex items-center space-x-3 mb-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={addOn.name}
                    onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Add-on name"
                  />
                  <select
                    value={addOn.category}
                    onChange={(e) => updateAddOn(index, 'category', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {addOnCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={addOn.price}
                    onChange={(e) => updateAddOn(index, 'price', Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Price"
                  />
                  <button
                    onClick={() => removeAddOn(index)}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Items List View
  if (currentView === 'items') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Dashboard</span>
                </button>
                <h1 className="text-2xl font-playfair font-semibold text-black">Menu Items</h1>
              </div>
              <button
                onClick={handleAddItem}
                className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Item</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-black transition-colors duration-200"
                      >
                        <span>Name</span>
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      <button
                        onClick={() => handleSort('category')}
                        className="flex items-center space-x-1 hover:text-black transition-colors duration-200"
                      >
                        <span>Category</span>
                        {sortBy === 'category' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Base Price</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Variations</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Add-ons</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getFilteredAndSortedItems().map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleCategoryFilter(item.category)}
                          className={`hover:text-black transition-colors duration-200 ${filterCategory === item.category ? 'text-black font-medium' : ''
                            }`}
                        >
                          {categories.find(cat => cat.id === item.category)?.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">₱{item.basePrice}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.variations?.length || 0} variations
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.addOns?.length || 0} add-ons
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {item.popular && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white">
                              Popular
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {item.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleMoveUp(item)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(item)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Filter/Sort Status */}
            {(sortBy || filterCategory) && (
              <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {sortBy && (
                    <span className="text-sm text-gray-600">
                      Sorted by {sortBy} ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                    </span>
                  )}
                  {filterCategory && (
                    <span className="text-sm text-gray-600">
                      Filtered by: {categories.find(cat => cat.id === filterCategory)?.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSortBy(null);
                    setFilterCategory('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Categories View
  if (currentView === 'categories') {
    return <CategoryManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Banners View
  if (currentView === 'banners') {
    return <BannerManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Reorder View
  if (currentView === 'reorder') {
    return <ReorderManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Upsells View
  if (currentView === 'upsells') {
    return <UpsellManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Bundles View
  if (currentView === 'bundles') {
    return <BundleManager onBack={() => setCurrentView('dashboard')} />;
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Coffee className="h-8 w-8 text-black" />
              <h1 className="text-2xl font-playfair font-semibold text-black">Don Macchiatos Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-600 hover:text-black transition-colors duration-200"
              >
                View Website
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-black transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-black rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Items</p>
                <p className="text-2xl font-semibold text-gray-900">{availableItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Coffee className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Popular Items</p>
                <p className="text-2xl font-semibold text-gray-900">{popularItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-playfair font-medium text-black mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleAddItem}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Plus className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Add New Menu Item</span>
              </button>
              <button
                onClick={() => setCurrentView('items')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Package className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Manage Menu Items</span>
              </button>
              <button
                onClick={() => setCurrentView('categories')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <FolderOpen className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Manage Categories</span>
              </button>
              <button
                onClick={() => setCurrentView('banners')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Image className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Manage Banners</span>
              </button>
              <button
                onClick={() => setCurrentView('reorder')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <ArrowUpDown className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Re-order Menu</span>
              </button>
              <button
                onClick={() => setCurrentView('upsells')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <TrendingUp className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Manage Upsells</span>
              </button>
              <button
                onClick={() => setCurrentView('bundles')}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <Package className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">Manage Bundles</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-playfair font-medium text-black mb-4">Categories Overview</h3>
            <div className="space-y-3">
              {categoryCounts.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{category.count} items</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
