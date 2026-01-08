import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Image as ImageIcon, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useBanners } from '../hooks/useBanners';
import { PromotionalBanner } from '../types';
import ImageUpload from './ImageUpload';

interface BannerManagerProps {
    onBack: () => void;
}

interface BannerFormData {
    title: string;
    description: string;
    image_url: string;
    link_url: string;
    active: boolean;
    start_date: string;
    end_date: string;
}

const BannerManager: React.FC<BannerManagerProps> = ({ onBack }) => {
    const { banners, loading, addBanner, updateBanner, deleteBanner, reorderBanners, toggleBannerActive } = useBanners();
    const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
    const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
    const [formData, setFormData] = useState<BannerFormData>({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        active: true,
        start_date: '',
        end_date: ''
    });

    const handleAddBanner = () => {
        setCurrentView('add');
        setFormData({
            title: '',
            description: '',
            image_url: '',
            link_url: '',
            active: true,
            start_date: '',
            end_date: ''
        });
    };

    const handleEditBanner = (banner: PromotionalBanner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            description: banner.description || '',
            image_url: banner.image_url,
            link_url: banner.link_url || '',
            active: banner.active,
            start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
            end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
        });
        setCurrentView('edit');
    };

    const handleDeleteBanner = async (id: string) => {
        if (confirm('Are you sure you want to delete this banner?')) {
            try {
                await deleteBanner(id);
            } catch (error) {
                alert('Failed to delete banner');
            }
        }
    };

    const handleSaveBanner = async () => {
        if (!formData.title || !formData.image_url) {
            alert('Please fill in title and upload an image');
            return;
        }

        try {
            const bannerData = {
                title: formData.title,
                description: formData.description || undefined,
                image_url: formData.image_url,
                link_url: formData.link_url || undefined,
                active: formData.active,
                sort_order: 0,
                start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined
            };

            if (editingBanner) {
                await updateBanner(editingBanner.id, bannerData);
            } else {
                await addBanner(bannerData);
            }
            setCurrentView('list');
            setEditingBanner(null);
        } catch (error) {
            alert('Failed to save banner');
        }
    };

    const handleCancel = () => {
        setCurrentView('list');
        setEditingBanner(null);
    };

    const handleToggleActive = async (banner: PromotionalBanner) => {
        try {
            await toggleBannerActive(banner.id, !banner.active);
        } catch (error) {
            alert('Failed to update banner status');
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newBanners = [...banners];
        [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
        try {
            await reorderBanners(newBanners);
        } catch (error) {
            alert('Failed to reorder banners');
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index === banners.length - 1) return;
        const newBanners = [...banners];
        [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
        try {
            await reorderBanners(newBanners);
        } catch (error) {
            alert('Failed to reorder banners');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading banners...</p>
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
                                    {currentView === 'add' ? 'Add New Banner' : 'Edit Banner'}
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
                                    onClick={handleSaveBanner}
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
                        <div className="grid grid-cols-1 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Banner Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Enter banner title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Enter banner description"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Banner Image *</label>
                                <ImageUpload
                                    currentImage={formData.image_url}
                                    onImageChange={(url) => setFormData({ ...formData, image_url: url || '' })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-black mb-2">Link URL (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.link_url}
                                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="https://example.com"
                                />
                                <p className="text-sm text-gray-500 mt-1">Where users go when they click the banner</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">Start Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="rounded border-gray-300 text-black focus:ring-black"
                                    />
                                    <span className="text-sm font-medium text-black">Active (visible to customers)</span>
                                </label>
                            </div>
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
                            <h1 className="text-2xl font-playfair font-semibold text-black">Promotional Banners</h1>
                        </div>
                        <button
                            onClick={handleAddBanner}
                            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add New Banner</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {banners.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Banners Yet</h3>
                        <p className="text-gray-500 mb-6">Create promotional banners to display on your homepage</p>
                        <button
                            onClick={handleAddBanner}
                            className="inline-flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Create Your First Banner</span>
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="space-y-4 p-6">
                            {banners.map((banner, index) => (
                                <div
                                    key={banner.id}
                                    className={`flex items-center space-x-4 p-4 border rounded-lg ${banner.active ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-75'
                                        }`}
                                >
                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={banner.image_url}
                                            alt={banner.title}
                                            className="w-32 h-20 object-cover rounded-lg"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="text-lg font-medium text-gray-900 truncate">{banner.title}</h3>
                                            {!banner.active && (
                                                <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">Inactive</span>
                                            )}
                                        </div>
                                        {banner.description && (
                                            <p className="text-sm text-gray-500 truncate">{banner.description}</p>
                                        )}
                                        {(banner.start_date || banner.end_date) && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {banner.start_date && `From: ${new Date(banner.start_date).toLocaleDateString()}`}
                                                {banner.start_date && banner.end_date && ' - '}
                                                {banner.end_date && `Until: ${new Date(banner.end_date).toLocaleDateString()}`}
                                            </p>
                                        )}
                                    </div>

                                    {/* Reorder Controls */}
                                    <div className="flex flex-col space-y-1">
                                        <button
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                            className="p-1 text-gray-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronUp className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === banners.length - 1}
                                            className="p-1 text-gray-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronDown className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleToggleActive(banner)}
                                            className={`p-2 rounded transition-colors duration-200 ${banner.active
                                                ? 'text-green-600 hover:bg-green-50'
                                                : 'text-gray-400 hover:bg-gray-100'
                                                }`}
                                            title={banner.active ? 'Deactivate' : 'Activate'}
                                        >
                                            {banner.active ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                        </button>
                                        <button
                                            onClick={() => handleEditBanner(banner)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBanner(banner.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BannerManager;
