import { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { walletAddress } = useContext(AuthContext);

    const [cartItems, setCartItems] = useState([]);


    useEffect(() => {
        if (walletAddress) {
            const savedCart = localStorage.getItem(`cart_${walletAddress}`);
            setCartItems(savedCart ? JSON.parse(savedCart) : []);
        } else {
            setCartItems([]);
        }
    }, [walletAddress]);


    useEffect(() => {
        if (walletAddress) {
            localStorage.setItem(`cart_${walletAddress}`, JSON.stringify(cartItems));
        }
    }, [cartItems, walletAddress]);

    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find(item => item._id === product._id);
            if (existingItem) {
                return prevItems.map(item =>
                    item._id === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
    };

    const decreaseQuantity = (productId) => {
        setCartItems(prevItems => prevItems.map(item => {
            if (item._id === productId) {
                return { ...item, quantity: Math.max(1, item.quantity - 1) };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCartItems([]);
        if (walletAddress) {
            localStorage.removeItem(`cart_${walletAddress}`);
        }
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price_eth * item.quantity), 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            decreaseQuantity,
            clearCart,
            getCartTotal,
            getCartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};