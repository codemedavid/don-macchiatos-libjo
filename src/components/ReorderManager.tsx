import React, { useState } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown, ChevronRight, GripVertical, RotateCcw } from 'lucide-react';
import { useMenu } from '../hooks/useMenu';
import { useCategories, Category } from '../hooks/useCategories';
import { MenuItem } from '../types';

interface ReorderManagerProps {
    onBack: () => void;
}

const ReorderManager: React.FC<ReorderManagerProps> = ({ onBack }) => {
    const { menuItems, reorderMenuItems } = useMenu();
    const { categories, reorderCategories } = useCategories();
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories.map(c => c.id)));
    const [reordering, setReordering] = useState(false);

    // Toggle category expansion
    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    // Category reordering
    const handleCategoryMoveUp = async (category: Category) => {
        const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
        const currentIndex = sortedCategories.findIndex(c => c.id === category.id);
        if (currentIndex <= 0) return;

        setReordering(true);
        const newOrder = [...sortedCategories];
        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];

        try {
            await reorderCategories(newOrder);
        } catch (error) {
            console.error('Failed to reorder categories:', error);
        } finally {
            setReordering(false);
        }
    };

    const handleCategoryMoveDown = async (category: Category) => {
        const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
        const currentIndex = sortedCategories.findIndex(c => c.id === category.id);
        if (currentIndex >= sortedCategories.length - 1) return;

        setReordering(true);
        const newOrder = [...sortedCategories];
        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

        try {
            await reorderCategories(newOrder);
        } catch (error) {
            console.error('Failed to reorder categories:', error);
        } finally {
            setReordering(false);
        }
    };

    // Item reordering within category
    const handleItemMoveUp = async (item: MenuItem) => {
        const itemsInCategory = menuItems
            .filter(i => i.category === item.category)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        const currentIndex = itemsInCategory.findIndex(i => i.id === item.id);
        if (currentIndex <= 0) return;

        setReordering(true);
        const newOrder = [...itemsInCategory];
        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];

        try {
            await reorderMenuItems(newOrder);
        } catch (error) {
            console.error('Failed to reorder items:', error);
        } finally {
            setReordering(false);
        }
    };

    const handleItemMoveDown = async (item: MenuItem) => {
        const itemsInCategory = menuItems
            .filter(i => i.category === item.category)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        const currentIndex = itemsInCategory.findIndex(i => i.id === item.id);
        if (currentIndex >= itemsInCategory.length - 1) return;

        setReordering(true);
        const newOrder = [...itemsInCategory];
        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

        try {
            await reorderMenuItems(newOrder);
        } catch (error) {
            console.error('Failed to reorder items:', error);
        } finally {
            setReordering(false);
        }
    };

    // Reset items in category to alphabetical order
    const resetCategoryToAlphabetical = async (categoryId: string) => {
        const itemsInCategory = menuItems
            .filter(i => i.category === categoryId)
            .sort((a, b) => a.name.localeCompare(b.name));

        if (itemsInCategory.length === 0) return;

        setReordering(true);
        try {
            await reorderMenuItems(itemsInCategory);
        } catch (error) {
            console.error('Failed to reset order:', error);
        } finally {
            setReordering(false);
        }
    };

    const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
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
                            <h1 className="text-2xl font-playfair font-semibold text-black">Re-order Menu</h1>
                        </div>
                        {reordering && (
                            <div className="flex items-center space-x-2 text-gray-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                <span className="text-sm">Saving...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Categories Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-playfair font-medium text-black">Category Order</h2>
                        <p className="text-sm text-gray-500 mt-1">Drag categories to change the order they appear in the menu</p>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {sortedCategories.map((category, index) => (
                            <div
                                key={category.id}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2 text-gray-400">
                                        <GripVertical className="h-4 w-4" />
                                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            #{index + 1}
                                        </span>
                                    </div>
                                    <span className="text-2xl">{category.icon}</span>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                                        <p className="text-xs text-gray-500">
                                            {menuItems.filter(i => i.category === category.id).length} items
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handleCategoryMoveUp(category)}
                                        disabled={index === 0 || reordering}
                                        className={`p-2 rounded transition-all duration-200 ${index === 0 || reordering
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-500 hover:text-black hover:bg-gray-100'
                                            }`}
                                        title="Move up"
                                    >
                                        <ChevronUp className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleCategoryMoveDown(category)}
                                        disabled={index === sortedCategories.length - 1 || reordering}
                                        className={`p-2 rounded transition-all duration-200 ${index === sortedCategories.length - 1 || reordering
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-500 hover:text-black hover:bg-gray-100'
                                            }`}
                                        title="Move down"
                                    >
                                        <ChevronDown className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Menu Items Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-playfair font-medium text-black">Item Order by Category</h2>
                        <p className="text-sm text-gray-500 mt-1">Reorder items within each category</p>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {sortedCategories.map((category) => {
                            const categoryItems = menuItems
                                .filter(i => i.category === category.id)
                                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

                            const isExpanded = expandedCategories.has(category.id);

                            return (
                                <div key={category.id}>
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <ChevronRight
                                                className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                                                    }`}
                                            />
                                            <span className="text-xl">{category.icon}</span>
                                            <span className="font-medium text-gray-900">{category.name}</span>
                                            <span className="text-sm text-gray-500">({categoryItems.length} items)</span>
                                        </div>

                                        {isExpanded && categoryItems.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    resetCategoryToAlphabetical(category.id);
                                                }}
                                                disabled={reordering}
                                                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-black px-2 py-1 rounded hover:bg-gray-100 transition-colors duration-200"
                                                title="Reset to A-Z"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                                <span>A-Z</span>
                                            </button>
                                        )}
                                    </button>

                                    {/* Items List */}
                                    {isExpanded && (
                                        <div className="bg-gray-50 border-t border-gray-100">
                                            {categoryItems.length === 0 ? (
                                                <div className="px-12 py-6 text-center text-gray-500 text-sm">
                                                    No items in this category
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-100">
                                                    {categoryItems.map((item, index) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between px-6 py-3 hover:bg-gray-100 transition-colors duration-200"
                                                        >
                                                            <div className="flex items-center space-x-4">
                                                                <div className="flex items-center space-x-2">
                                                                    <GripVertical className="h-4 w-4 text-gray-300" />
                                                                    <span className="text-xs font-medium bg-white text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                                                                        #{index + 1}
                                                                    </span>
                                                                </div>

                                                                {item.image && (
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        className="w-10 h-10 rounded-lg object-cover"
                                                                    />
                                                                )}

                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                                                                    <p className="text-xs text-gray-500">₱{item.basePrice}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center space-x-1">
                                                                <button
                                                                    onClick={() => handleItemMoveUp(item)}
                                                                    disabled={index === 0 || reordering}
                                                                    className={`p-1.5 rounded transition-all duration-200 ${index === 0 || reordering
                                                                            ? 'text-gray-300 cursor-not-allowed'
                                                                            : 'text-gray-500 hover:text-black hover:bg-white'
                                                                        }`}
                                                                    title="Move up"
                                                                >
                                                                    <ChevronUp className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleItemMoveDown(item)}
                                                                    disabled={index === categoryItems.length - 1 || reordering}
                                                                    className={`p-1.5 rounded transition-all duration-200 ${index === categoryItems.length - 1 || reordering
                                                                            ? 'text-gray-300 cursor-not-allowed'
                                                                            : 'text-gray-500 hover:text-black hover:bg-white'
                                                                        }`}
                                                                    title="Move down"
                                                                >
                                                                    <ChevronDown className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReorderManager;
