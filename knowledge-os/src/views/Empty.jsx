import { Icon } from '../icons.jsx';

export default function EmptyView({ title, sub, icon, action }) {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)', display: 'grid', placeItems: 'center', margin: '0 auto 18px', color: 'var(--text-tertiary)' }}>
          <Icon name={icon} size={26} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 'var(--text-xl)', fontWeight: 600 }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{sub}</p>
        {action && <div style={{ marginTop: 18 }}>{action}</div>}
      </div>
    </div>
  );
}
