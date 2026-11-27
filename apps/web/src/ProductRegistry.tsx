import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from './lib/api';
import { ArrowLeft, ArrowRight, Boxes, Factory, Plus, RefreshCw, Search, X } from 'lucide-react';

type Category = { _id: string; name: string; key: string; metadataFields: Array<{ key: string; label: string; type: string; required: boolean; options: string[] }> };
type Product = {
  _id: string; identifier: string; name: string; description: string; sku?: string; gtin?: string;
  status: 'draft' | 'active' | 'discontinued' | 'recalled';
  categoryId: { _id: string; name: string } | string;
  manufacturer: { name: string; countryCode?: string | null };
  suppliers: Array<{ name: string; role: string; countryCode?: string | null }>;
  materials: Array<{ name: string; materialType: string; massGrams: number; recycledContentPercent: number }>;
  createdAt: string; updatedAt: string;
};
type PageInfo = { page: number; limit: number; total: number; pages: number };
const emptyPage: PageInfo = { page: 1, limit: 20, total: 0, pages: 0 };

export default function ProductRegistry({ role }: { role: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PageInfo>(emptyPage);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [gtin, setGtin] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  const loadCategories = useCallback(async () => {
    const result = await apiRequest<{ categories: Category[] }>('/products/categories');
    setCategories(result.categories);
    setCategoryId(current => current || result.categories[0]?._id || '');
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12', sort: 'createdAt', order: 'desc' });
      if (query.trim()) params.set('q', query.trim());
      if (status) params.set('status', status);
      const result = await apiRequest<{ products: Product[]; pagination: PageInfo }>('/products?' + params.toString());
      setProducts(result.products);
      setPagination(result.pagination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load product records.');
    } finally { setLoading(false); }
  }, [page, query, status]);

  useEffect(() => { loadCategories().catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load categories.')); }, [loadCategories]);
  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const createProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryId) { setError('Create or select a product category first.'); return; }
    setBusy(true); setError('');
    try {
      await apiRequest<{ product: Product }>('/products', { method: 'POST', body: JSON.stringify({
        name, description, categoryId, sku: sku || undefined, gtin: gtin || undefined,
        manufacturer: { name: manufacturer, countryCode: countryCode || undefined },
        suppliers: [], materials: [], customAttributes: {},
      }) });
      setName(''); setDescription(''); setSku(''); setGtin(''); setManufacturer(''); setCountryCode('');
      setShowCreate(false); setPage(1); await loadProducts();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create product.'); }
    finally { setBusy(false); }
  };

  const createCategory = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await apiRequest<{ category: Category }>('/products/categories', { method: 'POST', body: JSON.stringify({ name: categoryName, description: categoryDescription, metadataFields: [] }) });
      setCategories(current => [...current, result.category].sort((a,b) => a.name.localeCompare(b.name)));
      setCategoryId(result.category._id); setCategoryName(''); setCategoryDescription(''); setShowCategory(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create category.'); }
    finally { setBusy(false); }
  };

  const changeStatus = async (product: Product, nextStatus: Product['status']) => {
    setBusy(true); setError('');
    try {
      const result = await apiRequest<{ product: Product }>('/products/' + encodeURIComponent(product.identifier), { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      setProducts(current => current.map(item => item.identifier === product.identifier ? result.product : item));
      if (selected?.identifier === product.identifier) setSelected(result.product);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update product status.'); }
    finally { setBusy(false); }
  };

  const canConfigure = role === 'owner' || role === 'admin';
  const categoryLabel = (product: Product) => typeof product.categoryId === 'object' ? product.categoryId.name : 'Product category';
  return <div className="registry-page">
    <div className="registry-heading"><div><span className="eyebrow">PRODUCT INTELLIGENCE</span><h1>Product registry</h1><p>Manage organization-owned product identities and their core provenance data.</p></div><div className="registry-actions"><button className="subtle-button" onClick={() => void loadProducts()}><RefreshCw size={14}/> Refresh</button><button className="primary-button" onClick={() => { setError(''); setShowCreate(true); }}><Plus size={15}/> Register product</button></div></div>
    <div className="registry-stats"><div><span>Registered products</span><strong>{pagination.total.toLocaleString()}</strong></div><div><span>Categories</span><strong>{categories.length}</strong></div><div><span>Current workspace</span><strong>Tenant-scoped</strong></div></div>
    {error && <div className="registry-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={14}/></button></div>}
    {showCreate && <form className="registry-form panel" onSubmit={createProduct}>
      <div className="panel-heading"><div><h3>Register a product</h3><p>A unique CircuTrace identifier will be allocated automatically.</p></div><button type="button" className="close-button" onClick={() => setShowCreate(false)} aria-label="Close"><X size={17}/></button></div>
      <div className="registry-form-grid">
        <label>Product name<input required minLength={2} maxLength={160} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Recycled aluminium bottle"/></label>
        <label>Category<select required value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Select category</option>{categories.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
        <label>SKU (optional)<input value={sku} onChange={e => setSku(e.target.value)} maxLength={64} placeholder="Internal stock code"/></label>
        <label>GTIN (optional)<input value={gtin} onChange={e => setGtin(e.target.value)} inputMode="numeric" placeholder="8, 12, 13 or 14 digits"/></label>
        <label>Manufacturer<input required minLength={2} value={manufacturer} onChange={e => setManufacturer(e.target.value)} placeholder="Legal manufacturer name"/></label>
        <label>Manufacturer country code<input value={countryCode} onChange={e => setCountryCode(e.target.value.toUpperCase())} maxLength={2} placeholder="e.g. IN"/></label>
        <label className="registry-wide">Description<textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={3} placeholder="Product purpose, model, distinguishing details…"/></label>
      </div>
      {categories.length === 0 && <p className="registry-hint">No categories exist yet. An owner or administrator must create one before registering products.</p>}
      <div className="registry-form-footer"><span>New records start in Draft status.</span><button className="primary-button" disabled={busy || categories.length === 0}>{busy ? 'Saving…' : 'Create product'}</button></div>
    </form>}
    {showCategory && <form className="registry-form panel" onSubmit={createCategory}><div className="panel-heading"><div><h3>Create product category</h3><p>Category metadata can be configured as a separate step.</p></div><button type="button" className="close-button" onClick={() => setShowCategory(false)} aria-label="Close"><X size={17}/></button></div><div className="registry-form-grid"><label>Category name<input required minLength={2} maxLength={80} value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="e.g. Consumer electronics"/></label><label>Category description<input maxLength={500} value={categoryDescription} onChange={e => setCategoryDescription(e.target.value)} placeholder="What products belong here?"/></label></div><div className="registry-form-footer"><span>Only workspace owners and administrators can configure categories.</span><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Create category'}</button></div></form>}
    <div className="registry-toolbar"><div className="registry-search"><Search size={16}/><input aria-label="Search products" placeholder="Search name, identifier, SKU, GTIN or manufacturer…" value={query} onChange={e => { setPage(1); setQuery(e.target.value); }}/></div><select aria-label="Filter by status" value={status} onChange={e => { setPage(1); setStatus(e.target.value); }}><option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="discontinued">Discontinued</option><option value="recalled">Recalled</option></select>{canConfigure && <button className="subtle-button" onClick={() => { setError(''); setShowCategory(value => !value); }}><Boxes size={14}/> New category</button>}</div>
    <div className="panel registry-table-panel"><div className="registry-table-heading"><div><h3>Product records</h3><p>Records visible to your active organization only</p></div><span className="registry-count">{pagination.total} total</span></div>
      {loading ? <div className="registry-empty">Loading product records…</div> : products.length === 0 ? <div className="registry-empty"><PackageSearchFallback/><strong>No products found</strong><span>Register your first product or adjust the search filters.</span></div> : <div className="registry-table-wrap"><table className="registry-table"><thead><tr><th>Product identity</th><th>Category</th><th>Manufacturer</th><th>Status</th><th>Created</th><th/></tr></thead><tbody>{products.map(product => <tr key={product.identifier} onClick={() => setSelected(product)} className={selected?.identifier === product.identifier ? 'selected' : ''}><td><strong>{product.name}</strong><small>{product.identifier}{product.sku ? ' · SKU ' + product.sku : ''}</small></td><td>{categoryLabel(product)}</td><td>{product.manufacturer.name}<small>{product.manufacturer.countryCode || 'Country not set'}</small></td><td><span className={'product-status ' + product.status}>{product.status}</span></td><td>{new Date(product.createdAt).toLocaleDateString()}</td><td><ArrowRight size={15}/></td></tr>)}</tbody></table></div>}
      <div className="registry-pagination"><span>Page {pagination.page} of {Math.max(1,pagination.pages)}</span><div><button className="subtle-button" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}><ArrowLeft size={13}/> Previous</button><button className="subtle-button" disabled={page >= pagination.pages || loading} onClick={() => setPage(value => value + 1)}>Next <ArrowRight size={13}/></button></div></div>
    </div>
    {selected && <aside className="product-detail panel"><div className="panel-heading"><div><span className="eyebrow">PRODUCT DETAILS</span><h3>{selected.name}</h3><p>{selected.identifier}</p></div><button className="close-button" onClick={() => setSelected(null)} aria-label="Close product details"><X size={17}/></button></div><p className="product-description">{selected.description || 'No description supplied.'}</p><div className="product-detail-grid"><div><small>Manufacturer</small><strong>{selected.manufacturer.name}</strong></div><div><small>Category</small><strong>{categoryLabel(selected)}</strong></div><div><small>SKU</small><strong>{selected.sku || 'Not assigned'}</strong></div><div><small>GTIN</small><strong>{selected.gtin || 'Not assigned'}</strong></div><div><small>Suppliers</small><strong>{selected.suppliers.length}</strong></div><div><small>Material entries</small><strong>{selected.materials.length}</strong></div></div><div className="product-detail-status"><label>Product status<select disabled={busy || selected.status === 'recalled'} value={selected.status} onChange={e => void changeStatus(selected, e.target.value as Product['status'])}><option value="draft">Draft</option><option value="active">Active</option><option value="discontinued">Discontinued</option><option value="recalled">Recalled</option></select></label><span>Transitions are validated by the API and recorded in the organization audit log.</span></div></aside>}
    <div className="registry-footnote"><Factory size={14}/> Product identifiers and records are isolated by organization. Evidence files and public passport publishing are planned for later milestones.</div>
  </div>;
}

function PackageSearchFallback() {
  return <span className="registry-empty-icon"><Boxes size={24}/></span>;
}
