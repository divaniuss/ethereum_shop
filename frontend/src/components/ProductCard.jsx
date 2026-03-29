import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

export default function ProductCard({ product }) {
    const { addToCart } = useContext(CartContext);
    const { token } = useContext(AuthContext);

    const imageUrl = product.image_urls && product.image_urls.length > 0
        ? product.image_urls[0]
        : 'https://via.placeholder.com/400x600?text=No+Image';

    return (
        <div className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
            <Link to={`/product/${product._id}`} className="relative h-64 overflow-hidden bg-white flex items-center justify-center">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-full w-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </Link>

            <div className="p-6 flex flex-col flex-grow">
                <div className="mb-2">
                    <Link to={`/product/${product._id}`}>
                        <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                            {product.name}
                        </h3>
                    </Link>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">
                    {product.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <span className="text-xl font-bold text-gray-900">
                        {product.price_eth} ETH
                    </span>

                    {token ? (
                        <button
                            onClick={() => addToCart(product)}
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            В корзину
                        </button>
                    ) : (
                        <span className="text-xs text-gray-400 font-medium text-right max-w-[100px] leading-tight">
                            Подключите кошелек для покупки
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}