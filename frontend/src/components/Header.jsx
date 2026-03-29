import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function Header() {
    const { walletAddress, token, isAdmin, login, logout } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };


    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <header className="sticky top-0 z-50 w-full bg-slate-50/80 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">


                <Link to="/" className="text-2xl font-bold tracking-tighter text-gray-900">
                    BeerShop.
                </Link>


                <nav className="hidden md:flex gap-8 items-center">
                    <Link to="/" className="text-sm font-medium text-gray-600 hover:text-black transition">
                        Главная
                    </Link>
                    <Link to="/catalog" className="text-sm font-medium text-gray-600 hover:text-black transition">
                        Каталог
                    </Link>

                    {token && (
                        <Link to="/profile" className="text-sm font-medium text-gray-600 hover:text-black transition">
                            Профиль
                        </Link>
                    )}

                    {isAdmin && (
                        <Link to="/admin" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">
                            Админ-панель
                        </Link>
                    )}
                </nav>


                <div className="flex items-center gap-6">
                    {!token ? (
                        <button
                            onClick={login}
                            className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition shadow-sm"
                        >
                            Connect Wallet
                        </button>
                    ) : (
                        <div className="flex items-center gap-6">


                            <Link to="/cart" className="relative group p-2 rounded-full hover:bg-gray-100 transition">

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-6 h-6 text-gray-600 group-hover:text-black transition"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.119-1.243l1.263-12c.078-.741.6-1.257 1.347-1.257h12.19c.747 0 1.269.516 1.347 1.257Z" />
                                </svg>

                                {/* Бадж с количеством товаров */}
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-50">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* Адрес и Выход */}
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 border border-gray-200">
                                    {formatAddress(walletAddress)}
                                </span>
                                <button
                                    onClick={logout}
                                    className="text-sm font-medium text-gray-500 hover:text-red-600 transition"
                               >
                                    Выйти
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}