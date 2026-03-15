import '@/styles/globals.css' // Dòng này cực kỳ quan trọng để hiện màu sắc, font chữ
export default function App({ Component, pageProps }) {
    return <Component {...pageProps} />
}