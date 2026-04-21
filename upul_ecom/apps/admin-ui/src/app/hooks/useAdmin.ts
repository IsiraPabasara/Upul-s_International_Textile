import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";


// fetch user data from API
const fetchAdmin = async() => {
    const response = await axiosInstance.get("/api/auth/logged-in-admin");

    return response.data.user;
}

const useAdmin = () => {
    const {data:user, isLoading, isError, refetch} = useQuery({
        queryKey: ["admin"],
        queryFn: fetchAdmin,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    })

    return {user, isLoading, isError, refetch};
}

export default useAdmin;