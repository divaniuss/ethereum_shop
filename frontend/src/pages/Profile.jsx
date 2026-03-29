import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
    const { walletAddress, isAdmin, token, logout } = useContext(AuthContext);
    const API_URL = import.meta.env.VITE_API_URL;


    const [profileData, setProfileData] = useState({ username: '', shipping_address: '' });
    const [orders, setOrders] = useState([]);


    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!token) return;
            try {

                const profileRes = await fetch(`${API_URL}/profile/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const user = await profileRes.json();
                    setProfileData({
                        username: user.username || '',
                        shipping_address: user.shipping_address || ''
                    });
                }


                const ordersRes = await fetch(`${API_URL}/orders/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (ordersRes.ok) {
                    const data = await ordersRes.json();
                    setOrders(data);
                }
            } catch (error) {
                console.error("Ошибка загрузки данных профиля:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [token, API_URL]);


    const handleInputChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };


    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });


        const trimmedUsername = profileData.username.trim();
        const trimmedAddress = profileData.shipping_address.trim();


        if (trimmedUsername.length > 50) {
            setMessage({ text: 'Имя не должно превышать 50 символов.', type: 'error' });
            setSaving(false);
            return;
        }
        if (trimmedAddress.length > 250) {
            setMessage({ text: 'Адрес доставки слишком длинный (максимум 250 символов).', type: 'error' });
            setSaving(false);
            return;
        }


        const htmlRegex = /<[^>]*>?/gm;
        if (htmlRegex.test(trimmedUsername) || htmlRegex.test(trimmedAddress)) {
            setMessage({ text: 'Использование HTML-тегов и спецсимволов (<, >) запрещено.', type: 'error' });
            setSaving(false);
            return;
        }


        const payload = {
            username: trimmedUsername,
            shipping_address: trimmedAddress
        };

        try {
            const response = await fetch(`${API_URL}/profile/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Не удалось обновить профиль');


            setProfileData(payload);
            setMessage({ text: 'Данные успешно сохранены', type: 'success' });
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };


    const getStatusBadge = (status) => {
        switch(status) {
            case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">Ожидает оплаты</span>;
            case 'paid': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Оплачен</span>;
            default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-20 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">

            {profileData.username && (
                <p className="text-lg text-gray-500 mb-1">
                    Добрый день, <span className="font-semibold text-gray-900">{profileData.username}</span>!
                </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Мой профиль</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">


                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">

                        <div className="mb-6">
                            <span className="text-sm text-gray-500 block mb-1">Кошелек</span>
                            <span className="font-mono text-xs bg-white px-3 py-2 rounded-lg border border-gray-200 block truncate text-gray-800" title={walletAddress}>
                                {walletAddress}
                            </span>
                        </div>

                        <div className="mb-8">
                            <span className="text-sm text-gray-500 block mb-1">Статус аккаунта</span>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                            }`}>
                                {isAdmin ? 'Администратор' : 'Покупатель'}
                            </span>
                        </div>

                        <hr className="border-gray-200 mb-6" />

                        <form onSubmit={handleSaveProfile} className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Имя (Username)</label>
                                <input
                                    type="text" name="username"
                                    value={profileData.username} onChange={handleInputChange}
                                    placeholder="Ваше имя"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Адрес доставки</label>
                                <textarea
                                    name="shipping_address" rows="3"
                                    value={profileData.shipping_address} onChange={handleInputChange}
                                    placeholder="Город, улица, дом, индекс..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm"
                                ></textarea>
                            </div>

                            {message.text && (
                                <div className={`text-xs font-medium p-3 rounded-lg ${message.type === 'error' ? 'text-red-600 bg-red-50 border border-red-100' : 'text-green-600 bg-green-50 border border-green-100'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit" disabled={saving}
                                className={`w-full py-2.5 rounded-lg text-white text-sm font-medium transition ${
                                    saving ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
                                }`}
                            >
                                {saving ? 'Сохранение...' : 'Сохранить данные'}
                            </button>
                        </form>

                        <button
                            onClick={logout}
                            className="w-full bg-white border border-gray-200 text-red-600 font-medium py-2.5 rounded-xl hover:bg-red-50 hover:border-red-100 transition text-sm"
                        >
                            Выйти из аккаунта
                        </button>

                    </div>
                </div>


                <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">История заказов</h2>

                    {orders.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center h-[300px]">
                            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Здесь будут ваши покупки</h3>
                            <p className="text-gray-500 text-sm max-w-sm">
                                Вы еще ничего не заказывали. Как только вы оплатите товар, чек появится здесь.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs text-gray-400 font-mono mb-1">ID: {order._id}</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                Товаров: {order.items.length}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900 mb-1">{order.total_price} ETH</p>
                                            {getStatusBadge(order.status)}
                                        </div>
                                    </div>

                                    {order.tx_hash && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 text-xs">
                                            <span className="text-gray-500">Транзакция: </span>
                                            <a
                                                href={`https://etherscan.io/tx/${order.tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline font-mono"
                                            >
                                                {order.tx_hash.slice(0, 10)}...{order.tx_hash.slice(-8)}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}