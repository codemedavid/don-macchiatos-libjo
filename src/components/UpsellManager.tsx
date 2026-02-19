import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Search, Check, ChevronDown } from 'lucide-react';
import { Upsell, UpsellType, MenuItem } from '../types';
import { useUpsells } from '../hooks/useUpsells';
import { useMenu } from '../hooks/useMenu';
import { useBundles } from '../hooks/useBundles';
import ImageUpload from './ImageUpload';

interface UpsellManagerProps {
    onBack: () => void;
}

const UPSELL_TYPE_LABELS: Record<UpsellType, string> = {
    best_pair: 'Best Pair',
    upgrade_meal: 'Upgrade Meal',
    before_you_go: 'Before You Go',
};

const UPSELL_TYPE_DESCRIPTIONS: Record<UpsellType, string> = {
    best_pair: 'Suggest pairing items on product detail pages',
    upgrade_meal: 'Offer meal upgrades in the cart view',
    before_you_go: 'Last-chance items shown at checkout',
};

const UPSELL_TYPE_ICONS: Record<UpsellType, string> = {
    best_pair: '🍽️',
    upgrade_meal: '⬆️',
    before_you_go: '✨',
};

// Multi-select dropdown for menu items
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

            {/* Selected items tags */}
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

            {/* Dropdown */}
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
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${isSelected ? 'bg-gray-50' : ''
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-black border-black' : 'border-gray-300'
                                            }`}>
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

const UpsellManager: React.FC<UpsellManagerProps> = ({ onBack }) => {
    const { upsells, loading, addUpsell, updateUpsell, deleteUpsell } = useUpsells();
    const { menuItems } = useMenu();
    const { bundles } = useBundles();
    const [activeTab, setActiveTab] = useState<UpsellType>('best_pair');
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
    const [editingUpsell, setEditingUpsell] = useState<Upsell | null>(null);

    const [formData, setFormData] = useState<{
        type: UpsellType;
        name: string;
        description: string;
        trigger_item_ids: string[];
        offer_item_ids: string[];
        discount_type: 'none' | 'fixed' | 'percentage';
        discount_value: number;
        active: boolean;
        sort_order: number;
        image_url?: string;
        skip_label: string;
        accept_label: string;
        bundle_id?: string;
    }>({
        type: 'best_pair',
        name: '',
        description: '',
        trigger_item_ids: [],
        offer_item_ids: [],
        discount_type: 'none',
        discount_value: 0,
        active: true,
        sort_order: 0,
        image_url: undefined,
        skip_label: 'No, thanks',
        accept_label: 'Add to Order',
        bundle_id: undefined,
    });

    const filteredUpsells = upsells.filter(u => u.type === activeTab);

    const handleAdd = () => {
        setEditingUpsell(null);
        setFormData({
            type: activeTab,
            name: '',
            description: '',
            trigger_item_ids: [],
            offer_item_ids: [],
            discount_type: 'none',
            discount_value: 0,
            active: true,
            sort_order: 0,
            image_url: undefined,
            skip_label: 'No, thanks',
            accept_label: 'Add to Order',
            bundle_id: undefined,
        });
        setCurrentView('form');
    };

    const handleEdit = (upsell: Upsell) => {
        setEditingUpsell(upsell);
        setFormData({
            type: upsell.type,
            name: upsell.name,
            description: upsell.description,
            trigger_item_ids: upsell.trigger_item_ids,
            offer_item_ids: upsell.offer_item_ids,
            discount_type: upsell.discount_type,
            discount_value: upsell.discount_value,
            active: upsell.active,
            sort_order: upsell.sort_order,
            image_url: upsell.image_url,
            skip_label: upsell.skip_label || 'No, thanks',
            accept_label: upsell.accept_label || 'Add to Order',
            bundle_id: upsell.bundle_id,
        });
        setCurrentView('form');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this upsell?')) {
            try {
                await deleteUpsell(id);
            } catch {
                alert('Failed to delete upsell');
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert('Please enter an upsell name');
            return;
        }
        if (formData.offer_item_ids.length === 0) {
            alert('Please select at least one offer item');
            return;
        }

        try {
            if (editingUpsell) {
                await updateUpsell(editingUpsell.id, formData);
            } else {
                await addUpsell(formData);
            }
            setCurrentView('list');
            setEditingUpsell(null);
        } catch {
            alert('Failed to save upsell');
        }
    };

    const handleCancel = () => {
        setCurrentView('list');
        setEditingUpsell(null);
    };

    const getItemNames = (ids: string[]) => {
        return ids
            .map(id => menuItems.find(mi => mi.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading upsells...</p>
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
                                    {editingUpsell ? 'Edit Upsell' : 'Create Upsell'}
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
                        {/* Type Selector */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-black mb-3">Upsell Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(Object.keys(UPSELL_TYPE_LABELS) as UpsellType[]).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type })}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${formData.type === type
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">{UPSELL_TYPE_ICONS[type]}</div>
                                        <div className={`text-sm font-semibold ${formData.type === type ? 'text-white' : 'text-gray-900'}`}>
                                            {UPSELL_TYPE_LABELS[type]}
                                        </div>
                                        <div className={`text-xs mt-0.5 ${formData.type === type ? 'text-gray-300' : 'text-gray-500'}`}>
                                            {UPSELL_TYPE_DESCRIPTIONS[type]}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. Coffee + Croissant Combo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Short customer-facing text"
                                />
                            </div>
                        </div>

                        {/* Button Labels (for Upgrade Meal & Before You Go) */}
                        {formData.type !== 'best_pair' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">Skip Button Label</label>
                                    <input
                                        type="text"
                                        value={formData.skip_label}
                                        onChange={(e) => setFormData({ ...formData, skip_label: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="e.g. Ala Carte Only"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">Accept Button Label</label>
                                    <input
                                        type="text"
                                        value={formData.accept_label}
                                        onChange={(e) => setFormData({ ...formData, accept_label: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="e.g. Make it a Meal"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Trigger & Offer Items */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {formData.type !== 'before_you_go' && (
                                <MenuItemMultiSelect
                                    label="Trigger Items (when customer adds these)"
                                    selectedIds={formData.trigger_item_ids}
                                    menuItems={menuItems}
                                    onChange={(ids) => setFormData({ ...formData, trigger_item_ids: ids })}
                                    placeholder="Search trigger items..."
                                />
                            )}
                            <div className={formData.type === 'before_you_go' ? 'md:col-span-2' : ''}>
                                <MenuItemMultiSelect
                                    label="Offer Items (items to suggest) *"
                                    selectedIds={formData.offer_item_ids}
                                    menuItems={menuItems}
                                    onChange={(ids) => setFormData({ ...formData, offer_item_ids: ids })}
                                    placeholder="Search offer items..."
                                />
                            </div>
                        </div>

                        {/* Bundle Linking (upgrade_meal only) */}
                        {formData.type === 'upgrade_meal' && bundles.length > 0 && (
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-black mb-2">Link Bundle (Optional)</label>
                                <select
                                    value={formData.bundle_id || ''}
                                    onChange={(e) => {
                                        const bundleId = e.target.value || undefined;
                                        const selectedBundle = bundles.find(b => b.id === bundleId);
                                        setFormData({
                                            ...formData,
                                            bundle_id: bundleId,
                                            // Auto-populate offer items from bundle
                                            offer_item_ids: selectedBundle
                                                ? selectedBundle.items.map(bi => bi.menu_item_id)
                                                : formData.offer_item_ids,
                                        });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                >
                                    <option value="">No bundle linked</option>
                                    {bundles.filter(b => b.active).map(bundle => (
                                        <option key={bundle.id} value={bundle.id}>
                                            {bundle.name} ({bundle.items.length} items)
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    When linked, the upgrade will open the bundle customization instead of individual items.
                                </p>
                            </div>
                        )}

                        {/* Discount */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Discount Type</label>
                                <select
                                    value={formData.discount_type}
                                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as Upsell['discount_type'] })}
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
                            <div className="flex items-end">
                                <label className="flex items-center space-x-2 pb-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="rounded border-gray-300 text-black focus:ring-black"
                                    />
                                    <span className="text-sm font-medium text-black">Active</span>
                                </label>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="mb-8">
                            <ImageUpload
                                currentImage={formData.image_url}
                                onImageChange={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
                            />
                        </div>
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
                            <h1 className="text-2xl font-playfair font-semibold text-black">Manage Upsells</h1>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Upsell</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Type Tabs */}
                <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
                    {(Object.keys(UPSELL_TYPE_LABELS) as UpsellType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === type
                                ? 'bg-white text-black shadow-sm'
                                : 'text-gray-600 hover:text-black'
                                }`}
                        >
                            <span>{UPSELL_TYPE_ICONS[type]}</span>
                            <span>{UPSELL_TYPE_LABELS[type]}</span>
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === type ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {upsells.filter(u => u.type === type).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Description */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-3">
                    <span className="text-2xl">{UPSELL_TYPE_ICONS[activeTab]}</span>
                    <div>
                        <h3 className="font-medium text-gray-900">{UPSELL_TYPE_LABELS[activeTab]}</h3>
                        <p className="text-sm text-gray-500">{UPSELL_TYPE_DESCRIPTIONS[activeTab]}</p>
                    </div>
                </div>

                {/* Upsells List */}
                {filteredUpsells.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="text-5xl mb-4">{UPSELL_TYPE_ICONS[activeTab]}</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No {UPSELL_TYPE_LABELS[activeTab]} Upsells</h3>
                        <p className="text-gray-500 mb-6">Create your first upsell to start increasing your average order value.</p>
                        <button
                            onClick={handleAdd}
                            className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Create Upsell
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredUpsells.map(upsell => (
                            <div
                                key={upsell.id}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-medium text-gray-900">{upsell.name}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${upsell.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {upsell.active ? 'Active' : 'Inactive'}
                                            </span>
                                            {upsell.discount_type !== 'none' && (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    {upsell.discount_type === 'fixed' ? `₱${upsell.discount_value} off` : `${upsell.discount_value}% off`}
                                                </span>
                                            )}
                                        </div>
                                        {upsell.description && (
                                            <p className="text-sm text-gray-500 mb-3">{upsell.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                            {upsell.trigger_item_ids.length > 0 && (
                                                <div>
                                                    <span className="font-medium text-gray-700">Triggers: </span>
                                                    {getItemNames(upsell.trigger_item_ids) || 'None'}
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-medium text-gray-700">Offers: </span>
                                                {getItemNames(upsell.offer_item_ids) || 'None'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(upsell)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(upsell.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpsellManager;
