import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';
import { menuData, categories, addOnCategories } from '../data/menuData';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [items, setItems] = useState<MenuItem[]>(menuData);
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    basePrice: 0,
    category: 'hot-coffee',
    popular: false,
    variations: [],
    addOns: []
  });

  const handleAddItem = () => {
    setCurrentView('add');
    setFormData({
      name: '',
      description: '',
      basePrice: 0,
      category: 'hot-coffee',
      popular: false,
      variations: [],
      addOns: []
    });
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setCurrentView('edit');
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.description || !formData.basePrice) {
      alert('Please fill in all required fields');
      return;
    }

    const newItem: MenuItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      name: formData.name!,
      description: formData.description!,
      basePrice: formData.basePrice!,
      category: formData.category!,
      popular: formData.popular || false,
      variations: formData.variations || [],
      addOns: formData.addOns || []
    };

    if (editingItem) {
      setItems(items.map(item => item.id === editingItem.id ? newItem : item));
    } else {
      setItems([...items, newItem]);
    }

    setCurrentView('list');
    setEditingItem(null);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingItem(null);
  };

  const addVariation = () => {
    const newVariation: Variation = {
      id: `var-${Date.now()}`,
      name: '',
      price: 0
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

  if (currentView === 'add' || currentView === 'edit') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Items</span>
          </button>
          <h1 className="text-3xl font-playfair font-semibold text-black">
            {currentView === 'add' ? 'Add New Item' : 'Edit Item'}
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleSaveItem}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Item Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent"
                placeholder="Enter item name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Base Price *</label>
              <input
                type="number"
                value={formData.basePrice || ''}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Category *</label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent"
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
                  className="rounded border-beige-300 text-black focus:ring-cream-500"
                />
                <span className="text-sm font-medium text-black">Mark as Popular</span>
              </label>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-black mb-2">Description *</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-beige-300 rounded-lg focus:ring-2 focus:ring-cream-500 focus:border-transparent"
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          {/* Variations Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-playfair font-medium text-black">Size Variations</h3>
              <button
                onClick={addVariation}
                className="flex items-center space-x-2 px-3 py-2 bg-beige-100 text-black rounded-lg hover:bg-beige-200 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Add Variation</span>
              </button>
            </div>

            {formData.variations?.map((variation, index) => (
              <div key={variation.id} className="flex items-center space-x-3 mb-3 p-3 bg-beige-50 rounded-lg">
                <input
                  type="text"
                  value={variation.name}
                  onChange={(e) => updateVariation(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-beige-300 rounded focus:ring-2 focus:ring-cream-500 focus:border-transparent"
                  placeholder="Variation name (e.g., Small, Medium, Large)"
                />
                <input
                  type="number"
                  value={variation.price}
                  onChange={(e) => updateVariation(index, 'price', Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-beige-300 rounded focus:ring-2 focus:ring-cream-500 focus:border-transparent"
                  placeholder="Price"
                />
                <button
                  onClick={() => removeVariation(index)}
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
                className="flex items-center space-x-2 px-3 py-2 bg-beige-100 text-black rounded-lg hover:bg-beige-200 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Add Add-on</span>
              </button>
            </div>

            {formData.addOns?.map((addOn, index) => (
              <div key={addOn.id} className="flex items-center space-x-3 mb-3 p-3 bg-beige-50 rounded-lg">
                <input
                  type="text"
                  value={addOn.name}
                  onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-beige-300 rounded focus:ring-2 focus:ring-cream-500 focus:border-transparent"
                  placeholder="Add-on name"
                />
                <select
                  value={addOn.category}
                  onChange={(e) => updateAddOn(index, 'category', e.target.value)}
                  className="px-3 py-2 border border-beige-300 rounded focus:ring-2 focus:ring-cream-500 focus:border-transparent"
                >
                  {addOnCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={addOn.price}
                  onChange={(e) => updateAddOn(index, 'price', Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-beige-300 rounded focus:ring-2 focus:ring-cream-500 focus:border-transparent"
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
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Menu</span>
        </button>
        <h1 className="text-3xl font-playfair font-semibold text-black">Admin Dashboard</h1>
        <button
          onClick={handleAddItem}
          className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Item</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Category</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Base Price</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Variations</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Add-ons</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Popular</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-beige-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-black">{item.name}</div>
                      <div className="text-sm text-gray-600 truncate max-w-xs">{item.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {categories.find(cat => cat.id === item.category)?.name}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-black">₱{item.basePrice}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.variations?.length || 0} variations
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.addOns?.length || 0} add-ons
                  </td>
                  <td className="px-6 py-4">
                    {item.popular && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white">
                        Popular
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-2 text-gray-600 hover:text-black hover:bg-beige-100 rounded transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
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
      </div>
    </div>
  );
};

export default AdminDashboard;