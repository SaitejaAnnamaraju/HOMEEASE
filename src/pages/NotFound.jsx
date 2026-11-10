import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

export default function NotFound({ title = 'Page not found', text = "The page you're looking for doesn't exist or has moved." }) {
  return (
    <div className="page notfound">
      <div className="container narrow center">
        <div className="nf-code">404</div>
        <h1>{title}</h1>
        <p className="muted">{text}</p>
        <div className="btn-row center">
          <Link to="/" className="btn btn-ghost">
            <Icon name="home" size={18} /> Home
          </Link>
          <Link to="/helpers" className="btn btn-primary">
            <Icon name="search" size={18} /> Find Helpers
          </Link>
        </div>
      </div>
    </div>
  );
}
