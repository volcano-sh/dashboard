import {useEffect, useState} from "react"

export const useDebouncedValue = (value, delay = 200) =>{
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(()=>{
        const timeoutId = setTimeout(()=>{
            setDebouncedValue(value)
        },delay)

        return ()=> clearTimeout(timeoutId);
    },[value,delay]);

    return debouncedValue;
};