import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function Product() {
    const { id } = useParams();
    const API_URL = import.meta.env.VITE_API_URL;

    const { token } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`${API_URL}/catalog/${id}`);
                if (!response.ok) {
                    throw new Error('Товар не найден');
                }
                const data = await response.json();
                setProduct(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, API_URL]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Упс, ошибка</h2>
                <p className="text-gray-500 mb-8">{error || 'Товар не найден'}</p>
                <Link to="/catalog" className="text-blue-600 hover:underline">
                    Вернуться в каталог
                </Link>
            </div>
        );
    }

    const images = product.image_urls && product.image_urls.length > 0
        ? product.image_urls
        : ['https://via.placeholder.com/400x400?text=No+Image'];

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="text-sm text-gray-500 mb-8">
                <Link to="/" className="hover:text-black transition">Главная</Link>
                <span className="mx-2">/</span>
                <Link to="/catalog" className="hover:text-black transition">Каталог</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">


                <div className="flex flex-col gap-4 sticky top-28">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-[400px] flex items-center justify-center relative p-6">
                        <img
                            src={images[currentImageIndex]}
                            alt={product.name}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {images.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all p-1 bg-white ${
                                        currentImageIndex === index ? 'border-black' : 'border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>


                <div className="flex flex-col">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

                    <div className="mb-6 border-b border-gray-100 pb-6">
                        <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
                            {product.price_eth} ETH
                        </span>
                    </div>


                    <div className="mb-6 flex items-center">
                        <div className="inline-block bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 text-sm">
                            <span className="text-gray-500 mr-2">В наличии:</span>
                            <span className="font-bold text-gray-900">{product.stock_quantity} шт.</span>
                        </div>
                    </div>


                    <div className="mb-8">
                        {token ? (
                            <button
                                onClick={() => addToCart(product)}
                                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-sm"
                            >
                                Добавить в корзину
                            </button>
                        ) : (
                            <div className="w-full bg-gray-50 text-gray-500 py-4 rounded-xl font-medium text-center border border-gray-200">
                                Подключите кошелек для покупки
                            </div>
                        )}
                    </div>


                    <div className="prose prose-sm text-gray-600 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Описание</h3>
                        <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
                    </div>
                </div>

            </div>
        </div>
    );
}