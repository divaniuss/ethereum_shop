import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function Cart() {

    const {
        cartItems,
        addToCart,
        decreaseQuantity,
        removeFromCart,
        getCartTotal
    } = useContext(CartContext);


    if (cartItems.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Ваша корзина пуста</h2>
                <p className="text-gray-500 mb-8">Самое время выбрать отличный крафт.</p>
                <Link to="/catalog" className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition">
                    Перейти в каталог
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Оформление заказа</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">


                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => (
                        <div key={item._id} className="flex items-center gap-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">


                            <img
                                src={item.image_urls?.[0] || 'https://via.placeholder.com/150'}
                                alt={item.name}
                                className="w-24 h-24 object-cover rounded-xl bg-white"
                            />


                            <div className="flex-grow">
                                <Link to={`/product/${item._id}`}>
                                    <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition">
                                        {item.name}
                                    </h3>
                                </Link>
                                <p className="text-sm text-gray-500 mb-3">{item.price_eth} ETH за 1 шт.</p>


                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                                        <button
                                            onClick={() => decreaseQuantity(item._id)}
                                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition text-gray-600 font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-medium text-sm text-gray-900">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition text-gray-600 font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right flex flex-col justify-between h-24">
                                <p className="text-lg font-bold text-gray-900">
                                    {(item.price_eth * item.quantity).toFixed(4)} ETH
                                </p>
                                <button
                                    onClick={() => removeFromCart(item._id)}
                                    className="text-sm font-medium text-red-500 hover:text-red-700 transition"
                                >
                                    Удалить
                                </button>
                            </div>

                        </div>
                    ))}
                </div>


                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-fit sticky top-28">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Итого</h2>

                    <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                        <span>Товары ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} шт.)</span>
                        <span>{getCartTotal().toFixed(4)} ETH</span>
                    </div>

                    <div className="flex justify-between items-center mb-8 text-gray-900 font-bold text-xl border-t border-gray-200 pt-4">
                        <span>К оплате</span>
                        <span>{getCartTotal().toFixed(4)} ETH</span>
                    </div>


                    <button className="w-full bg-black text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 transition shadow-sm">
                        Оплатить через MetaMask
                    </button>
                </div>

            </div>
        </div>
    );
}