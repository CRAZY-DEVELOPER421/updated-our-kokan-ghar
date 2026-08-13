'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';

const defaultProduct = {
  name: '', sku: '', price: '', mrp: '', stock_quantity: '', category_id: '',
  brand: '', weight_grams: '', unit: 'piece', description: '', short_description: '',
  region_origin: '', shelf_life_days: '', ingredients: '', storage_instructions: '',
  nutritional_info: '', meta_title: '', meta_description: '',
  is_active: 1, is_featured: 0, is_bestseller: 0, is_seasonal: 0, is_organic: 0,
  free_delivery: 1, delivery_estimate: '3-5 days'
};

// ── Section Header ───────────────────────────────────────
function Section({ title, icon, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition-all ${className}`}>
      <h2 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Char Count ───────────────────────────────────────────
function CharCount({ current, max }) {
  const pct = current / max;
  const color = pct > 0.9 ? 'text-rose-500' : pct > 0.7 ? 'text-amber-500' : 'text-slate-400';
  return <span className={`text-[10px] ${color} tabular-nums`}>{current}/{max}</span>;
}

// ── Toggle ───────────────────────────────────────────────
function Toggle({ value, onChange, label, desc }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-1.5">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {desc && <p className="text-[11px] text-slate-500">{desc}</p>}
      </div>
      <button type="button" onClick={onChange} className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${value ? 'translate-x-4' : ''}`} />
      </button>
    </label>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default function AdminProductEditPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = id;
  const isNew = productId === 'new';

  const [form, setForm] = useState(defaultProduct);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingImages, setPendingImages] = useState([]); // For new products (local images before save)
  const [newVariant, setNewVariant] = useState({ variant_name: '', variant_value: '', price_modifier: 0, stock_quantity: 0, sku_suffix: '' });
  const [editingVariant, setEditingVariant] = useState(null);
  const [pendingVariants, setPendingVariants] = useState([]); // For new products (staged until save)
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState({});
  const imageInputRef = useRef(null);

  // ── Combo / Bundle pack ────────────────────────────────
  const [productType, setProductType] = useState('single');
  const [bundleItems, setBundleItems] = useState([]); // { product_id, quantity, name, price, primary_image }
  const [bundleValidFrom, setBundleValidFrom] = useState('');
  const [bundleValidUntil, setBundleValidUntil] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Auto-open Combo / Bundle Pack when arriving from the Bundles page's
  // "Add Bundle" button (/products/new?type=combo)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('type') === 'combo') {
      setProductType('combo');
    }
  }, []);

  // Fetch product
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      if (isNew) return null;
      const res = await api.get(`/admin/products/${productId}`);
      return res.data.data.product;
    },
    enabled: !isNew,
  });

  // Fetch categories
  useEffect(() => {
    api.get('/admin/categories').then(res => {
      const cats = res.data.data?.categories || [];
      setCategories(cats);
      // Auto-select the combo category once loaded, if user chose combo — either by
      // clicking the toggle or arriving via "Add Bundle" (?type=combo)
      const wantsCombo = productType === 'combo'
        || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('type') === 'combo');
      if (wantsCombo && !form.category_id) {
        const comboCat = cats.find(c => c.slug === 'combo-bundles');
        if (comboCat) setForm(prev => ({ ...prev, category_id: String(comboCat.id) }));
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate form
  useEffect(() => {
    if (!productData) return;
    setForm({
      name: productData.name || '', sku: productData.sku || '', price: productData.price || '', mrp: productData.mrp || '',
      stock_quantity: productData.stock_quantity ?? '', category_id: productData.category_id || '',
      brand: productData.brand || '', weight_grams: productData.weight_grams ?? '', unit: productData.unit || 'piece',
      description: productData.description || '', short_description: productData.short_description || '',
      region_origin: productData.region_origin || '', shelf_life_days: productData.shelf_life_days ?? '',
      ingredients: productData.ingredients || '', storage_instructions: productData.storage_instructions || '',
      nutritional_info: productData.nutritional_info ? JSON.stringify(productData.nutritional_info) : '',
      meta_title: productData.meta_title || '', meta_description: productData.meta_description || '',
      is_active: productData.is_active ?? 1, is_featured: productData.is_featured ?? 0, is_bestseller: productData.is_bestseller ?? 0,
      is_seasonal: productData.is_seasonal ?? 0, is_organic: productData.is_organic ?? 0,
      free_delivery: productData.free_delivery ?? 1, delivery_estimate: productData.delivery_estimate || '3-5 days',
    });
    setImages(productData.images || []);
    setVariants(productData.variants || []);

    // Prefill combo/bundle data if this product is a combo pack
    if (productData.bundle) {
      setProductType('combo');
      setBundleItems((productData.bundle.products || []).map(p => ({
        product_id: p.product_id,
        quantity: p.quantity,
        name: p.name,
        price: p.price,
        primary_image: p.primary_image,
      })));
      setBundleValidFrom(toLocalInput(productData.bundle.valid_from));
      setBundleValidUntil(toLocalInput(productData.bundle.valid_until));
    } else {
      setProductType('single');
      setBundleItems([]);
    }
  }, [productData]);

  // Unsaved changes warning
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const toggleBool = (field) => {
    setForm(prev => ({ ...prev, [field]: prev[field] ? 0 : 1 }));
    setDirty(true);
  };

  // ── Combo helpers ───────────────────────────────────────
  const toLocalInput = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleTypeChange = (t) => {
    setProductType(t);
    setDirty(true);
    if (t === 'combo') {
      const comboCat = categories.find(c => c.slug === 'combo-bundles');
      if (comboCat && !form.category_id) {
        setForm(prev => ({ ...prev, category_id: String(comboCat.id) }));
      }
    }
  };

  // Debounced product search for the combo picker
  useEffect(() => {
    if (productType !== 'combo' || !productSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/admin/products', { params: { search: productSearch, limit: 8 } });
        const list = (res.data.data?.products || []).filter(p => !bundleItems.some(b => b.product_id === p.id));
        setSearchResults(list);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [productSearch, productType, bundleItems]);

  const addBundleItem = (p) => {
    if (bundleItems.some(b => b.product_id === p.id)) return;
    setBundleItems(prev => [...prev, { product_id: p.id, quantity: 1, name: p.name, price: p.price, primary_image: p.image }]);
    setProductSearch('');
    setDirty(true);
  };

  const updateBundleQty = (productId, quantity) => {
    setBundleItems(prev => prev.map(b => b.product_id === productId ? { ...b, quantity: Math.max(1, parseInt(quantity) || 1) } : b));
    setDirty(true);
  };

  const removeBundleItem = (productId) => {
    setBundleItems(prev => prev.filter(b => b.product_id !== productId));
    setDirty(true);
  };

  // ── Validation ─────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'Valid price is required';
    if (!form.mrp || parseFloat(form.mrp) <= 0) errs.mrp = 'Valid MRP is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.category_id) errs.category_id = 'Category is required';
    if (productType === 'combo' && bundleItems.length === 0) errs.bundle_items = 'Select at least one product for this combo';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price), mrp: parseFloat(form.mrp),
        stock_quantity: parseInt(form.stock_quantity) || 0,
        weight_grams: parseFloat(form.weight_grams) || null,
        shelf_life_days: parseInt(form.shelf_life_days) || null,
        nutritional_info: form.nutritional_info ? JSON.parse(form.nutritional_info) : null,
        product_type: productType,
        bundle_products: productType === 'combo' ? bundleItems.map(b => ({ product_id: b.product_id, quantity: b.quantity })) : undefined,
        bundle_valid_from: productType === 'combo' && bundleValidFrom ? bundleValidFrom.replace('T', ' ').slice(0, 19) : null,
        bundle_valid_until: productType === 'combo' && bundleValidUntil ? bundleValidUntil.replace('T', ' ').slice(0, 19) : null,
      };
      if (isNew) {
        const res = await api.post('/admin/products', payload);
        const newId = res.data.data.id;
        
        // Upload any pending images to the new product
        if (pendingImages.length > 0) {
          for (const imgUrl of pendingImages) {
            try {
              await api.post(`/admin/products/${newId}/images`, {
                image_url: imgUrl,
                alt_text: '',
                is_primary: 0
              });
            } catch (imgErr) {
              console.warn('Failed to upload image to new product:', imgErr);
            }
          }
          // Set first image as primary
          try {
            const imgRes = await api.get(`/admin/products/${newId}`);
            const firstImg = imgRes.data.data.product.images?.[0];
            if (firstImg) {
              await api.put(`/admin/products/${newId}/images/${firstImg.id}/primary`, {});
            }
          } catch (e) { /* ignore */ }
        }
        
        // Persist any staged variants to the newly created product
        if (pendingVariants.length > 0) {
          for (const v of pendingVariants) {
            try {
              await api.post(`/admin/products/${newId}/variants`, {
                variant_name: v.variant_name,
                variant_value: v.variant_value,
                price_modifier: v.price_modifier || 0,
                stock_quantity: v.stock_quantity || 0,
                sku_suffix: v.sku_suffix || null,
              });
            } catch (vErr) {
              console.warn('Failed to save variant for new product:', vErr);
            }
          }
        }
        
        toast.success('Product created!');
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        router.push(`/products/${newId}`);
      } else {
        await api.put(`/admin/products/${productId}`, payload);
        toast.success('Product updated!');
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      }
    } catch (err) {
      const backendMsg = err.response?.data?.message || '';
      const backendErrors = err.response?.data?.errors || err.response?.data?.data;
      let errorMsg = 'Failed to save product.';
      if (backendMsg) errorMsg = backendMsg;
      if (backendErrors && Array.isArray(backendErrors)) {
        errorMsg = backendErrors.map(e => e.field ? `${e.field}: ${e.message}` : e.message).join('; ');
      }
      toast.error(errorMsg);
    }
    setLoading(false);
  };

  // ── Image Management ────────────────────────────────────
  const handleImageUpload = async (file) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const imageUrl = uploadRes.data.data?.url || uploadRes.data.url;
      if (!imageUrl) { toast.error('Failed to get image URL from upload.'); setImageUploading(false); return; }
      
      if (isNew) {
        // New product: store image URL locally until product is created
        setPendingImages(prev => [...prev, imageUrl]);
        toast.success('Image added (will be saved with product)!');
      } else {
        // Existing product: upload directly to API
        const isFirstImage = images.length === 0;
        await api.post(`/admin/products/${productId}/images`, { image_url: imageUrl, alt_text: '', is_primary: isFirstImage });
        toast.success('Image uploaded!');
        const updated = await api.get(`/admin/products/${productId}`);
        setImages(updated.data.data.product.images || []);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to upload image.'); }
    setImageUploading(false);
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) { toast.error('Image URL is required.'); return; }
    if (isNew) {
      // New product: store image URL locally
      setPendingImages(prev => [...prev, newImageUrl]);
      setNewImageUrl('');
      toast.success('Image URL added (will be saved with product)!');
    } else {
      // Existing product: upload directly to API
      try {
        const isFirstImage = images.length === 0;
        await api.post(`/admin/products/${productId}/images`, { image_url: newImageUrl, alt_text: '', is_primary: isFirstImage });
        setNewImageUrl('');
        toast.success('Image added!');
        const updated = await api.get(`/admin/products/${productId}`);
        setImages(updated.data.data.product.images || []);
      } catch (err) { toast.error(err.response?.data?.message || 'Failed to add image.'); }
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.delete(`/admin/products/${productId}/images/${imageId}`);
      toast.success('Image deleted.');
      const updated = await api.get(`/admin/products/${productId}`);
      setImages(updated.data.data.product.images || []);
    } catch (err) { toast.error('Failed to delete image.'); }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await api.put(`/admin/products/${productId}/images/${imageId}/primary`, {});
      toast.success('Primary image updated.');
      const updated = await api.get(`/admin/products/${productId}`);
      setImages(updated.data.data.product.images || []);
    } catch (err) { toast.error('Failed to set primary image.'); }
  };

  // ── Variant Management ──────────────────────────────────
  const handleAddVariant = async () => {
    if (!newVariant.variant_name.trim() || !newVariant.variant_value.trim()) {
      toast.error('Variant name and value are required.'); return;
    }
    if (isNew) {
      // New product: stage locally until the product is created (product id needed to persist)
      setPendingVariants(prev => [...prev, { ...newVariant, tempId: Date.now() }]);
      setNewVariant({ variant_name: '', variant_value: '', price_modifier: 0, stock_quantity: 0, sku_suffix: '' });
      toast.success('Variant added (will be saved with product)!');
      setDirty(true);
      return;
    }
    try {
      await api.post(`/admin/products/${productId}/variants`, newVariant);
      setNewVariant({ variant_name: '', variant_value: '', price_modifier: 0, stock_quantity: 0, sku_suffix: '' });
      toast.success('Variant added!');
      const updated = await api.get(`/admin/products/${productId}`);
      setVariants(updated.data.data.product.variants || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add variant.'); }
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant) return;
    try {
      await api.put(`/admin/products/${productId}/variants/${editingVariant.id}`, editingVariant);
      setEditingVariant(null);
      toast.success('Variant updated!');
      const updated = await api.get(`/admin/products/${productId}`);
      setVariants(updated.data.data.product.variants || []);
    } catch (err) { toast.error('Failed to update variant.'); }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('Delete this variant?')) return;
    if (isNew) {
      // Staged variant — just drop it from the local list
      setPendingVariants(prev => prev.filter(v => v.tempId !== variantId));
      setDirty(true);
      toast.success('Variant removed.');
      return;
    }
    try {
      await api.delete(`/admin/products/${productId}/variants/${variantId}`);
      toast.success('Variant deleted.');
      const updated = await api.get(`/admin/products/${productId}`);
      setVariants(updated.data.data.product.variants || []);
    } catch (err) { toast.error('Failed to delete variant.'); }
  };

  // ── Classes ─────────────────────────────────────────────
  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white placeholder:text-slate-400";
  const errInputClass = "w-full border border-rose-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all bg-white";
  const labelClass = "block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider";
  const units = ['piece', 'kg', 'g', 'pack', 'box', 'dozen', 'bottle', 'jar', 'carton', 'set', 'bag', 'hamper', 'liter', 'ml'];
  
  // Unit configuration: defines measurement type per unit
  const unitConfig = {
    kg: { type: 'weight', label: 'Weight (grams)', placeholder: 'e.g. 500', suffix: 'g' },
    g: { type: 'weight', label: 'Weight (grams)', placeholder: 'e.g. 200', suffix: 'g' },
    liter: { type: 'volume', label: 'Volume (ml)', placeholder: 'e.g. 1000', suffix: 'ml' },
    ml: { type: 'volume', label: 'Volume (ml)', placeholder: 'e.g. 500', suffix: 'ml' },
    piece: { type: 'quantity', label: 'Quantity per unit', placeholder: 'e.g. 1', suffix: 'pcs' },
    pack: { type: 'quantity', label: 'Quantity per pack', placeholder: 'e.g. 6', suffix: 'pcs' },
    box: { type: 'quantity', label: 'Quantity per box', placeholder: 'e.g. 12', suffix: 'pcs' },
    dozen: { type: 'quantity', label: 'Quantity (dozen)', placeholder: 'e.g. 1', suffix: 'doz' },
    bottle: { type: 'quantity', label: 'Quantity per bottle', placeholder: 'e.g. 1', suffix: 'bottle' },
    jar: { type: 'quantity', label: 'Quantity per jar', placeholder: 'e.g. 1', suffix: 'jar' },
    carton: { type: 'quantity', label: 'Quantity per carton', placeholder: 'e.g. 20', suffix: 'pcs' },
    set: { type: 'quantity', label: 'Quantity per set', placeholder: 'e.g. 1', suffix: 'set' },
    bag: { type: 'quantity', label: 'Quantity per bag', placeholder: 'e.g. 1', suffix: 'bag' },
    hamper: { type: 'quantity', label: 'Quantity per hamper', placeholder: 'e.g. 1', suffix: 'hamper' },
  };

  if (!isNew && productLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-40 h-8 mb-1" /><Skeleton className="w-32 h-4" /></div>
          <div className="flex gap-2"><Skeleton className="w-20 h-9 rounded-lg" /><Skeleton className="w-28 h-9 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-5">
                <Skeleton className="w-28 h-4 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 rounded-lg" /><Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" /><Skeleton className="h-10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-5">
                <Skeleton className="w-24 h-4 mb-4" />
                <Skeleton className="h-6 rounded-full mb-2" /><Skeleton className="h-6 rounded-full mb-2" /><Skeleton className="h-6 rounded-full mb-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm -mx-4 px-4 py-3 -mt-4 mb-0 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{isNew ? 'Add Product' : 'Edit Product'}</h1>
            {dirty && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Unsaved changes</span>}
          </div>
          {!isNew && productData && <p className="text-xs text-slate-500 mt-0.5">ID: {productData.id} • SKU: {productData.sku}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { if (!dirty || confirm('Discard unsaved changes?')) router.push('/products'); }}>Cancel</Button>
          <Button size="sm" onClick={handleSave} loading={loading}>{isNew ? 'Create Product' : 'Save Changes'}</Button>
        </div>
      </div>

      {/* Product Type selector */}
      <Section title="Product Type" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('single')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${productType === 'single' ? 'border-emerald-500 bg-emerald-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${productType === 'single' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Single Product</p>
              <p className="text-[11px] text-slate-500 mt-0.5">A standalone product sold individually</p>
            </div>
            {productType === 'single' && (
              <span className="ml-auto shrink-0 text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('combo')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${productType === 'combo' ? 'border-purple-500 bg-purple-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${productType === 'combo' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Combo / Bundle Pack</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Combine multiple products at a special price</p>
            </div>
            {productType === 'combo' && (
              <span className="ml-auto shrink-0 text-purple-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            )}
          </button>
        </div>
        {productType === 'combo' && (
          <p className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg mt-3 leading-relaxed">
            Combo packs appear in the <strong>Bundle Deals</strong> section on the Offers page. Pricing fields below act as the combo deal price (Selling Price) and the combined MRP.
          </p>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── LEFT COLUMN ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Section title="Basic Details" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Product Name *</label>
                <input className={errors.name ? errInputClass : inputClass} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Devgad Alphonso Mango" />
                {errors.name && <p className="text-[11px] text-rose-500 mt-0.5">{errors.name}</p>}
              </div>
              <div>
                <label className={labelClass}>SKU *</label>
                <input className={errors.sku ? errInputClass : inputClass} value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="e.g. MAN-ALP-001" />
                {errors.sku && <p className="text-[11px] text-rose-500 mt-0.5">{errors.sku}</p>}
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <select className={errors.category_id ? errInputClass : inputClass} value={form.category_id} onChange={e => updateField('category_id', e.target.value)}>
                  <option value="">Select category...</option>
                  {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
                {errors.category_id && <p className="text-[11px] text-rose-500 mt-0.5">{errors.category_id}</p>}
              </div>
              <div>
                <label className={labelClass}>Brand</label>
                <input className={inputClass} value={form.brand} onChange={e => updateField('brand', e.target.value)} placeholder="e.g. Konkan Heritage" />
              </div>
              <div>
                <label className={labelClass}>Region / Origin</label>
                <input className={inputClass} value={form.region_origin} onChange={e => updateField('region_origin', e.target.value)} placeholder="e.g. Devgad, Sindhudurg" />
              </div>
              <div>
                <label className={labelClass}>Unit</label>
                <select className={inputClass} value={form.unit} onChange={e => updateField('unit', e.target.value)}>
                  {units.map(u => (<option key={u} value={u}>{u}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{unitConfig[form.unit]?.label || 'Weight (grams)'}</label>
                <div className="relative">
                  <input type="number" step="0.01" className={`${inputClass} pr-10`} value={form.weight_grams} onChange={e => updateField('weight_grams', e.target.value)} placeholder={unitConfig[form.unit]?.placeholder || 'e.g. 500'} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">{unitConfig[form.unit]?.suffix || 'g'}</span>
                </div>
              </div>
              <div>
                <label className={labelClass}>Shelf Life (days)</label>
                <input type="number" className={inputClass} value={form.shelf_life_days} onChange={e => updateField('shelf_life_days', e.target.value)} placeholder="e.g. 365" />
              </div>
            </div>
          </Section>

          {/* Combo Pack Details (only for combo) */}
          {productType === 'combo' && (
            <Section title="Combo Pack Details" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}>
              <div className="space-y-4">
                {/* Product picker */}
                <div>
                  <label className={labelClass}>Products in this Combo *</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input
                      className={`${inputClass} pl-9`}
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Search products to add to this combo..."
                    />
                    {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                      {searchResults.map(p => (
                        <button key={p.id} type="button" onClick={() => addBundleItem(p)} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-emerald-50 transition-colors text-left">
                          <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                            {p.image ? (
                              <img src={getImageUrl(p.image)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500">₹{Number(p.price).toLocaleString('en-IN')}</p>
                          </div>
                          <span className="text-[11px] font-medium text-emerald-600 shrink-0">+ Add</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {productSearch && !searching && searchResults.length === 0 && (
                    <p className="text-[11px] text-slate-400 mt-1.5">No matching products found.</p>
                  )}
                </div>

                {/* Selected items */}
                {bundleItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Selected ({bundleItems.length})</p>
                    {bundleItems.map(item => (
                      <div key={item.product_id} className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500">₹{Number(item.price).toLocaleString('en-IN')} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => updateBundleQty(item.product_id, item.quantity - 1)} className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors">−</button>
                          <span className="w-8 text-center text-xs font-semibold text-slate-900 tabular-nums">{item.quantity}</span>
                          <button type="button" onClick={() => updateBundleQty(item.product_id, item.quantity + 1)} className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors">+</button>
                        </div>
                        <button type="button" onClick={() => removeBundleItem(item.product_id)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Remove">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.bundle_items && <p className="text-[11px] text-rose-500 mt-0.5">{errors.bundle_items}</p>}

                {/* Validity window */}
                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100">
                  <div>
                    <label className={labelClass}>Valid From</label>
                    <input type="datetime-local" className={inputClass} value={bundleValidFrom} onChange={e => { setBundleValidFrom(e.target.value); setDirty(true); }} />
                  </div>
                  <div>
                    <label className={labelClass}>Valid Until</label>
                    <input type="datetime-local" className={inputClass} value={bundleValidUntil} onChange={e => { setBundleValidUntil(e.target.value); setDirty(true); }} />
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Pricing & Stock */}
          <Section title="Pricing & Stock" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Selling Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                  <input type="number" step="0.01" className={`${errors.price ? errInputClass : inputClass} pl-7`} value={form.price} onChange={e => updateField('price', e.target.value)} placeholder="1899" />
                </div>
                {errors.price && <p className="text-[11px] text-rose-500 mt-0.5">{errors.price}</p>}
              </div>
              <div>
                <label className={labelClass}>MRP *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                  <input type="number" step="0.01" className={`${errors.mrp ? errInputClass : inputClass} pl-7`} value={form.mrp} onChange={e => updateField('mrp', e.target.value)} placeholder="2499" />
                </div>
                {errors.mrp && <p className="text-[11px] text-rose-500 mt-0.5">{errors.mrp}</p>}
              </div>
              <div>
                <label className={labelClass}>Stock Quantity</label>
                <input type="number" className={inputClass} value={form.stock_quantity} onChange={e => updateField('stock_quantity', e.target.value)} placeholder="e.g. 200" />
              </div>
            </div>
            {form.price && form.mrp && parseFloat(form.mrp) > parseFloat(form.price) && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  {Math.round(((parseFloat(form.mrp) - parseFloat(form.price)) / parseFloat(form.mrp)) * 100)}% OFF
                </span>
                <span className="text-slate-500">You save ₹{Number(parseFloat(form.mrp) - parseFloat(form.price)).toLocaleString('en-IN')}</span>
              </div>
            )}
          </Section>

          {/* Description */}
          <Section title="Description" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Short Description</label>
                  <CharCount current={form.short_description?.length || 0} max={500} />
                </div>
                <textarea className={`${inputClass} resize-none h-20`} maxLength={500} value={form.short_description} onChange={e => updateField('short_description', e.target.value)} placeholder="Brief product description..." />
              </div>
              <div>
                <label className={labelClass}>Full Description</label>
                <textarea className={`${inputClass} resize-none h-36`} value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Detailed product description with features, benefits, and usage..." />
              </div>
            </div>
          </Section>

          {/* Ingredients & Storage */}
          <Section title="Ingredients & Storage" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Ingredients</label>
                <textarea className={`${inputClass} resize-none h-20`} value={form.ingredients} onChange={e => updateField('ingredients', e.target.value)} placeholder="List of ingredients..." />
              </div>
              <div>
                <label className={labelClass}>Storage Instructions</label>
                <textarea className={`${inputClass} resize-none h-20`} value={form.storage_instructions} onChange={e => updateField('storage_instructions', e.target.value)} placeholder="How to store this product..." />
              </div>
              <div>
                <label className={labelClass}>Nutritional Info (JSON)</label>
                <textarea className={`${inputClass} resize-none h-24 font-mono text-xs`} value={form.nutritional_info} onChange={e => updateField('nutritional_info', e.target.value)} placeholder='{"calories": 150, "serving_size": "100g"}' />
              </div>
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Meta Title</label>
                  <CharCount current={form.meta_title?.length || 0} max={60} />
                </div>
                <input className={inputClass} maxLength={60} value={form.meta_title} onChange={e => updateField('meta_title', e.target.value)} placeholder="SEO title..." />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Meta Description</label>
                  <CharCount current={form.meta_description?.length || 0} max={160} />
                </div>
                <textarea className={`${inputClass} resize-none h-20`} maxLength={160} value={form.meta_description} onChange={e => updateField('meta_description', e.target.value)} placeholder="SEO description..." />
              </div>

            </div>
          </Section>
        </div>

        {/* ─── RIGHT COLUMN ────────────────────────────── */}
        <div className="space-y-6">
          {/* Status Toggles */}
          <Section title="Status & Labels" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <div className="space-y-1">
              <Toggle value={form.is_active} onChange={() => toggleBool('is_active')} label="Active" desc="Visible on the storefront" />
              <Toggle value={form.is_featured} onChange={() => toggleBool('is_featured')} label="Featured" desc="Show in featured section" />
              <Toggle value={form.is_bestseller} onChange={() => toggleBool('is_bestseller')} label="Bestseller" desc="Mark as best-selling" />
              <Toggle value={form.is_seasonal} onChange={() => toggleBool('is_seasonal')} label="Seasonal" desc="Seasonal / limited-time" />
              <Toggle value={form.is_organic} onChange={() => toggleBool('is_organic')} label="Organic" desc="Certified organic product" />
            </div>
          </Section>

          {/* Delivery */}
          <Section title="Delivery" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>}>
            <Toggle value={form.free_delivery} onChange={() => toggleBool('free_delivery')} label="Free Delivery" desc="Shows 'Free delivery' on the product card" />
            <div className="pt-2.5">
              <label className={labelClass}>Delivery Time</label>
              <select className={inputClass} value={form.delivery_estimate} onChange={e => updateField('delivery_estimate', e.target.value)}>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="2-3 days">2-3 days</option>
                <option value="3-5 days">3-5 days</option>
                <option value="5-7 days">5-7 days</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Shown on the product card as "Get it by …"</p>
            </div>
          </Section>

          {/* Images */}
          <Section title={`Images (${images.length})`} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {images.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                    <img src={getImageUrl(img.image_url)} alt={img.alt_text || ''} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      {!img.is_primary && <button onClick={() => handleSetPrimary(img.id)} className="p-1.5 bg-white/90 rounded-lg text-xs hover:bg-white" title="Set as primary">★</button>}
                      <button onClick={() => handleDeleteImage(img.id)} className="p-1.5 bg-rose-500/90 text-white rounded-lg text-xs hover:bg-rose-600" title="Delete">✕</button>
                    </div>
                    {img.is_primary && <span className="absolute top-1 left-1 text-[10px] font-semibold bg-emerald-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">Primary</span>}
                  </div>
                ))}
              </div>
            )}
            {images.length === 0 && pendingImages.length === 0 && <p className="text-xs text-slate-400 mb-3 text-center py-4 bg-slate-50 rounded-lg">No images yet. Add at least one image.</p>}

            {/* Show pending images for new products */}
            {isNew && pendingImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {pendingImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                    <img src={getImageUrl(imgUrl)} alt="" className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button onClick={() => {
                        setPendingImages(prev => prev.filter((_, i) => i !== idx));
                      }} className="p-1.5 bg-rose-500/90 text-white rounded-lg text-xs hover:bg-rose-600" title="Delete">✕</button>
                    </div>
                    {idx === 0 && <span className="absolute top-1 left-1 text-[10px] font-semibold bg-emerald-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">Primary</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageUpload(f); }}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}`}
                onClick={() => imageInputRef.current?.click()}
              >
                {imageUploading ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    <svg className="w-8 h-8 mx-auto mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs">Drop image here or click to browse</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 10MB</p>
                  </div>
                )}
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
              </div>
              <div className="flex gap-2">
                <input className={`${inputClass} flex-1 text-xs`} value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="Or paste image URL..." />
                <Button size="sm" onClick={handleAddImage}>Add</Button>
              </div>
            </div>
          </Section>

          {/* Variants */}
          <Section title={`Variants (${isNew ? pendingVariants.length : variants.length})`} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Options customers pick on the product page — e.g. <strong>Size / Weight / Pack</strong> (1kg, 500g). Each variant can have its own price difference and stock.
            </p>

            {/* Staged variants for a NEW product (persisted after creation) */}
            {isNew && pendingVariants.length > 0 && (
              <div className="space-y-2 mb-4">
                {pendingVariants.map((v) => (
                  <div key={v.tempId} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">{v.variant_name}</span>
                      <span className="text-xs text-slate-900 font-medium truncate">{v.variant_value}</span>
                      {v.price_modifier > 0 && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">+₹{v.price_modifier}</span>}
                      <span className="text-[10px] text-slate-500">Stock: {v.stock_quantity}</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteVariant(v.tempId)} className="text-[10px] font-medium text-rose-500 hover:bg-rose-50 px-1.5 py-1 rounded transition-all shrink-0">Remove</button>
                  </div>
                ))}
              </div>
            )}

            {!isNew && variants.length > 0 && (
              <div className="space-y-2 mb-4">
                {variants.map((v) => (
                  <div key={v.id} className="text-sm bg-slate-50 rounded-lg overflow-hidden">
                    {editingVariant?.id === v.id ? (
                      <div className="p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input className="border border-slate-200 rounded px-2 py-1.5 text-xs" value={editingVariant.variant_name} onChange={e => setEditingVariant({...editingVariant, variant_name: e.target.value})} placeholder="Name" />
                          <input className="border border-slate-200 rounded px-2 py-1.5 text-xs" value={editingVariant.variant_value} onChange={e => setEditingVariant({...editingVariant, variant_value: e.target.value})} placeholder="Value" />
                          <input className="border border-slate-200 rounded px-2 py-1.5 text-xs" type="number" value={editingVariant.price_modifier} onChange={e => setEditingVariant({...editingVariant, price_modifier: parseFloat(e.target.value) || 0})} placeholder="+₹" />
                          <input className="border border-slate-200 rounded px-2 py-1.5 text-xs" type="number" value={editingVariant.stock_quantity} onChange={e => setEditingVariant({...editingVariant, stock_quantity: parseInt(e.target.value) || 0})} placeholder="Stock" />
                        </div>
                        <div className="flex gap-1 justify-end">
                          <button onClick={handleUpdateVariant} className="text-xs font-medium text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-all">Save</button>
                          <button onClick={() => setEditingVariant(null)} className="text-xs font-medium text-slate-500 hover:bg-slate-100 px-2 py-1 rounded transition-all">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">{v.variant_name}</span>
                          <span className="text-xs text-slate-900 font-medium">{v.variant_value}</span>
                          {v.price_modifier > 0 && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">+₹{v.price_modifier}</span>}
                          <span className="text-[10px] text-slate-500">Stock: {v.stock_quantity}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingVariant({...v})} className="text-[10px] font-medium text-emerald-600 hover:bg-emerald-50 px-1.5 py-1 rounded transition-all">Edit</button>
                          <button onClick={() => handleDeleteVariant(v.id)} className="text-[10px] font-medium text-rose-500 hover:bg-rose-50 px-1.5 py-1 rounded transition-all">Del</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Add Variant</p>
              <div className="grid grid-cols-2 gap-2">
                <input className={`${inputClass} text-xs`} value={newVariant.variant_name} onChange={e => setNewVariant({...newVariant, variant_name: e.target.value})} placeholder="e.g. Size / Weight" />
                <input className={`${inputClass} text-xs`} value={newVariant.variant_value} onChange={e => setNewVariant({...newVariant, variant_value: e.target.value})} placeholder="e.g. 1kg" />
                <input className={`${inputClass} text-xs`} type="number" value={newVariant.price_modifier} onChange={e => setNewVariant({...newVariant, price_modifier: parseFloat(e.target.value) || 0})} placeholder="Price diff (+₹ or -₹)" />
                <input className={`${inputClass} text-xs`} type="number" value={newVariant.stock_quantity} onChange={e => setNewVariant({...newVariant, stock_quantity: parseInt(e.target.value) || 0})} placeholder="Variant stock" />
              </div>
              <Button size="sm" className="w-full mt-1" onClick={handleAddVariant}>Add Variant</Button>
              {isNew && <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg">Variants added here are saved automatically after the product is created.</p>}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
