import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Helper to ensure we always have a valid URL
const getImageUrl = (img: string | { uri: string }) => {
    const src = typeof img === 'string' ? img : img.uri;
    if (src.startsWith("http")) return src;
    // If it's just a CID, prepend the gateway
    return `https://gold-endless-fly-679.mypinata.cloud/ipfs/${src}`;
};

interface ImageCarouselProps {
    images: (string | { uri: string })[]; // Handles both ["cid1", "cid2"] or [{uri: "url"}, ...]
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-64 bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
                No images available
            </div>
        );
    }

    const prevSlide = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const nextSlide = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    return (
        <div className="w-full h-72 md:h-96 relative group">

            {/* Main Image Container */}
            <div
                className="w-full h-full rounded-2xl bg-center bg-cover duration-500 ease-in-out"
                style={{ backgroundImage: `url(${getImageUrl(images[currentIndex])})` }}
            >
                {/* Optional: Dark gradient overlay for text readability if needed */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent rounded-2xl"></div>
            </div>

            {/* Left Arrow */}
            {images.length > 1 && (
                <div
                    className="hidden group-hover:block absolute top-[50%] translate-x-0 translate-y-[-50%] left-5 text-2xl rounded-full p-2 bg-black/50 text-white cursor-pointer hover:bg-black/70 transition-all"
                    onClick={prevSlide}
                >
                    <ChevronLeft size={30} />
                </div>
            )}

            {/* Right Arrow */}
            {images.length > 1 && (
                <div
                    className="hidden group-hover:block absolute top-[50%] translate-x-0 translate-y-[-50%] right-5 text-2xl rounded-full p-2 bg-black/50 text-white cursor-pointer hover:bg-black/70 transition-all"
                    onClick={nextSlide}
                >
                    <ChevronRight size={30} />
                </div>
            )}

            {/* Dots / Indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, slideIndex) => (
                        <div
                            key={slideIndex}
                            onClick={() => goToSlide(slideIndex)}
                            className={`transition-all duration-300 cursor-pointer rounded-full
                                ${currentIndex === slideIndex
                                    ? "bg-green-300 w-8 h-2"  // Active dot is wider (pill shape)
                                    : "bg-white/50 hover:bg-white w-2 h-2"
                                }`}
                        ></div>
                    ))}
                </div>
            )}

            {/* Image Counter Badge (Top Right) */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white border border-white/10">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    );
};

export default ImageCarousel;