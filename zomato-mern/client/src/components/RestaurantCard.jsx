import { Link } from 'react-router-dom';

export default function RestaurantCard({ r }) {
  return (
    <Link to={`/restaurant/${r._id}`} className="card">
      <div className="card-img">{r.emoji}</div>
      <div className="card-body">
        <div className="row">
          <h3>{r.name}</h3>
          <span className="rating">★ {r.rating.toFixed(1)}</span>
        </div>
        <p className="muted">
          ⚡ {r.deliveryMinutes} mins | {r.distanceKm} km | ₹{r.costForOne} for one
        </p>
        <p className="muted small">{r.cuisines.join(', ')}</p>
        {r.offer && <p className="offer">🏷️ {r.offer}</p>}
      </div>
    </Link>
  );
}
