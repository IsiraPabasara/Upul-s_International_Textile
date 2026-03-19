import axios from "axios";
// import { useCart } from '@/app/hooks/useCart';
// import { useWishlist } from '@/app/hooks/useWishlist';

declare module "axios" {
    export interface AxiosRequestConfig {
        isPublic?: boolean;
    }
}

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
    withCredentials:true,
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const handleLogout = () => {
    // useCart.getState().clearCart();
    // useCart.persist.clearStorage();
    // useWishlist.getState().clearWishlist();
    // useWishlist.persist.clearStorage();
    // if (typeof window !== 'undefined') {
    //     localStorage.removeItem('eshop-cart-storage');
    //     localStorage.removeItem('eshop-wishlist-storage');
    // }
    if(window.location.pathname != "/login") {
        window.location.href = "/login";
    }
}

// Handle adding a new access token to queued requests
const subscribeTokenRefresh = (callback: () => void) => {
    refreshSubscribers.push(callback);
}

// Execute queued requests after refresh
const onRefreshSuccess = () => {
    refreshSubscribers.forEach((callback) => callback());
    refreshSubscribers = [];
}

// Handle API requests
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
)

// Handle expired tokens and refresh tokens
axiosInstance.interceptors.response.use(
    (response) => response,

    async(error) => {
        const originalRequest = error.config;

        // Prevent infinite retry loop
        if(error.response?.status === 401 && !originalRequest._retry) {
            if(isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh(() => resolve(axiosInstance(originalRequest)));
                })
            }
            originalRequest._retry = true;
            isRefreshing = true;

            try{
                await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/refresh-token`, {}, {withCredentials: true});
                isRefreshing=false;
                onRefreshSuccess();

                return axiosInstance(originalRequest);
            } catch(error) {
                isRefreshing = false;
                refreshSubscribers = [];

                if (!originalRequest?.isPublic) {
                    handleLogout();
                }
                
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    } 
    
)

export default axiosInstance;