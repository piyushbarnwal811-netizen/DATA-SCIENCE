export default function Loader({ label = "Loading your campus..." }) {
  return (
    <div className="loading-screen" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}