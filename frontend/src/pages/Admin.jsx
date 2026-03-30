import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Admin() {
    const { token } = useContext(AuthContext);
    const API_URL = import.meta.env.VITE_API_URL;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '', //ETH
        volume: '',
        stock: ''
    });

    const [imageFiles, setImageFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setImageFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.description.trim()) {
            setMessage({ text: 'Название и описание не могут быть пустыми или состоять только из пробелов', type: 'error' });
            return;
        }

        const price = parseFloat(formData.price);
        const volume = parseInt(formData.volume, 10);
        const stock = parseInt(formData.stock, 10);

        if (isNaN(price) || price <= 0) {
            setMessage({ text: 'Цена должна быть больше нуля', type: 'error' });
            return;
        }

        if (isNaN(volume) || volume <= 0) {
            setMessage({ text: 'Объем должен быть больше нуля', type: 'error' });
            return;
        }

        if (isNaN(stock) || stock < 0) {
            setMessage({ text: 'Количество на складе не может быть отрицательным (минимум 0)', type: 'error' });
            return;
        }


        if (imageFiles.length === 0) {
            setMessage({ text: 'Пожалуйста, выберите хотя бы одно изображение', type: 'error' });
            return;
        }



        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const imageFormData = new FormData();
            imageFiles.forEach((file) => {
                imageFormData.append('files', file);
            });

            const uploadResponse = await fetch(`${API_URL}/catalog/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: imageFormData
            });

            if (!uploadResponse.ok) {
                const err = await uploadResponse.json();
                throw new Error(err.detail || 'Ошибка при загрузке картинок в облако');
            }

            const uploadData = await uploadResponse.json();
            const imageUrls = uploadData.image_urls;

            const productData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price_eth: price,
                stock_quantity: stock,
                image_urls: imageUrls
                // volume: volume
            };

            const createResponse = await fetch(`${API_URL}/catalog/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            if (!createResponse.ok) {
                const err = await createResponse.json();
                throw new Error(err.detail || 'Ошибка при сохранении товара в базу данных');
            }

            setMessage({ text: 'Товар успешно добавлен в каталог!', type: 'success' });

            setFormData({ name: '', description: '', price: '', volume: '', stock: '' });
            setImageFiles([]);
            document.getElementById('file-upload').value = '';

        } catch (error) {
            console.error(error);
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Добавление товара</h1>

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Название пива</label>
                    <input
                        type="text" name="name" required
                        value={formData.name} onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                        placeholder="Например: IPA 'Хмельной шторм'"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                    <textarea
                        name="description" rows="3" required
                        value={formData.description} onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                        placeholder="Кратко о вкусе и горечи..."
                    ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Цена (в ETH)</label>
                        {/* Добавлен min="0.000001" для предотвращения отрицательных чисел */}
                        <input
                            type="number" step="0.0001" min="0.000001" name="price" required
                            value={formData.price} onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                            placeholder="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Объем (мл)</label>
                        {/* Добавлен min="1" */}
                        <input
                            type="number" min="1" name="volume" required
                            value={formData.volume} onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                            placeholder="500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Количество на складе (шт)</label>
                    {/* Добавлен min="0" (0 можно, отрицательные нельзя) */}
                    <input
                        type="number" min="0" name="stock" required
                        value={formData.stock} onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition"
                        placeholder="100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Фотографии</label>
                    <input
                        id="file-upload"
                        type="file" accept="image/*" multiple required
                        onChange={handleImageChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>

                <button
                    type="submit" disabled={loading}
                    className={`w-full py-3 rounded-lg text-white font-medium transition flex justify-center items-center ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        'Добавить товар в каталог'
                    )}
                </button>
            </form>
        </div>
    );
}