export default function StatCard({ icon: Icon, label, value, note, tone = "red" }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__icon"><Icon size={19} /></span>
        <span className="stat-card__note">{note}</span>
      </div>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__label">{label}</span>
    </article>
  );
}