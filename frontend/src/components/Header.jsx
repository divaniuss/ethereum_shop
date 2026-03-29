import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Header() {

    const { walletAddress, token, isAdmin, login, logout } = useContext(AuthContext);


    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-slate-50/80 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                {/* Логотип */}
                <Link to="/" className="text-2xl font-bold tracking-tighter text-gray-900">
                    BeerShop.
                </Link>

                {/* Навигация (Центр) */}
                <nav className="hidden md:flex gap-8 items-center">
                    <Link to="/" className="text-sm font-medium text-gray-600 hover:text-black transition">
                        Главная
                    </Link>
                    <Link to="/catalog" className="text-sm font-medium text-gray-600 hover:text-black transition">
                        Каталог
                    </Link>
                    {/* Если юзер авторизован, показываем скрытые ссылки */}
                    {token && (
                        <Link to="/profile" className="text-sm font-medium text-gray-600 hover:text-black transition">
                            Профиль
                        </Link>
                    )}
                    {/* Если юзер АДМИН, показываем админку */}
                    {isAdmin && (
                        <Link to="/admin" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">
                            Админ-панель
                        </Link>
                    )}
                </nav>

                {/* Кнопка авторизации / Профиль (Справа) */}
                <div className="flex items-center gap-4">
                    {!token ? (
                        <button
                            onClick={login}
                            className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition shadow-sm"
                        >
                            Connect Wallet
                        </button>
                    ) : (
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
                    )}
                </div>

            </div>
        </header>
    );
}