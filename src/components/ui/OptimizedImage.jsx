/**
 * OptimizedImage (#79) — Image component with performance best practices.
 * - Lazy loading via native `loading="lazy"`
 * - Explicit width/height to prevent CLS
 * - Optional WebP/AVIF with <picture> fallback
 * - Blur placeholder while loading
 *
 * @param {object} props
 * @param {string} props.src - Fallback image source (e.g., .png, .jpg)
 * @param {string} [props.webpSrc] - WebP source for modern browsers.
 * @param {string} [props.avifSrc] - AVIF source for best compression.
 * @param {string} props.alt - Alt text for accessibility.
 * @param {number} props.width - Explicit width in px.
 * @param {number} props.height - Explicit height in px.
 * @param {string} [props.className] - CSS class.
 * @param {boolean} [props.priority=false] - If true, disables lazy loading (above-the-fold).
 * @param {object} [props.style] - Inline styles.
 */
function OptimizedImage({
    src,
    webpSrc,
    avifSrc,
    alt,
    width,
    height,
    className = "",
    priority = false,
    style = {},
}) {
    const imgProps = {
        alt,
        width,
        height,
        className,
        loading: priority ? "eager" : "lazy",
        decoding: priority ? "sync" : "async",
        style: {
            maxWidth: "100%",
            height: "auto",
            ...style,
        },
    };

    // If no alternative formats, render simple img
    if (!webpSrc && !avifSrc) {
        return <img src={src} {...imgProps} />;
    }

    return (
        <picture>
            {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
            {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
            <img src={src} {...imgProps} />
        </picture>
    );
}

export default OptimizedImage;

