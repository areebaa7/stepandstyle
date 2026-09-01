import Image from 'next/image';
import Link from 'next/link';
import type { BannerDTO } from '@/types/banner';
import ScrollAnimate from './ScrollAnimate';

interface DynamicSectionProps {
  banner?: BannerDTO | null;
  defaultImage: string;
  defaultMobileImage: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultDescription: string;
  defaultCtaText: string;
  defaultCtaLink: string;
  accentColor: string;
  eager?: boolean;
  desktopTextPosition?: 'OVERLAY' | 'OUTSIDE_LEFT' | 'OUTSIDE_RIGHT';
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

export default function DynamicSection({
  banner,
  defaultImage,
  defaultMobileImage,
  defaultTitle,
  defaultSubtitle,
  defaultDescription,
  defaultCtaText,
  defaultCtaLink,
  eager = false,
  desktopTextPosition
}: DynamicSectionProps) {
  const textPosition = desktopTextPosition || banner?.textPosition || 'OUTSIDE_RIGHT';
  const desktopImage = banner
    ? (banner.desktopImageSlot ?? 1) === 2 ? banner.mobileImageUrl : banner.desktopImageUrl
    : defaultImage;
  const mobileImage = banner
    ? (banner.mobileImageSlot ?? 2) === 1 ? banner.desktopImageUrl : banner.mobileImageUrl
    : defaultMobileImage;
  const title = banner?.title || defaultTitle;
  const ctaText = banner?.ctaText || defaultCtaText;
  const ctaLink = banner?.ctaLink || defaultCtaLink;
  const heading = toTitleCase(banner?.title || `${defaultTitle} ${defaultSubtitle}`);

  return (
    <section className="my-3 md:my-5 lg:my-6 bg-[#FAF9FF]">
      {/* Desktop View */}
      {textPosition === 'OVERLAY' ? (
        <div className="hidden md:block relative w-full h-[500px] max-w-[1600px] mx-auto overflow-hidden">
          <Image
            src={desktopImage}
            alt={title}
            fill
            loading={eager ? 'eager' : 'lazy'}
            sizes="(min-width: 768px) 100vw, 0px"
            className="object-cover transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-6">
            <ScrollAnimate animation="fade-in">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold  tracking-tight leading-tight text-white drop-shadow-lg mb-2">
                {heading}
              </h2>
              <p className="text-white/90 text-lg md:text-2xl font-light drop-shadow-md mb-6 max-w-2xl mx-auto">
                {banner?.subtitle ? banner.subtitle : defaultDescription}
              </p>
              <Link
                href={ctaLink}
                className="inline-block bg-white text-black px-10 md:px-12 py-4 md:py-5 text-xs md:text-sm font-semibold  tracking-wide hover:bg-gray-100 transition-all duration-300 shadow-xl mt-6"
              >
                {ctaText}
              </Link>
            </ScrollAnimate>
          </div>
        </div>
      ) : (
        <div className="hidden md:grid w-full grid-cols-2 items-stretch min-h-[500px]">
          <div className={`relative w-full h-full min-h-[400px] ${textPosition === 'OUTSIDE_LEFT' ? 'order-2' : 'order-1'}`}>
            <Image
              src={desktopImage}
              alt={title}
              fill
            loading={eager ? 'eager' : 'lazy'}
              sizes="(min-width: 768px) 50vw, 0px"
              className="object-cover transition-all duration-1000"
            />
          </div>
          <div className={`flex flex-col justify-center p-12 lg:p-24 space-y-6 bg-white ${textPosition === 'OUTSIDE_LEFT' ? 'order-1' : 'order-2'}`}>
            <ScrollAnimate animation="slide-in-right">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold  tracking-tight leading-tight text-[#0B1727]">
                {heading}
              </h2>
              <p className="text-gray-500 text-lg md:text-xl font-light leading-relaxed max-w-lg mt-6">
                {banner?.subtitle ? banner.subtitle : defaultDescription}
              </p>
              <Link
                href={ctaLink}
                className="inline-block bg-[#F3E8FF] text-[#6B21A8] px-10 py-5 text-sm font-semibold  tracking-wide hover:bg-[#6B21A8] hover:text-white transition-all duration-300 shadow-sm mt-10"
              >
                {ctaText}
              </Link>
            </ScrollAnimate>
          </div>
        </div>
      )}

      {/* Mobile View */}
      <div className="block md:hidden relative h-[380px] w-full overflow-hidden">
        <Image
          src={mobileImage}
          alt={title}
          fill
            loading={eager ? 'eager' : 'lazy'}
          sizes="(max-width: 767px) 100vw, 0px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-purple-950/15" />
        <div className="absolute inset-0 flex flex-col justify-end p-8 text-center space-y-3">
          <ScrollAnimate animation="fade-in">
            <h3 className="text-3xl font-semibold  tracking-tight text-white leading-tight">
              {heading}
            </h3>
            <p className="text-white/80 text-xs mt-2 font-medium">
              {banner?.subtitle ? banner.subtitle : defaultDescription}
            </p>
            <div className="pt-4">
              <Link
                href={ctaLink}
                className="inline-block bg-white text-black hover:bg-[#E9D5FF] hover:text-[#6B21A8] px-8 py-3.5 text-xs font-semibold  tracking-wide transition-all duration-300 shadow-xl"
              >
                {ctaText}
              </Link>
            </div>
          </ScrollAnimate>
        </div>
      </div>
    </section>
  );
}
