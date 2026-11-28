import { useEffect, useState } from 'react';
import { apiRequest } from './lib/api';
import { ArrowLeft, CheckCircle2, Factory, Package, Recycle, ShieldAlert } from 'lucide-react';
import './passport.css';

type PassportData = {
  passport: { status: string; publishedAt: string; updatedAt: string };
  productStatus: string;
  identity?: { identifier: string; name: string; description?: string; category?: { name?: string } | string };
  manufacturer?: { name: string; registrationNumber?: string | null; countryCode?: string | null };
  materials?: Array<{ name: string; materialType: string; massGrams: number; recycledContentPercent: number; originCountry?: string | null }>;
  lifecycle?: Array<{ eventId: string; type: string; occurredAt: string; location?: string | null; description: string; sourceClassification: string; lotNumber?: string | null; shipmentReference?: string | null; evidence?: Array<{ label: string; kind: string; issuer?: string | null }> }>;
};

export default function PublicPassportPage() {
  const slug = window.location.pathname.split('/').filter(Boolean)[1] ?? '';
  const [data, setData] = useState<PassportData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    apiRequest<PassportData>('/passports/public/' + encodeURIComponent(slug))
      .then(result => { if (active) setData(result); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'This passport is unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <main className="public-passport-shell"><p>Loading product passport…</p></main>;
  if (error || !data) return <main className="public-passport-shell"><div className="public-passport-error"><ShieldAlert size={30}/><h1>Passport unavailable</h1><p>{error || 'This public passport could not be found.'}</p><a href="/"><ArrowLeft size={15}/> Return to CircuTrace</a></div></main>;

  const category = typeof data.identity?.category === 'object' ? data.identity.category?.name : data.identity?.category;
  return <main className="public-passport-shell">
    <header className="public-passport-header"><a href="/" className="public-passport-brand"><span>C</span> CircuTrace</a><span className="public-passport-label"><CheckCircle2 size={15}/> PUBLIC PRODUCT PASSPORT</span></header>
    <div className="public-passport-content">
      <section className="public-passport-hero"><span className="public-passport-kicker">DIGITAL PRODUCT IDENTITY</span><h1>{data.identity?.name ?? 'Product passport'}</h1><p>{data.identity?.description || 'A public view of selected product identity and lifecycle information.'}</p><div className="public-passport-meta"><span><Package size={14}/>{data.identity?.identifier ?? 'Product identity'}</span><span className={'public-product-status ' + data.productStatus}>{data.productStatus.replace('_',' ')}</span>{category && <span>{category}</span>}</div></section>
      {data.manufacturer && <section className="public-passport-card"><div className="public-card-title"><Factory size={18}/><h2>Manufacturer</h2></div><h3>{data.manufacturer.name}</h3><p>{[data.manufacturer.countryCode, data.manufacturer.registrationNumber].filter(Boolean).join(' · ') || 'Additional manufacturer details were not provided.'}</p></section>}
      {data.materials && <section className="public-passport-card"><div className="public-card-title"><Recycle size={18}/><h2>Materials & circularity</h2></div><div className="public-material-grid">{data.materials.length ? data.materials.map((material,index)=><article key={index}><strong>{material.name}</strong><span>{material.materialType} · {material.massGrams.toLocaleString()} g</span><span>{material.recycledContentPercent}% recycled content</span><small>{material.originCountry || 'Origin not supplied'}</small></article>) : <p>No material entries have been shared.</p>}</div></section>}
      {data.lifecycle && <section className="public-passport-card"><div className="public-card-title"><CheckCircle2 size={18}/><h2>Product journey</h2></div>{data.lifecycle.length ? <div className="public-lifecycle-list">{data.lifecycle.map(event=><article key={event.eventId}><span className="public-event-marker"/><div><div className="public-event-heading"><strong>{event.type.replaceAll('_',' ')}</strong><time>{new Date(event.occurredAt).toLocaleDateString()}</time></div><p>{event.description}</p><small>{[event.location,event.lotNumber ? 'Lot ' + event.lotNumber : '',event.shipmentReference ? 'Shipment ' + event.shipmentReference : ''].filter(Boolean).join(' · ')}</small><small>Claim source: {event.sourceClassification.replaceAll('_',' ')}</small></div></article>)}</div> : <p>No lifecycle events have been shared.</p>}</section>}
      <aside className="public-passport-disclaimer"><ShieldAlert size={17}/><p>This passport displays information supplied by the publishing organization. Claim-source labels describe how information was recorded; they do not independently verify product claims or certify compliance.</p></aside>
      <footer className="public-passport-footer">Published {new Date(data.passport.publishedAt).toLocaleDateString()} · Updated {new Date(data.passport.updatedAt).toLocaleDateString()} · Powered by CircuTrace</footer>
    </div>
  </main>;
}
