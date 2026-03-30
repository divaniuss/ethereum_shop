import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';

export default function Catalog() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${API_URL}/catalog/`);
                if (!response.ok) {
                    throw new Error('Не удалось загрузить каталог');
                }
                const data = await response.json();
                setProducts(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 text-center text-red-600">
                Ошибка: {error}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 pt-2 pb-10">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Наш Каталог</h1>
                    <p className="text-gray-500">Свежее крафтовое пиво, готовое к отправке.</p>
                </div>
                <div className="text-sm font-medium text-gray-400">
                    Товаров: {products.length}
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl">
                    Каталог пока пуст. Администратор скоро добавит новые товары.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}