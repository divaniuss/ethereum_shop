import { Routes, Route } from 'react-router-dom';
import Auth from './Auth';

function Catalog() {
  return <div style={{ padding: '20px' }}><h2>catalog page</h2></div>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/catalog" element={<Catalog />} />
    </Routes>
  );
}

export default App;