import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from './lib/api';
import { Plus, RefreshCw, ArrowDownLeft, ArrowUpRight, Factory, PackageCheck, Wrench, Recycle, ShieldAlert } from 'lucide-react';

type Product = { identifier: string; name: string; status: string };
type EventType = 'manufactured' | 'quality_inspected' | 'packaged' | 'dispatched' | 'shipped' | 'received' | 'custody_transferred' | 'repaired' | 'refurbished' | 'recycled' | 'recalled';
type LifecycleEvent = { _id: string; eventId: string; sequence: number; type: EventType; occurredAt: string; recordedAt: string; location?: string | null; description: string; lotNumber?: string | null; shipmentReference?: string | null; custodyFrom?: string | null; custodyTo?: string | null; sourceClassification: string; evidence: Array<{ kind: string; label: string; reference: string; issuer?: string | null; sourceClassification: string }> };
type PageInfo = { page: number; limit: number; total: number; pages: number };
const eventTypes: EventType[] = ['manufactured','quality_inspected','packaged','dispatched','shipped','received','custody_transferred','repaired','refurbished','recycled','recalled'];
const labels: Record<EventType,string> = { manufactured:'Manufactured',quality_inspected:'Quality inspected',packaged:'Packaged',dispatched:'Dispatched',shipped:'Shipped',received:'Received',custody_transferred:'Custody transferred',repaired:'Repaired',refurbished:'Refurbished',recycled:'Recycled',recalled:'Recalled' };
const icons: Record<EventType, typeof Factory> = { manufactured:Factory,quality_inspected:ShieldAlert,packaged:PackageCheck,dispatched:ArrowUpRight,shipped:ArrowUpRight,received:ArrowDownLeft,custody_transferred:ArrowUpRight,repaired:Wrench,refurbished:Wrench,recycled:Recycle,recalled:ShieldAlert };

