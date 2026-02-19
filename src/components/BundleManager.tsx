import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Search, Check, ChevronDown } from 'lucide-react';
import { Bundle, MenuItem } from '../types';
import { useBundles } from '../hooks/useBundles';
import { useMenu } from '../hooks/useMenu';
import ImageUpload from './ImageUpload';

interface BundleManagerProps {
    onBack: () => void;
}

// Reuse the multi-select pattern from UpsellManager
const MenuItemMultiSelect: React.FC<{
    label: string;
    selectedIds: string[];
    menuItems: MenuItem[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
}> = ({ label, selectedIds, menuItems, onChange, placeholder = 'Search menu items...' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = menuItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleItem = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(sid => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectedItems = menuItems.filter(item => selectedIds.includes(item.id));

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-black mb-2">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition-colors"
            >
                <span className={selectedIds.length === 0 ? 'text-gray-400' : 'text-black'}>
                    {selectedIds.length === 0
                        ? 'Select items...'
                        : `${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedItems.map(item => (
                        <span
                            key={item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium"
                        >
                            {item.name}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
                                className="hover:text-red-500 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {isOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder={placeholder}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">No items found</div>
                        ) : (
                            filtered.map(item => {
                                const isSelected = selectedIds.includes(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => toggleItem(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${isSelected ? 'bg-gray-50' : ''}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-black border-black' : 'border-gray-300'}`}>
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        {item.image && (
                                            <img src={item.image} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{item.name}</div>
                                            <div className="text-xs text-gray-500">₱{item.basePrice}</div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-full py-1.5 text-sm text-center text-gray-600 hover:text-black transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const BundleManager: React.FC<BundleManagerProps> = ({ onBack }) => {
    const { bundles, loading, addBundle, updateBundle, deleteBundle, calculateBundlePrice, getOriginalPrice } = useBundles();
    const { menuItems } = useMenu();
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image_url: undefined as string | undefined,
        pricing_type: 'fixed' as 'fixed' | 'discount',
        fixed_price: 0,
        discount_type: 'none' as 'none' | 'fixed' | 'percentage',
        discount_value: 0,
        active: true,
        show_on_menu: false,
        sort_order: 0,
        item_ids: [] as string[],
    });

    // Calculate preview price based on current form selections
    const previewPrice = useMemo(() => {
        const selectedItems = menuItems.filter(mi => formData.item_ids.includes(mi.id));
        const itemsTotal = selectedItems.reduce((sum, item) => sum + item.basePrice, 0);

        if (formData.pricing_type === 'fixed') {
            return formData.fixed_price;
        }

        if (formData.discount_type === 'fixed') {
            return Math.max(0, itemsTotal - formData.discount_value);
        }
        if (formData.discount_type === 'percentage') {
            return itemsTotal * (1 - formData.discount_value / 100);
        }
        return itemsTotal;
    }, [formData, menuItems]);

    const previewOriginalPrice = useMemo(() => {
        const selectedItems = menuItems.filter(mi => formData.item_ids.includes(mi.id));
        return selectedItems.reduce((sum, item) => sum + item.basePrice, 0);
    }, [formData.item_ids, menuItems]);

    const handleAdd = () => {
        setEditingBundle(null);
        setFormData({
            name: '',
            description: '',
            image_url: undefined,
            pricing_type: 'fixed',
            fixed_price: 0,
            discount_type: 'none',
            discount_value: 0,
            active: true,
            show_on_menu: false,
            sort_order: 0,
            item_ids: [],
        });
        setCurrentView('form');
    };

    const handleEdit = (bundle: Bundle) => {
        setEditingBundle(bundle);
        setFormData({
            name: bundle.name,
            description: bundle.description,
            image_url: bundle.image_url,
            pricing_type: bundle.pricing_type,
            fixed_price: bundle.fixed_price,
            discount_type: bundle.discount_type,
            discount_value: bundle.discount_value,
            active: bundle.active,
            show_on_menu: bundle.show_on_menu,
            sort_order: bundle.sort_order,
            item_ids: bundle.items.map(bi => bi.menu_item_id),
        });
        setCurrentView('form');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this bundle?')) {
            try {
                await deleteBundle(id);
            } catch {
                alert('Failed to delete bundle');
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert('Please enter a bundle name');
            return;
        }
        if (formData.item_ids.length === 0) {
            alert('Please select at least one menu item');
            return;
        }

        try {
            const bundleData = {
                name: formData.name,
                description: formData.description,
                image_url: formData.image_url,
                pricing_type: formData.pricing_type,
                fixed_price: formData.fixed_price,
                discount_type: formData.discount_type,
                discount_value: formData.discount_value,
                active: formData.active,
                show_on_menu: formData.show_on_menu,
                sort_order: formData.sort_order,
            };

            if (editingBundle) {
                await updateBundle(editingBundle.id, bundleData, formData.item_ids);
            } else {
                await addBundle(bundleData as any, formData.item_ids);
            }
            setCurrentView('list');
            setEditingBundle(null);
        } catch {
            alert('Failed to save bundle');
        }
    };

    const handleCancel = () => {
        setCurrentView('list');
        setEditingBundle(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading bundles...</p>
                </div>
            </div>
        );
    }

    // Form View
    if (currentView === 'form') {
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
                                    {editingBundle ? 'Edit Bundle' : 'Create Bundle'}
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
                                    onClick={handleSave}
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
                        {/* Name & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Bundle Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. Morning Combo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Short description for customers"
                                />
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="mb-8">
                            <ImageUpload
                                currentImage={formData.image_url}
                                onImageChange={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
                            />
                        </div>

                        {/* Menu Items Selection */}
                        <div className="mb-8">
                            <MenuItemMultiSelect
                                label="Bundle Items *"
                                selectedIds={formData.item_ids}
                                menuItems={menuItems}
                                onChange={(ids) => setFormData({ ...formData, item_ids: ids })}
                                placeholder="Search menu items to include..."
                            />
                        </div>

                        {/* Pricing Type */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-black mb-3">Pricing Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, pricing_type: 'fixed' })}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${formData.pricing_type === 'fixed'
                                        ? 'border-black bg-black text-white'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`text-sm font-semibold ${formData.pricing_type === 'fixed' ? 'text-white' : 'text-gray-900'}`}>
                                        Fixed Price
                                    </div>
                                    <div className={`text-xs mt-0.5 ${formData.pricing_type === 'fixed' ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Set a single price for the entire bundle
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, pricing_type: 'discount' })}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${formData.pricing_type === 'discount'
                                        ? 'border-black bg-black text-white'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`text-sm font-semibold ${formData.pricing_type === 'discount' ? 'text-white' : 'text-gray-900'}`}>
                                        Discount
                                    </div>
                                    <div className={`text-xs mt-0.5 ${formData.pricing_type === 'discount' ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Apply a discount to combined item prices
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Price / Discount Input */}
                        {formData.pricing_type === 'fixed' ? (
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-black mb-2">Fixed Price (₱)</label>
                                <input
                                    type="number"
                                    value={formData.fixed_price}
                                    onChange={(e) => setFormData({ ...formData, fixed_price: Number(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">Discount Type</label>
                                    <select
                                        value={formData.discount_type}
                                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    >
                                        <option value="none">No Discount</option>
                                        <option value="fixed">Fixed Amount (₱)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>
                                {formData.discount_type !== 'none' && (
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">
                                            Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(₱)'}
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.discount_value}
                                            onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="rounded border-gray-300 text-black focus:ring-black"
                                />
                                <span className="text-sm font-medium text-black">Active</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.show_on_menu}
                                    onChange={(e) => setFormData({ ...formData, show_on_menu: e.target.checked })}
                                    className="rounded border-gray-300 text-black focus:ring-black"
                                />
                                <span className="text-sm font-medium text-black">Show on Customer Menu</span>
                            </label>
                        </div>

                        {/* Price Preview */}
                        {formData.item_ids.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Price Preview</h3>
                                <div className="flex items-center gap-3">
                                    {previewPrice < previewOriginalPrice && (
                                        <span className="text-lg text-gray-400 line-through">₱{previewOriginalPrice.toFixed(2)}</span>
                                    )}
                                    <span className="text-2xl font-bold text-black">₱{previewPrice.toFixed(2)}</span>
                                    {previewPrice < previewOriginalPrice && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Save ₱{(previewOriginalPrice - previewPrice).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Base bundle price (add-ons are charged extra)
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onBack}
                                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span>Dashboard</span>
                            </button>
                            <h1 className="text-2xl font-playfair font-semibold text-black">Manage Bundles</h1>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Bundle</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {bundles.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="text-5xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bundles Yet</h3>
                        <p className="text-gray-500 mb-6">Create your first bundle to offer curated combos to customers.</p>
                        <button
                            onClick={handleAdd}
                            className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Create Bundle
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bundles.map(bundle => {
                            const bundlePrice = calculateBundlePrice(bundle);
                            const originalPrice = getOriginalPrice(bundle);
                            const hasSavings = bundlePrice < originalPrice;

                            return (
                                <div
                                    key={bundle.id}
                                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 flex-1 min-w-0">
                                            {bundle.image_url && (
                                                <img
                                                    src={bundle.image_url}
                                                    alt={bundle.name}
                                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-medium text-gray-900">{bundle.name}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${bundle.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {bundle.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {bundle.show_on_menu && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            On Menu
                                                        </span>
                                                    )}
                                                    {hasSavings && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                            Save ₱{(originalPrice - bundlePrice).toFixed(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                {bundle.description && (
                                                    <p className="text-sm text-gray-500 mb-2">{bundle.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                                    <div>
                                                        <span className="font-medium text-gray-700">Items: </span>
                                                        {bundle.items.map(bi => bi.menuItem.name).join(', ')}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-700">Price: </span>
                                                        {hasSavings && <span className="line-through mr-1">₱{originalPrice.toFixed(0)}</span>}
                                                        <span className="font-semibold text-black">₱{bundlePrice.toFixed(0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => handleEdit(bundle)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bundle.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BundleManager;
