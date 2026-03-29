import { Link } from 'react-router-dom';
import handWithBeer from '../assets/hand_with_beer.png';

export default function Home() {
    return (
        <div className="fixed top-20 left-0 right-0 bottom-0 overflow-hidden bg-white flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-start h-full relative z-10">
                <div className="w-full lg:w-5/12 flex flex-col items-start text-left lg:ml-10">
                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-gray-900 mb-6 leading-[1.1]">
                        Настоящий крафт. <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
                            За крипту.
                        </span>
                    </h1>

                    <p className="text-lg text-gray-500 mb-12 max-w-lg leading-relaxed">
                        Покупайте свежесваренное пиво напрямую через смарт-контракт. Никаких банков и посредников, только чистый вкус и прозрачность блокчейна.
                    </p>

                    <Link
                        to="/catalog"
                        className="group flex items-center gap-3 text-2xl font-semibold text-gray-900 hover:text-black transition-all"
                    >
                        Каталог
                        <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                </div>
            </div>

            <div className="absolute right-0 bottom-0 h-full w-auto flex items-center justify-end z-0">
                <img
                    src={handWithBeer}
                    alt="Craft Beer Bottle"
                    className="h-full w-auto object-contain object-right lg:translate-x-[10%] xl:translate-x-[8%]"
                />
            </div>
        </div>
    );
}