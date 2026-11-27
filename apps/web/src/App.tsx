import { ArrowUpRight, Boxes, CircleCheck, ClipboardList, Factory, Leaf, PackageSearch, ShieldCheck, Truck } from 'lucide-react';

const metrics = [
  { label: 'Digital product identities', value: '12,840', change: '+8.2%', icon: PackageSearch },
  { label: 'Verified lifecycle events', value: '38,291', change: '+12.4%', icon: CircleCheck },
  { label: 'Connected organizations', value: '246', change: '+4.6%', icon: Factory },
  { label: 'Evidence completeness', value: '94.8%', change: '+2.1%', icon: ShieldCheck },
];

const activity = [
  { title: 'Battery Pack CT-EVB-000184 registered', detail: 'Northstar Mobility · Product registry', time: '12 minutes ago', status: 'Registered' },
  { title: 'Material declaration evidence submitted', detail: 'Apex Materials · Compliance', time: '48 minutes ago', status: 'Under review' },
  { title: 'Custody transfer recorded', detail: 'Meridian Logistics · Provenance', time: '2 hours ago', status: 'Verified' },
  { title: 'Repair event added to product history', detail: 'VoltCare Services · Lifecycle', time: 'Yesterday', status: 'Verified' },
];

const modules = [
  { title: 'Product registry', description: 'Create and manage digital product identities.', icon: Boxes },
  { title: 'Lifecycle intelligence', description: 'Explore product events from origin to recovery.', icon: ClipboardList },
  { title: 'Supply chain provenance', description: 'Connect suppliers, shipments and custody records.', icon: Truck },
  { title: 'Circularity insights', description: 'Understand materials, repairability and recovery.', icon: Leaf },
];

export default function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="CircuTrace home">
          <span className="brand-mark">C</span>
          <span>Circu<span className="brand-accent">Trace</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switcher"><span className="workspace-avatar">N</span><span><strong>Northstar Mobility</strong><small>Enterprise workspace</small></span><span className="chevron">⌄</span></button>
        <nav className="navigation" aria-label="Main navigation">
          <span className="nav-caption">OVERVIEW</span>
          <a className="nav-item active" href="#overview"><span>◫</span> Overview</a>
          <a className="nav-item" href="#products"><PackageSearch size={17}/> Product registry</a>
          <a className="nav-item" href="#lifecycle"><ClipboardList size={17}/> Lifecycle explorer</a>
          <a className="nav-item" href="#supply-chain"><Truck size={17}/> Supply chain</a>
          <a className="nav-item" href="#materials"><Boxes size={17}/> Materials & components</a>
          <a className="nav-item" href="#sustainability"><Leaf size={17}/> Sustainability</a>
          <span className="nav-caption nav-spaced">GOVERNANCE</span>
          <a className="nav-item" href="#compliance"><ShieldCheck size={17}/> Compliance & evidence</a>
          <a className="nav-item" href="#organizations"><Factory size={17}/> Organizations</a>
        </nav>
        <div className="sidebar-bottom"><div className="profile-avatar">MR</div><span><strong>Matiur Rahaman</strong><small>Workspace administrator</small></span><span className="chevron">···</span></div>
      </aside>

      <section className="main-panel" id="overview">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-actions"><span className="environment"><i/> DEVELOPMENT</span><button className="icon-button" aria-label="Notifications">♧</button><div className="topbar-avatar">MR</div></div></header>
        <div className="content">
          <div className="welcome-row"><div><div className="eyebrow">THURSDAY, NOVEMBER 27, 2026</div><h1>Good morning, Matiur <span>✳</span></h1><p>Here’s what’s happening across your product ecosystem.</p></div><button className="primary-button"> <span>＋</span> Register a product</button></div>
          <div className="section-heading"><div><h2>Workspace overview</h2><p>Key metrics across your connected product lifecycle.</p></div><button className="period-button">Last 30 days&nbsp;⌄</button></div>
          <div className="metric-grid">{metrics.map(({ label, value, change, icon: Icon }) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-foot"><span className="positive">↗ {change}</span><span>vs. previous period</span></div></article>)}</div>
          <div className="dashboard-grid">
            <article className="panel lifecycle-panel"><div className="panel-heading"><div><h3>Lifecycle activity</h3><p>Product events recorded over time</p></div><button className="subtle-button">View analytics <ArrowUpRight size={15}/></button></div><div className="chart-legend"><span><i className="legend-dot teal"/> Verified events</span><span><i className="legend-dot pale"/> Pending review</span></div><div className="chart"><div className="chart-y"><span>1,200</span><span>900</span><span>600</span><span>300</span><span>0</span></div><div className="chart-area"><div className="grid-line g1"/><div className="grid-line g2"/><div className="grid-line g3"/><div className="grid-line g4"/><svg viewBox="0 0 700 190" preserveAspectRatio="none" role="img" aria-label="Illustrative lifecycle activity trend"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#20b9a0" stopOpacity=".22"/><stop offset="100%" stopColor="#20b9a0" stopOpacity="0"/></linearGradient></defs><path d="M0 150 C45 138 55 122 95 130 S150 112 190 118 S250 82 285 99 S345 77 380 91 S440 53 475 69 S535 45 570 61 S635 25 700 32 L700 190 L0 190Z" fill="url(#area)"/><path d="M0 150 C45 138 55 122 95 130 S150 112 190 118 S250 82 285 99 S345 77 380 91 S440 53 475 69 S535 45 570 61 S635 25 700 32" fill="none" stroke="#20b9a0" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg><div className="chart-x"><span>Oct 30</span><span>Nov 04</span><span>Nov 09</span><span>Nov 14</span><span>Nov 19</span><span>Nov 27</span></div></div></div></article>
            <article className="panel completeness-panel"><div className="panel-heading"><div><h3>Passport completeness</h3><p>Across registered products</p></div><button className="more-button">···</button></div><div className="donut-wrap"><div className="donut"><div className="donut-inner"><strong>94.8%</strong><span>AVERAGE</span></div></div></div><div className="completeness-legend"><div><span><i className="legend-dot teal"/> Complete passports</span><strong>8,420</strong></div><div><span><i className="legend-dot pale"/> Needs attention</span><strong>720</strong></div></div><div className="insight-note"><span>✦</span><p><strong>Great progress!</strong> Passport completeness improved by 2.1% this month.</p></div></article>
          </div>
          <div className="lower-grid"><article className="panel activity-panel"><div className="panel-heading"><div><h3>Recent activity</h3><p>Latest events from your product ecosystem</p></div><button className="subtle-button">View all <ArrowUpRight size={15}/></button></div><div className="activity-list">{activity.map((item) => <div className="activity-item" key={item.title}><span className="activity-marker"><CircleCheck size={16}/></span><div className="activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div><span className={item.status === 'Under review' ? 'status pending' : 'status'}>{item.status}</span><time>{item.time}</time></div>)}</div></article><article className="panel modules-panel"><div className="panel-heading"><div><h3>Platform modules</h3><p>Your product intelligence toolkit</p></div></div><div className="module-list">{modules.map(({ title, description, icon: Icon }) => <div className="module-item" key={title}><span className="module-icon"><Icon size={18}/></span><span><strong>{title}</strong><small>{description}</small></span><ArrowUpRight size={15}/></div>)}</div></article></div>
          <footer>© 2026 CircuTrace <span>Enterprise product intelligence, built for circularity.</span><span>Foundation preview · Sample interface data</span></footer>
        </div>
      </section>
    </main>
  );
}
