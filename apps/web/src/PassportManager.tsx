import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from './lib/api';
import './passport.css';
import { Copy, ExternalLink, Globe2, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';

type Product = { identifier: string; name: string; status: string };
type Sections = { identity: boolean; manufacturer: boolean; materials: boolean; lifecycle: boolean };
type Passport = { publicSlug: string; status: 'published' | 'revoked'; sections: Sections; publishedAt: string; updatedAt: string; revokedAt?: string | null };
const defaults: Sections = { identity: true, manufacturer: true, materials: false, lifecycle: true };
const sectionLabels: Array<{ key: keyof Sections; label: string; detail: string }> = [
  { key: 'identity', label: 'Product identity', detail: 'Identifier, product name, description and category' },
  { key: 'manufacturer', label: 'Manufacturer', detail: 'Manufacturer name and supplied registration details' },
  { key: 'materials', label: 'Materials', detail: 'Material composition, mass and recycled content' },
  { key: 'lifecycle', label: 'Lifecycle history', detail: 'Up to 200 reported product lifecycle events' },
];

export default function PassportManager({ role }: { role: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [passport, setPassport] = useState<Passport | null>(null);
  const [sections, setSections] = useState<Sections>(defaults);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);
  const canPublish = role === 'owner' || role === 'admin';
  const publicUrl = passport?.publicSlug ? `${window.location.origin}/passport/${passport.publicSlug}` : '';

  const loadProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await apiRequest<{ products: Product[] }>('/products?limit=100&sort=name&order=asc');
      setProducts(result.products);
      setIdentifier(current => current || result.products[0]?.identifier || '');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load products.'); }
    finally { setLoading(false); }
  }, []);

  const loadPassport = useCallback(async () => {
    if (!identifier) { setPassport(null); setSections(defaults); return; }
    setError(''); setNotice('');
    try {
      const result = await apiRequest<{ passport: Passport | null }>('/passports/manage/' + encodeURIComponent(identifier));
      setPassport(result.passport);
      setSections(result.passport?.sections ?? defaults);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load passport settings.'); }
  }, [identifier]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => { void loadPassport(); }, [loadPassport]);

  const save = async (action: 'publish' | 'update' | 'revoke') => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await apiRequest<{ passport: Passport }>(
        '/passports/manage/' + encodeURIComponent(identifier) + (action === 'publish' ? '/publish' : action === 'revoke' ? '/revoke' : ''),
        { method: action === 'update' ? 'PATCH' : 'POST', ...(action === 'revoke' ? {} : { body: JSON.stringify({ sections }) }) },
      );
      setPassport(result.passport);
      setSections(result.passport.sections);
      setEditing(false);
      setNotice(action === 'revoke' ? 'Public access has been revoked.' : action === 'publish' ? 'Passport published successfully.' : 'Public sections updated.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update the public passport.'); }
    finally { setBusy(false); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(publicUrl); setNotice('Public passport link copied.'); }
    catch { setError('Clipboard access is unavailable. Copy the public URL from the text field.'); }
  };

  return <div className="registry-page passport-manager">
    <div className="registry-heading"><div><span className="eyebrow">PUBLIC PRODUCT EXPERIENCE</span><h1>Digital passports</h1><p>Choose which product information is publicly accessible and share it with a stable link or QR code.</p></div><div className="registry-actions"><button className="subtle-button" onClick={() => { void loadProducts(); }}><RefreshCw size={14}/> Refresh</button></div></div>
    {error && <div className="registry-error" role="alert">{error}</div>}
    {notice && <div className="passport-notice" role="status">{notice}</div>}
    <div className="panel passport-config">
      <label className="passport-product-select">Product identity<select value={identifier} disabled={loading || products.length === 0} onChange={event => setIdentifier(event.target.value)}><option value="">Select a product</option>{products.map(product => <option key={product.identifier} value={product.identifier}>{product.identifier} — {product.name} ({product.status})</option>)}</select></label>
      {loading ? <div className="registry-empty">Loading products…</div> : products.length === 0 ? <div className="registry-empty">Register a product before publishing a passport.</div> : identifier && <>
        <div className="passport-section-list"><div className="panel-heading"><div><h3>Public disclosure settings</h3><p>Only the selected sections are returned by the unauthenticated public endpoint.</p></div></div>
          {sectionLabels.map(item => <label className="passport-section" key={item.key}><span><strong>{item.label}</strong><small>{item.detail}</small></span><input type="checkbox" checked={sections[item.key]} disabled={!canPublish || busy || (passport?.status === 'published' && !editing)} onChange={event => setSections(current => ({ ...current, [item.key]: event.target.checked }))}/></label>)}
        </div>
        <div className="passport-actions">
          {!passport || passport.status === 'revoked' ? <button className="primary-button" disabled={!canPublish || busy || !Object.values(sections).some(Boolean)} onClick={() => void save('publish')}><Globe2 size={15}/> {busy ? 'Publishing…' : passport ? 'Republish passport' : 'Publish passport'}</button> : <>
            {!editing ? <button className="subtle-button" disabled={!canPublish || busy} onClick={() => setEditing(true)}><ShieldCheck size={15}/> Edit public sections</button> : <><button className="primary-button" disabled={!canPublish || busy || !Object.values(sections).some(Boolean)} onClick={() => void save('update')}>Save section changes</button><button className="subtle-button" disabled={busy} onClick={() => { setSections(passport.sections); setEditing(false); }}>Cancel</button></>}
            <button className="danger-button" disabled={!canPublish || busy} onClick={() => { if (window.confirm('Revoke this public passport link? Anyone using it will lose access immediately.')) void save('revoke'); }}><ShieldOff size={14}/> Revoke access</button>
          </>}
        </div>
        {passport?.status === 'published' && <div className="passport-share">
          <div><span className="eyebrow">PUBLIC SHARE LINK</span><h3>Passport is published</h3><p>Anyone with this URL can view the selected sections until the passport is revoked.</p></div>
          <div className="passport-share-grid"><div className="passport-qr"><QRCodeSVG value={publicUrl} size={184} level="Q" includeMargin/></div><div className="passport-link-field"><label>Shareable URL<input readOnly value={publicUrl}/></label><div className="registry-actions"><button className="subtle-button" onClick={() => void copyLink()}><Copy size={14}/> Copy link</button><a className="subtle-button" href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Open passport</a></div><small>QR encodes the public web URL. Keep this link shareable only with intended audiences.</small></div></div>
        </div>}
        {passport?.status === 'revoked' && <p className="passport-revoked">This passport was revoked. Its previous public URL no longer resolves. You can publish it again to issue a fresh URL.</p>}
      </>}
    </div>
    <div className="registry-footnote"><ShieldCheck size={14}/> Publishing exposes organization-entered claims, not independent certification. Evidence references are not verified. A public URL is a bearer capability; revoke it if it is shared unintentionally.</div>
  </div>;
}
