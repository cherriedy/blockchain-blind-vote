import {useRouter} from 'next/router';
import {useEffect} from 'react';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        const studentId = localStorage.getItem('studentId');
        const walletAddress = localStorage.getItem('walletAddress');
        if (studentId && walletAddress) {
            router.push('/dashboard');
        } else {
            router.push('/register');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );
}
