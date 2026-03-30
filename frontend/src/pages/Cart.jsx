import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ethers } from 'ethers';

//remix contract adres and function name
const CONTRACT_ADDRESS = "0x94bb8b5127a3De0228Aa8133F9572b92C5c6ac12";
const CONTRACT_ABI = [
    "function payForOrder(string memory orderId) public payable"
];

export default function Cart() {
    const { cartItems, addToCart, decreaseQuantity, removeFromCart, getCartTotal, clearCart } = useContext(CartContext);
    const { token, walletAddress } = useContext(AuthContext);
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    const [address, setAddress] = useState('');
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [citySearch, setCitySearch] = useState('');
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/profile/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.shipping_address) {
                        setAddress(data.shipping_address);
                        setIsEditingAddress(false);
                    } else {
                        setIsEditingAddress(true);
                    }
                }
            } catch (err) {
                console.error("Не удалось загрузить профиль", err);
            }
        };
        fetchProfile();
    }, [token, API_URL]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (citySearch.trim().length >= 2 && !selectedCity) {
                try {
                    const res = await fetch(`${API_URL}/delivery/cities?q=${citySearch}`);
                    if (res.ok) {
                        const data = await res.json();
                        setCities(data);
                    }
                } catch (err) {
                    console.error("Ошибка поиска городов:", err);
                }
            } else {
                setCities([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [citySearch, API_URL, selectedCity]);

    const handleCitySelect = async (city) => {
        setSelectedCity(city);
        setCitySearch(city.description);
        setCities([]);
        setWarehouses([]);
        setSelectedWarehouse('');
        setLoadingWarehouses(true);

        try {
            const res = await fetch(`${API_URL}/delivery/warehouses?city_ref=${city.ref}`);
            if (res.ok) {
                const data = await res.json();
                setWarehouses(data);
            } else {
                console.error("Сервер вернул ошибку при загрузке отделений");
            }
        } catch (err) {
            console.error("Ошибка загрузки отделений:", err);
        } finally {
            setLoadingWarehouses(false);
        }
    };

    const handleCheckout = async () => {
        setError(null);

        let finalAddress = address;

        if (isEditingAddress) {
            if (!selectedCity || !selectedWarehouse) {
                setError("Пожалуйста, выберите город и отделение Новой Почты.");
                return;
            }

            finalAddress = `${selectedCity.description}, ${selectedWarehouse}`;
        }

        if (!finalAddress.trim() || finalAddress.trim().length < 5) {
            setError("Пожалуйста, укажите корректный адрес доставки (минимум 5 символов).");
            return;
        }

        if (!window.ethereum) {
            setError("MetaMask не установлен!");
            return;
        }

        setIsProcessing(true);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();

            if (signer.address.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new Error("Адрес в MetaMask не совпадает с вашим аккаунтом на сайте. Пожалуйста, переключите аккаунт в расширении.");
            }

            const estimatedTotal = getCartTotal();
            const estimatedWei = ethers.parseEther(estimatedTotal.toString());
            const balance = await provider.getBalance(signer.address);

            if (balance < estimatedWei) {
                throw new Error("На вашем кошельке недостаточно ETH для оплаты этого заказа.");
            }

            const items = cartItems.map(item => ({
                product_id: item._id,
                quantity: item.quantity
            }));

            const orderRes = await fetch(`${API_URL}/orders/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items, shipping_address: finalAddress.trim() })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json();
                throw new Error(errData.detail || 'Ошибка при создании заказа на сервере');
            }

            const orderData = await orderRes.json();
            const orderId = orderData._id;

            const exactAmountInWei = ethers.parseEther(orderData.total_price.toString());

            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            const tx = await contract.payForOrder(orderId, { value: exactAmountInWei });

            const receipt = await tx.wait();

            const patchRes = await fetch(`${API_URL}/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tx_hash: receipt.hash })
            });

            if (!patchRes.ok) {
                throw new Error(`Платеж успешен, но статус заказа не обновился. Ваш хэш транзакции: ${receipt.hash}. Сохраните его и обратитесь в поддержку.`);
            }

            setSuccess(true);
            clearCart();

            setTimeout(() => {
                navigate('/profile');
            }, 3000);

        } catch (err) {
            console.error(err);

            if (err.code === 'ACTION_REJECTED') {
                setError("Вы отменили транзакцию в MetaMask.");
            } else {
                setError(err.message || "Произошла неизвестная ошибка при оплате.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (cartItems.length === 0 && !success) {
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

    if (success) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Заказ успешно оплачен!</h2>
                <p className="text-gray-500 mb-8">Транзакция подтверждена. Вы будете перенаправлены в профиль...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Оформление заказа</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-4">
                    {cartItems.map((item) => (
                        <div key={item._id}
                             className="flex items-center gap-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <img
                                src={item.image_urls?.[0] || 'https://via.placeholder.com/150'}
                                alt={item.name}
                                className="w-24 h-32 flex-shrink-0 object-contain rounded-xl bg-white"
                            />
                            <div className="flex-grow">
                                <Link to={`/product/${item._id}`}>
                                    <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition">{item.name}</h3>
                                </Link>
                                <p className="text-sm text-gray-500 mb-3">{item.price_eth} ETH за 1 шт.</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                                        <button onClick={() => decreaseQuantity(item._id)}
                                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition text-gray-600 font-bold">-
                                        </button>
                                        <span
                                            className="w-8 text-center font-medium text-sm text-gray-900">{item.quantity}</span>
                                        <button onClick={() => addToCart(item)}
                                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition text-gray-600 font-bold">+
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col justify-between h-24">
                                <p className="text-lg font-bold text-gray-900">{(item.price_eth * item.quantity).toFixed(4)} ETH</p>
                                <button onClick={() => removeFromCart(item._id)}
                                        className="text-sm font-medium text-red-500 hover:text-red-700 transition">Удалить
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

                    <div
                        className="flex justify-between items-center mb-6 text-gray-900 font-bold text-xl border-t border-gray-200 pt-4">
                        <span>К оплате</span>
                        <span>{getCartTotal().toFixed(4)} ETH</span>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Адрес доставки <span className="text-red-500">*</span>
                        </label>

                        {!isEditingAddress && address ? (
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Текущий адрес:</p>
                                <p className="text-sm font-medium text-gray-900">{address}</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditingAddress(true);
                                        setCitySearch('');
                                        setCities([]);
                                        setSelectedCity(null);
                                        setWarehouses([]);
                                        setSelectedWarehouse('');
                                        setError(null);
                                    }}
                                    className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                                >
                                    Изменить адрес доставки
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <span className="block text-xs font-bold text-red-600 mb-3 uppercase tracking-wide">Доставка (Новая Почта)</span>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Город</label>
                                        <input
                                            type="text"
                                            value={citySearch}
                                            onChange={(e) => {
                                                setCitySearch(e.target.value);
                                                setSelectedCity(null);
                                                setWarehouses([]);
                                                setSelectedWarehouse('');
                                            }}
                                            placeholder={address ? "Начните вводить для изменения..." : "Например: Киев"}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                                            disabled={isProcessing}
                                        />

                                        {cities.length > 0 && (
                                            <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {cities.map((city) => (
                                                    <li
                                                        key={city.ref}
                                                        onClick={() => handleCitySelect(city)}
                                                        className="px-3 py-2 text-sm hover:bg-red-50 cursor-pointer transition-colors"
                                                    >
                                                        {city.description}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Отделение</label>
                                        <select
                                            value={selectedWarehouse}
                                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                                            disabled={warehouses.length === 0 || loadingWarehouses || isProcessing}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm transition-colors ${
                                                (warehouses.length === 0 || loadingWarehouses || isProcessing)
                                                    ? 'bg-gray-100 cursor-not-allowed text-gray-400'
                                                    : 'bg-white focus:ring-2 focus:ring-red-500'
                                            }`}
                                        >
                                            <option value="" disabled>
                                                {loadingWarehouses
                                                    ? 'Загружаем отделения...'
                                                    : warehouses.length === 0
                                                        ? 'Сначала выберите город ИЗ СПИСКА сверху'
                                                        : 'Выберите отделение из списка...'}
                                            </option>

                                            {warehouses.map((w) => (
                                                <option key={w.ref} value={w.description}>
                                                    {w.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {address && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditingAddress(false);
                                                setCitySearch('');
                                                setCities([]);
                                                setSelectedCity(null);
                                                setWarehouses([]);
                                                setSelectedWarehouse('');
                                                setError(null);
                                            }}
                                            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                                        >
                                            Отменить изменение
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className={`w-full py-3.5 rounded-xl font-medium transition shadow-sm flex justify-center items-center ${
                            isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
                        }`}
                    >
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            'Оплатить через MetaMask'
                        )}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-4">
                        Подтверждая заказ, вы соглашаетесь на списание средств через смарт-контракт.
                    </p>
                </div>
            </div>
        </div>
    );
}