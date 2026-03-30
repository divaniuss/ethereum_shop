import { Link } from 'react-router-dom';
import fourOhfour from '../assets/fourOhfour.png';

export default function NotFound() {
    return (
        <div className="fixed top-20 left-0 right-0 bottom-0 overflow-hidden w-full flex flex-col items-center justify-center px-6 bg-white text-center z-10">

            <div className="w-full flex justify-center mb-10">
                <img
                    src={fourOhfour}
                    alt="404 - Страница не найдена"
                    className="w-[46%] max-w-3xl h-auto object-contain drop-shadow-sm"
                />
            </div>


            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-10 uppercase">
                Not Found
            </h1>


            <Link
                to="/"
                className="group flex items-center gap-3 text-2xl font-semibold text-gray-900 hover:text-black transition-all"
            >
                На Главную страницу

                <span className="inline-block transition-transform group-hover:translate-x-1">
                    {'>'}
                </span>
            </Link>

        </div>
    );
}