export default function LifecycleExplorer({ role }: { role: string }) {
  const [products,setProducts] = useState<Product[]>([]);
  const [identifier,setIdentifier] = useState('');
  const [events,setEvents] = useState<LifecycleEvent[]>([]);
  const [pagination,setPagination] = useState<PageInfo>({page:1,limit:25,total:0,pages:0});
  const [type,setType] = useState('');
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [showForm,setShowForm] = useState(false);
  const [eventType,setEventType] = useState<EventType>('manufactured');
  const [occurredAt,setOccurredAt] = useState(new Date().toISOString().slice(0,16));
  const [description,setDescription] = useState('');
  const [location,setLocation] = useState('');
  const [lotNumber,setLotNumber] = useState('');
  const [shipmentReference,setShipmentReference] = useState('');
  const [custodyFrom,setCustodyFrom] = useState('');
  const [custodyTo,setCustodyTo] = useState('');
  const [evidenceLabel,setEvidenceLabel] = useState('');
  const [evidenceReference,setEvidenceReference] = useState('');
  const [evidenceKind,setEvidenceKind] = useState('other');
  const [sourceClassification,setSourceClassification] = useState('self_reported');
  const canWrite = role !== 'auditor';

  useEffect(() => { apiRequest<{products:Product[]}>('/products?limit=100&sort=name&order=asc').then(result => { setProducts(result.products); setIdentifier(current => current || result.products[0]?.identifier || ''); }).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load products.')); }, []);
  const loadEvents = useCallback(async () => {
    if (!identifier) { setEvents([]); return; }
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({page:'1',limit:'50',order:'desc'});
      if(type) params.set('type',type);
      const result = await apiRequest<{events:LifecycleEvent[];pagination:PageInfo}>('/lifecycle/'+encodeURIComponent(identifier)+'/events?'+params.toString());
      setEvents(result.events); setPagination(result.pagination);
    } catch(cause) { setError(cause instanceof Error ? cause.message : 'Unable to load lifecycle events.'); }
    finally { setLoading(false); }
  },[identifier,type]);
  useEffect(() => { void loadEvents(); },[loadEvents]);

  const submit = async (event:FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const evidence = evidenceLabel.trim() && evidenceReference.trim() ? [{kind:evidenceKind,label:evidenceLabel,reference:evidenceReference,sourceClassification}] : [];
      await apiRequest<{event:LifecycleEvent}>('/lifecycle/'+encodeURIComponent(identifier)+'/events',{method:'POST',body:JSON.stringify({
        type:eventType,occurredAt:new Date(occurredAt).toISOString(),description,location:location||undefined,lotNumber:lotNumber||undefined,
        shipmentReference:eventType==='shipped' ? shipmentReference : undefined,
        custodyFrom:eventType==='custody_transferred' ? custodyFrom : undefined,
        custodyTo:eventType==='custody_transferred' ? custodyTo : undefined,
        evidence,sourceClassification,
      })});
      setDescription('');setLocation('');setLotNumber('');setShipmentReference('');setCustodyFrom('');setCustodyTo('');setEvidenceLabel('');setEvidenceReference('');setShowForm(false);
      await loadEvents();
    } catch(cause) { setError(cause instanceof Error ? cause.message : 'Unable to append lifecycle event.'); }
    finally { setBusy(false); }
  };
  return <div className="registry-page">
    <div className="registry-heading"><div><span className="eyebrow">PRODUCT PROVENANCE</span><h1>Lifecycle explorer</h1><p>Review the reported journey of a product from manufacture through recovery.</p></div><div className="registry-actions"><button className="subtle-button" onClick={()=>void loadEvents()}><RefreshCw size={14}/> Refresh</button>{canWrite && <button className="primary-button" disabled={!identifier} onClick={()=>{setError('');setShowForm(true);}}><Plus size={15}/> Record event</button>}</div></div>
    {error && <div className="registry-error" role="alert">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
    <div className="panel lifecycle-toolbar"><label>Product identity<select value={identifier} onChange={e=>setIdentifier(e.target.value)}><option value="">Select product</option>{products.map(product=><option key={product.identifier} value={product.identifier}>{product.identifier} — {product.name}</option>)}</select></label><label>Event type filter<select value={type} onChange={e=>setType(e.target.value)}><option value="">All events</option>{eventTypes.map(value=><option key={value} value={value}>{labels[value]}</option>)}</select></label><span>{pagination.total} recorded event{pagination.total===1?'':'s'}</span></div>
    {showForm && <form className="registry-form panel" onSubmit={submit}><div className="panel-heading"><div><h3>Append lifecycle event</h3><p>Events are recorded as new entries; this interface does not edit or delete past events.</p></div><button type="button" className="close-button" onClick={()=>setShowForm(false)}>×</button></div><div className="registry-form-grid">
      <label>Event type<select value={eventType} onChange={e=>setEventType(e.target.value as EventType)}>{eventTypes.map(value=><option key={value} value={value}>{labels[value]}</option>)}</select></label>
      <label>When did it occur?<input required type="datetime-local" value={occurredAt} onChange={e=>setOccurredAt(e.target.value)}/></label>
      <label>Location (optional)<input maxLength={200} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Facility, city or country"/></label>
      <label>Lot / batch number (optional)<input maxLength={100} value={lotNumber} onChange={e=>setLotNumber(e.target.value)}/></label>
      {eventType==='shipped' && <label>Shipment reference<input required value={shipmentReference} onChange={e=>setShipmentReference(e.target.value)} maxLength={120}/></label>}
      {eventType==='custody_transferred' && <><label>From party<input required value={custodyFrom} onChange={e=>setCustodyFrom(e.target.value)} maxLength={160}/></label><label>To party<input required value={custodyTo} onChange={e=>setCustodyTo(e.target.value)} maxLength={160}/></label></>}
      <label className="registry-wide">Event description<textarea required minLength={3} maxLength={2000} rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the activity and its context."/></label>
      <label>Claim source<select value={sourceClassification} onChange={e=>setSourceClassification(e.target.value)}><option value="self_reported">Self-reported</option><option value="supplier_provided">Supplier-provided</option><option value="system_recorded">System-recorded</option></select></label>
      <label>Evidence reference type<select value={evidenceKind} onChange={e=>setEvidenceKind(e.target.value)}><option value="other">Other</option><option value="certificate">Certificate</option><option value="inspection_report">Inspection report</option><option value="invoice">Invoice</option><option value="shipping_record">Shipping record</option><option value="photo_reference">Photo reference</option></select></label>
      <label>Evidence label (optional)<input value={evidenceLabel} onChange={e=>setEvidenceLabel(e.target.value)} maxLength={120}/></label><label>Evidence reference (optional)<input value={evidenceReference} onChange={e=>setEvidenceReference(e.target.value)} maxLength={500} placeholder="Existing document ID or secure reference"/></label>
    </div><div className="registry-form-footer"><span>References only; no files are uploaded or verified here.</span><button className="primary-button" disabled={busy}>{busy?'Saving…':'Append event'}</button></div></form>}
    <div className="panel lifecycle-timeline"><div className="registry-table-heading"><div><h3>Product journey</h3><p>{identifier || 'Choose a product to view its event history'}</p></div><span className="registry-count">{loading?'Loading…':pagination.total+' total'}</span></div>
      {events.length===0 && !loading ? <div className="registry-empty"><strong>No lifecycle events yet</strong><span>Events recorded for this product will appear here.</span></div> : <div className="timeline-list">{events.map(item=>{const Icon=icons[item.type];return <article className="timeline-item" key={item._id}><span className="timeline-icon"><Icon size={16}/></span><div className="timeline-copy"><div className="timeline-title"><strong>{labels[item.type]}</strong><span>{item.eventId}</span></div><p>{item.description}</p><div className="timeline-meta"><span>{new Date(item.occurredAt).toLocaleString()}</span>{item.location&&<span>{item.location}</span>}{item.lotNumber&&<span>Lot {item.lotNumber}</span>}{item.shipmentReference&&<span>Shipment {item.shipmentReference}</span>}{item.custodyFrom&&<span>{item.custodyFrom} → {item.custodyTo}</span>}</div><div className="timeline-meta"><span>Source: {item.sourceClassification.replace('_',' ')}</span><span>Recorded {new Date(item.recordedAt).toLocaleString()}</span></div>{item.evidence.length>0&&<div className="timeline-evidence">{item.evidence.map((e,i)=><span key={i}>{e.label}: {e.reference} ({e.sourceClassification.replace('_',' ')})</span>)}</div>}</div></article>})}</div>}
    </div>
    <div className="registry-footnote"><ShieldAlert size={14}/> Timeline entries are reported records, not independent proof of physical activity. Source labels do not imply verification.</div>
  </div>;
}
